// Magic-byte signatures for the allowed image formats.
// We inspect the actual uploaded bytes rather than trusting client-supplied
// MIME type or file extension, which can be spoofed to smuggle HTML/SVG and
// achieve same-origin XSS (uploads are served from the origin that holds the
// auth cookie).
//
// SVG is INTENTIONALLY excluded from this allow-list. SVG is markup that can
// embed <script> and event handlers, so even served with `nosniff` and a
// restrictive CSP it remains the single most dangerous image format for XSS
// when stored and served from your own origin. Do NOT add SVG here without a
// separate sandboxing/isolation story (e.g. serving from an isolated origin).
interface MagicSignature {
  contentType: string;
  ext: string;
  // Offsets are relative to the start of the file.
  // `prefix` must match at offset 0; optional `check` matches at the given
  // offset (used for WebP where the format name appears at offset 8).
  prefix: number[];
  check?: { offset: number; bytes: number[] };
}

const MAGIC_SIGNATURES: readonly MagicSignature[] = [
  {
    contentType: 'image/jpeg',
    ext: 'jpg',
    prefix: [0xff, 0xd8, 0xff],
  },
  {
    contentType: 'image/png',
    ext: 'png',
    prefix: [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a],
  },
  {
    contentType: 'image/gif',
    ext: 'gif',
    prefix: [0x47, 0x49, 0x46, 0x38], // "GIF8"
  },
  {
    contentType: 'image/webp',
    ext: 'webp',
    prefix: [0x52, 0x49, 0x46, 0x46], // "RIFF"
    check: { offset: 8, bytes: [0x57, 0x45, 0x42, 0x50] }, // "WEBP"
  },
];

const MAX_IMAGE_SIZE = 2 * 1024 * 1024; // 2MB
const IMPORT_IMAGE_FETCH_TIMEOUT_MS = 4500;
const IMPORT_IMAGE_CONCURRENCY = 8;
const IMAGE_CONTENT_TYPES_BY_EXTENSION: Readonly<Record<string, string>> = {
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  gif: 'image/gif',
  webp: 'image/webp',
};


// Restrictive CSP applied to every served image. `default-src 'none'` blocks
// all resource loading, scripting, framing, and connections. img-src 'self'
// permits the image itself to load in an <img> context only.
const IMAGE_CSP = "default-src 'none'; img-src 'self'; style-src 'none'; script-src 'none'";

function generateKey(accountId: string, ext: string): string {
  const uuid = crypto.randomUUID();
  return `${accountId}/${uuid}.${ext}`;
}

async function importKey(accountId: string, sourceUrl: string, contentDigest: string, ext: string): Promise<string> {
  const material = `${sourceUrl}\u0000${contentDigest}`;
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(material));
  const hex = [...new Uint8Array(digest)]
    .slice(0, 12)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
  return `${accountId}/import-${hex}.${ext}`;
}

function isDubMenuUploadUrl(value: string, appUrl?: string): boolean {
  if (value.startsWith('/api/uploads/')) return true;
  if (!appUrl) return false;
  try {
    const url = new URL(value);
    const app = new URL(appUrl);
    return url.origin === app.origin && url.pathname.startsWith('/api/uploads/');
  } catch {
    return false;
  }
}

async function mapWithConcurrency<T>(
  items: T[],
  concurrency: number,
  fn: (item: T) => Promise<void>
): Promise<void> {
  let next = 0;
  const workers = Array.from({ length: Math.min(concurrency, items.length) }, async () => {
    while (next < items.length) {
      const item = items[next++];
      await fn(item);
    }
  });
  await Promise.all(workers);
}

async function fetchImportedImage(sourceUrl: string): Promise<{ body: Blob; detected: MagicSignature; size: number; contentDigest: string } | null> {
  let url: URL;
  try {
    url = new URL(sourceUrl);
  } catch {
    return null;
  }
  if (url.protocol !== 'https:') return null;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), IMPORT_IMAGE_FETCH_TIMEOUT_MS);
  try {
    const res = await fetch(url.toString(), {
      headers: { Accept: 'image/jpeg,image/png,image/webp,image/gif;q=0.9,*/*;q=0.1' },
      signal: controller.signal,
    });
    if (!res.ok || !res.body) return null;
    const declaredLength = Number(res.headers.get('content-length'));
    if (Number.isFinite(declaredLength) && declaredLength > MAX_IMAGE_SIZE) {
      await res.body.cancel();
      return null;
    }
    const reader = res.body.getReader();
    const chunks: Uint8Array[] = [];
    let size = 0;
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      if (!value) continue;
      size += value.byteLength;
      if (size > MAX_IMAGE_SIZE) {
        await reader.cancel();
        return null;
      }
      chunks.push(value);
    }
    const bytes = new Uint8Array(size);
    let offset = 0;
    for (const chunk of chunks) {
      bytes.set(chunk, offset);
      offset += chunk.byteLength;
    }
    const detected = detectImage(bytes);
    if (!detected) return null;
    const exactBuffer = bytes.buffer as ArrayBuffer;
    const digest = await crypto.subtle.digest('SHA-256', exactBuffer);
    const contentDigest = Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, '0')).join('');
    return { body: new Blob([exactBuffer], { type: detected.contentType }), detected, size, contentDigest };
  } catch {
    return null;
  } finally {
    clearTimeout(timeout);
  }
}

async function ingestImportedImage(
  sourceUrl: string,
  env: { UPLOADS?: R2Bucket; APP_URL?: string },
  accountId: string,
  cache: Map<string, Promise<string | undefined>>
): Promise<string | undefined> {
  if (!sourceUrl || isDubMenuUploadUrl(sourceUrl, env.APP_URL)) return sourceUrl;
  if (!env.UPLOADS) return undefined;
  let pending = cache.get(sourceUrl);
  if (!pending) {
    pending = (async () => {
      try {
        const image = await fetchImportedImage(sourceUrl);
        if (!image) return undefined;
        const key = await importKey(accountId, sourceUrl, image.contentDigest, image.detected.ext);
        await env.UPLOADS!.put(key, image.body, {
          httpMetadata: { contentType: image.detected.contentType },
          customMetadata: {
            originalName: sanitizeFilename(new URL(sourceUrl).pathname.split('/').pop() || 'imported-image'),
            sourceUrl: sourceUrl.slice(0, 256),
            contentType: image.detected.contentType,
            size: String(image.size),
          },
        });
        return `${env.APP_URL || ''}/api/uploads/${key}`;
      } catch {
        return undefined;
      }
    })();
    cache.set(sourceUrl, pending);
  }
  return pending;
}

function bytesEqual(buf: Uint8Array, offset: number, expected: readonly number[]): boolean {
  if (offset + expected.length > buf.length) return false;
  for (let i = 0; i < expected.length; i++) {
    if (buf[offset + i] !== expected[i]) return false;
  }
  return true;
}

// Inspect the leading bytes of the uploaded file and return the matching
// signature, or null if no allowed format matches. This is the sole source of
// truth for both accept/reject and the contentType stored in R2.
function detectImage(bytes: Uint8Array): MagicSignature | null {
  for (const sig of MAGIC_SIGNATURES) {
    if (!bytesEqual(bytes, 0, sig.prefix)) continue;
    if (sig.check && !bytesEqual(bytes, sig.check.offset, sig.check.bytes)) continue;
    return sig;
  }
  return null;
}

// Sanitize a filename for use in a Content-Disposition header value. Strips
// anything that is not alphanumeric, dot, dash, or underscore and truncates,
// so it cannot break out of the quoted-string or inject CRLF.
function sanitizeFilename(name: string): string {
  const cleaned = (name || '').replace(/[^A-Za-z0-9._-]/g, '_').slice(0, 64);
  return cleaned.length > 0 ? cleaned : 'image';
}

type UploadedFile = {
  size: number;
  name: string;
  arrayBuffer(): Promise<ArrayBuffer>;
};

function isUploadedFile(value: unknown): value is UploadedFile {
  return typeof value === 'object' && value !== null
    && 'size' in value && typeof value.size === 'number'
    && 'name' in value && typeof value.name === 'string'
    && 'arrayBuffer' in value && typeof value.arrayBuffer === 'function';
}

export async function bundleImportedImages<T extends {
  logo?: unknown;
  showImages?: unknown;
  categories?: Array<{ products?: Array<{ image?: unknown }> }>;
  specials?: Array<{ image?: unknown }>;
}>(
  config: T,
  env: { UPLOADS?: R2Bucket; APP_URL?: string },
  accountId: string
): Promise<{ config: T; warnings: string[] }> {
  const warnings: string[] = [];
  const cache = new Map<string, Promise<string | undefined>>();
  const rewrite = async (value: unknown, label: string): Promise<string | undefined> => {
    if (typeof value !== 'string' || !value.trim()) return undefined;
    const bundled = await ingestImportedImage(value.trim(), env, accountId, cache);
    if (!bundled && value.trim().startsWith('http')) {
      warnings.push(`Image omitted for ${label}: DubMenu could not ingest a safe HTTPS image`);
    }
    return bundled;
  };

  const logo = await rewrite(config.logo, 'logo');
  if (logo) config.logo = logo;
  else if (typeof config.logo === 'string' && config.logo.startsWith('http')) delete config.logo;

  const shouldBundleProductImages = config.showImages !== false;
  const categories = Array.isArray(config.categories) ? config.categories : [];
  for (const category of categories) {
    const products = Array.isArray(category.products) ? category.products : [];
    await mapWithConcurrency(products, IMPORT_IMAGE_CONCURRENCY, async (product) => {
      if (!shouldBundleProductImages) {
        if (typeof product.image === 'string' && product.image.startsWith('http')) delete product.image;
        return;
      }
      const bundled = await rewrite(product.image, 'product');
      if (bundled) product.image = bundled;
      else if (typeof product.image === 'string' && product.image.startsWith('http')) delete product.image;
    });
  }

  const specials = Array.isArray(config.specials) ? config.specials : [];
  await mapWithConcurrency(specials, IMPORT_IMAGE_CONCURRENCY, async (special) => {
    const bundled = await rewrite(special.image, 'special');
    if (bundled) special.image = bundled;
    else if (typeof special.image === 'string' && special.image.startsWith('http')) delete special.image;
  });

  return { config, warnings };
}

export async function handleImageUpload(
  request: Request,
  env: { UPLOADS?: R2Bucket; APP_URL?: string },
  accountId: string
): Promise<Response> {
  if (!env.UPLOADS) {
    return new Response(JSON.stringify({ error: 'Upload storage not configured' }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
  if (request.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405, headers: { 'Content-Type': 'application/json' } });
  }

  const contentType = request.headers.get('content-type') || '';
  if (!contentType.includes('multipart/form-data')) {
    return new Response(JSON.stringify({ error: 'Expected multipart/form-data' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
  }

  const form = await request.formData();
  const file = form.get('file');
  if (!isUploadedFile(file)) {
    return new Response(JSON.stringify({ error: 'Missing file' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
  }
  if (file.size > MAX_IMAGE_SIZE) {
    return new Response(JSON.stringify({ error: 'File too large. Max 2MB' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
  }

  // Validate by magic bytes — do NOT trust file.type or file.name.
  const buffer = await file.arrayBuffer();
  const detected = detectImage(new Uint8Array(buffer));
  if (!detected) {
    return new Response(JSON.stringify({ error: 'Invalid file type. Allowed: JPEG, PNG, WebP, GIF' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
  }

  // Use the extension derived from the validated magic bytes for the R2 key
  // so the key always reflects the real format, regardless of the client name.
  const ext = detected.ext;
  const fileContentType = detected.contentType;
  const key = generateKey(accountId, ext);
  // Re-wrap as a Blob so R2 receives a streamable body with the correct length.
  const body = new Blob([buffer], { type: fileContentType });
  await env.UPLOADS.put(key, body, {
    httpMetadata: {
      contentType: fileContentType,
    },
    customMetadata: {
      originalName: sanitizeFilename(file.name),
      // Mirror the validated contentType into customMetadata so R2 list()
      // results are self-sufficient. The list API does not reliably surface
      // httpMetadata across runtimes, and the gallery needs the type without
      // an extra head() per object.
      contentType: fileContentType,
      size: String(buffer.byteLength),
    },
  });
  const url = `${env.APP_URL || ''}/api/uploads/${key}`;
  return new Response(JSON.stringify({ ok: true, url, key }), { status: 200, headers: { 'Content-Type': 'application/json' } });
}

// List and delete every R2 object under `<accountId>/`. R2's list API returns
// at most 1000 objects per call, so we loop on `cursor` until the listing is
// exhausted. Returns the total number of objects deleted. Best-effort: a failed
// individual delete is swallowed so the rest of the cascade still completes
// (the caller — account deletion — is irreversible regardless).
export async function deleteAccountUploads(
  env: { UPLOADS?: R2Bucket },
  accountId: string
): Promise<number> {
  if (!env.UPLOADS) return 0;
  const prefix = `${accountId}/`;
  let deleted = 0;
  let cursor: string | undefined;
  do {
    const listed = await env.UPLOADS.list({ prefix, cursor, limit: 1000 });
    const keys = listed.objects.map((o) => o.key);
    await mapWithConcurrency(keys, IMPORT_IMAGE_CONCURRENCY, async (key) => {
      try {
        await env.UPLOADS!.delete(key);
        deleted++;
      } catch {
        // Account deletion is irreversible; continue removing every other object.
      }
    });
    cursor = listed.truncated ? listed.cursor : undefined;
  } while (cursor);
  return deleted;
}

export interface AccountUpload {
  key: string;
  size: number;
  uploaded: Date;
  contentType: string;
  originalName?: string;
}

// List every R2 object under `<accountId>/` and return a normalized array
// suitable for the image-library gallery. Pagination follows `cursor` until
// the listing is exhausted, capped at 10 pages (10,000 objects) as a runaway
// guard.
//
// Field resolution prioritizes the native R2 listed-object fields (size,
// uploaded) and falls back to customMetadata/httpMetadata so the function
// stays correct even if a future caller stores redundant copies there. The
// returned `key` has the `<accountId>/` prefix stripped so the frontend gets a
// clean filename it can reassemble into a serve URL.
export async function listAccountUploads(
  env: { UPLOADS?: R2Bucket },
  accountId: string
): Promise<AccountUpload[]> {
  if (!env.UPLOADS) return [];
  const prefix = `${accountId}/`;
  const out: AccountUpload[] = [];
  let cursor: string | undefined;
  let pages = 0;
  do {
    const listed = await env.UPLOADS.list({ prefix, cursor, limit: 1000 });
    for (const obj of listed.objects) {
      const httpMeta = obj.httpMetadata || {};
      const customMeta = obj.customMetadata || {};
      // Prefer metadata embedded in the list result. On real Cloudflare R2
      // both httpMetadata and customMetadata are populated; some local
      // emulators surface them empty, so fall back to a head() lookup when
      // neither has a contentType.
      let contentType =
        customMeta.contentType ||
        httpMeta.contentType ||
        '';
      let originalName = customMeta.originalName || undefined;
      if (!contentType) {
        try {
          const head = await env.UPLOADS.head(obj.key);
          if (head) {
            const headHttp = head.httpMetadata || {};
            const headCustom = head.customMetadata || {};
            contentType =
              headCustom.contentType ||
              headHttp.contentType ||
              'application/octet-stream';
            originalName = originalName || headCustom.originalName || undefined;
          }
        } catch {
          // best-effort enrichment; fall through with default below
        }
        if (!contentType) {
          const extension = obj.key.split('.').pop()?.toLowerCase() || '';
          contentType = IMAGE_CONTENT_TYPES_BY_EXTENSION[extension] || 'application/octet-stream';
        }
      }
      // R2 listed objects expose `size` and `uploaded` (a Date) natively.
      // customMetadata.size/uploaded are accepted as fallbacks for parity with
      // the spec but are not written by the current upload path.
      const size =
        typeof obj.size === 'number'
          ? obj.size
          : Number(customMeta.size) || 0;
      let uploaded: Date;
      if (obj.uploaded instanceof Date) {
        uploaded = obj.uploaded;
      } else if (customMeta.uploaded) {
        const parsed = new Date(customMeta.uploaded);
        uploaded = isNaN(parsed.getTime()) ? new Date(0) : parsed;
      } else {
        uploaded = new Date(0);
      }
      out.push({
        key: obj.key.startsWith(prefix) ? obj.key.slice(prefix.length) : obj.key,
        size,
        uploaded,
        contentType,
        ...(originalName ? { originalName } : {}),
      });
    }
    cursor = listed.truncated ? listed.cursor : undefined;
    pages++;
  } while (cursor && pages < 10);
  // Newest first.
  out.sort((a, b) => b.uploaded.getTime() - a.uploaded.getTime());
  return out;
}

// Reject filenames that could escape the `<accountId>/` key prefix. R2 keys
// are flat strings, but a `/` or `\` in `filename` would let a caller target a
// different prefix, and `..` segments are rejected as a defense-in-depth
// measure against any future layer that treats the key as a path. Returns the
// validated filename or null when invalid.
function validateFilename(filename: string): string | null {
  if (!filename || filename.length > 512) return null;
  if (filename.includes('/') || filename.includes('\\')) return null;
  // Reject any `..` segment, whether path-like or embedded.
  if (filename.includes('..')) return null;
  // Reject NUL and control bytes outright (checked by code point to avoid a
  // control-character regex that trips lint's no-control-regex rule).
  for (let i = 0; i < filename.length; i++) {
    const code = filename.charCodeAt(i);
    if (code < 0x20 || code === 0x7f) return null;
  }
  return filename;
}

// Delete a single upload owned by `accountId`. The key is reconstructed as
// `<accountId>/<filename>` after path-traversal validation. Returns true when
// an object existed and was deleted, false when the key was not found. Throws
// when `filename` fails validation so the caller can map it to a 400.
export async function deleteUpload(
  env: { UPLOADS?: R2Bucket },
  accountId: string,
  filename: string
): Promise<boolean> {
  // Validate first so path-traversal is rejected even when storage is
  // unavailable — the security check must not depend on binding state.
  const safe = validateFilename(filename);
  if (safe === null) {
    throw new Error('Invalid filename');
  }
  if (!env.UPLOADS) return false;
  const fullKey = `${accountId}/${safe}`;
  // Check existence first so we can distinguish 404 from 200. R2's delete is
  // idempotent (no error on missing key), so without the head it would always
  // look successful.
  const existing = await env.UPLOADS.head(fullKey);
  if (!existing) return false;
  await env.UPLOADS.delete(fullKey);
  return true;
}

export async function serveImage(
  request: Request,
  env: { UPLOADS?: R2Bucket },
  key: string
): Promise<Response> {
  if (!env.UPLOADS) {
    return new Response('Upload storage not configured', { status: 500 });
  }
  if (request.method !== 'GET') {
    return new Response('Method not allowed', { status: 405 });
  }
  const object = await env.UPLOADS.get(key);
  if (!object) {
    return new Response('Not found', { status: 404 });
  }
  const headers = new Headers();
  // Start from stored HTTP metadata (etag, etc.), then OVERRIDE Content-Type
  // so we never blindly echo a stale or attacker-influenced value. The
  // contentType was set at upload time from validated magic bytes.
  object.writeHttpMetadata(headers);
  const storedType = object.httpMetadata?.contentType;
  if (storedType && /^image\/(jpeg|png|gif|webp)$/.test(storedType)) {
    headers.set('Content-Type', storedType);
  } else {
    // Unknown or missing stored type: force a safe default and nosniff below
    // so the browser does not guess. Preferring binary prevents rendering as
    // HTML/SVG if metadata was ever tampered with.
    headers.set('Content-Type', 'application/octet-stream');
  }
  headers.set('etag', object.httpEtag);
  // Defense in depth: stop the browser from sniffing a different type than the
  // one we declared, and block framing/scripting/style injection.
  headers.set('X-Content-Type-Options', 'nosniff');
  headers.set('Content-Security-Policy', IMAGE_CSP);
  headers.set('X-Frame-Options', 'DENY');
  // Suggest inline display using the sanitized original name if we stored one.
  const originalName = object.customMetadata?.originalName;
  if (originalName) {
    headers.set('Content-Disposition', `inline; filename="${originalName}"`);
  } else {
    headers.set('Content-Disposition', 'inline');
  }
  // Uploads are immutable once written; cache aggressively at the edge.
  headers.set('Cache-Control', 'public, max-age=31536000, immutable');
  // Product images are public and may be rendered on customer-owned domains.
  // Anonymous CORS lets the TV renderer inspect loaded pixels without tainting
  // its canvas while still forbidding credentialed cross-origin access.
  headers.set('Access-Control-Allow-Origin', '*');
  return new Response(object.body, { headers });
}

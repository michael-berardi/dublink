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

// Restrictive CSP applied to every served image. `default-src 'none'` blocks
// all resource loading, scripting, framing, and connections. img-src 'self'
// permits the image itself to load in an <img> context only.
const IMAGE_CSP = "default-src 'none'; img-src 'self'; style-src 'none'; script-src 'none'";

function generateKey(accountId: string, ext: string): string {
  const uuid = crypto.randomUUID();
  return `${accountId}/${uuid}.${ext}`;
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
  if (!file || !(file instanceof File)) {
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
    if (keys.length > 0) {
      await env.UPLOADS.delete(keys);
      deleted += keys.length;
    }
    cursor = listed.truncated ? listed.cursor : undefined;
  } while (cursor);
  return deleted;
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
  return new Response(object.body, { headers });
}

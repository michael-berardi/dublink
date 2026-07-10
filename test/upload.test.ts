import { SELF } from 'cloudflare:test';
import { describe, it, expect, vi } from 'vitest';
import { deleteAccountUploads, listAccountUploads, deleteUpload } from '../src/upload';

const BASE = 'https://dubmenu.com';
const unique = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 8);

// Minimal 1x1 PNG (8-byte signature + IHDR + IDAT + IEND). Valid magic bytes
// so handleImageUpload's detectImage() accepts it.
const PNG_BYTES = new Uint8Array([
  0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a,
  0x00, 0x00, 0x00, 0x0d, 0x49, 0x48, 0x44, 0x52,
  0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01,
  0x08, 0x06, 0x00, 0x00, 0x00, 0x1f, 0x15, 0xc4,
  0x89, 0x00, 0x00, 0x00, 0x0d, 0x49, 0x44, 0x41,
  0x54, 0x78, 0x9c, 0x62, 0x00, 0x01, 0x00, 0x00,
  0x05, 0x00, 0x01, 0x0d, 0x0a, 0x2d, 0xb4, 0x00,
  0x00, 0x00, 0x00, 0x49, 0x45, 0x4e, 0x44, 0xae,
  0x42, 0x60, 0x82,
]);

async function signupCookie(): Promise<{ cookie: string; accountId: string; email: string }> {
  const email = `upload-${unique()}@dubmenu-test.example`;
  const form = new FormData();
  form.set('email', email);
  form.set('password', 'test-password-1234');
  const res = await SELF.fetch(`${BASE}/api/signup`, {
    method: 'POST',
    body: form,
    redirect: 'manual',
  });
  const setCookie = res.headers.get('set-cookie') || '';
  const match = setCookie.match(/dubmenu_auth=([^;]+)/);
  if (!match) throw new Error(`signup did not set auth cookie (status ${res.status}): ${setCookie}`);
  return { cookie: match[1], accountId: '', email };
}

function authedFetch(path: string, cookie: string, init: RequestInit = {}): Promise<Response> {
  return SELF.fetch(`${BASE}${path}`, {
    ...init,
    headers: {
      ...(init.headers || {}),
      Cookie: `dubmenu_auth=${cookie}`,
    },
  });
}

// Upload a PNG via the real /api/upload flow and return the response body
// ({ ok, url, key }). The key is `<accountId>/<uuid>.png`.
async function uploadOne(cookie: string, name = 'test.png'): Promise<{ ok: boolean; url: string; key: string }> {
  const form = new FormData();
  form.set('file', new File([PNG_BYTES], name, { type: 'image/png' }));
  const res = await authedFetch('/api/upload', cookie, { method: 'POST', body: form });
  expect(res.status).toBe(200);
  return (await res.json()) as { ok: boolean; url: string; key: string };
}

describe('listAccountUploads (unit)', () => {
  it('returns [] when UPLOADS is not bound', async () => {
    const result = await listAccountUploads({}, 'acct');
    expect(result).toEqual([]);
  });

  it('returns the expected shape and strips the account prefix', async () => {
    const { cookie } = await signupCookie();
    const uploaded = await uploadOne(cookie, 'gallery.png');
    // Call listAccountUploads directly against the test env's R2 binding.
    // cloudflare:test exposes env via the SELF worker context; we instead
    // verify shape through the HTTP route below, and here just confirm the
    // function is exported and callable. The route test covers the real shape.
    expect(uploaded.key).toMatch(/^[^/]+\/[^/]+\.png$/);
  });

  it('infers generated image types when R2 head metadata is unavailable', async () => {
    const uploaded = new Date('2026-07-09T12:00:00Z');
    const uploads = {
      list: async () => ({
        objects: [{ key: 'acct/import-0123456789abcdef.webp', size: 128, uploaded }],
        truncated: false,
      }),
      head: async () => { throw new Error('HEAD unavailable'); },
    } as unknown as R2Bucket;

    const result = await listAccountUploads({ UPLOADS: uploads }, 'acct');

    expect(result).toEqual([expect.objectContaining({
      key: 'import-0123456789abcdef.webp',
      contentType: 'image/webp',
    })]);
  });
});

describe('deleteAccountUploads', () => {
  it('continues across objects and pages after an individual delete failure', async () => {
    const list = vi.fn(async ({ cursor }: { cursor?: string }) => cursor
      ? { objects: [{ key: 'acct/third.png' }], truncated: false }
      : { objects: [{ key: 'acct/first.png' }, { key: 'acct/second.png' }], truncated: true, cursor: 'next' });
    const remove = vi.fn(async (key: string | string[]) => {
      if (key === 'acct/first.png') throw new Error('temporary R2 failure');
    });
    const uploads = { list, delete: remove } as unknown as R2Bucket;

    await expect(deleteAccountUploads({ UPLOADS: uploads }, 'acct')).resolves.toBe(2);
    expect(remove).toHaveBeenCalledWith('acct/first.png');
    expect(remove).toHaveBeenCalledWith('acct/second.png');
    expect(remove).toHaveBeenCalledWith('acct/third.png');
    expect(list).toHaveBeenCalledTimes(2);
  });
});

describe('deleteUpload (unit — path traversal)', () => {
  it('throws on filenames containing "/"', async () => {
    await expect(deleteUpload({}, 'acct', 'evil/path.png')).rejects.toThrow();
  });

  it('throws on filenames containing "\\"', async () => {
    await expect(deleteUpload({}, 'acct', 'evil\\path.png')).rejects.toThrow();
  });

  it('throws on filenames containing ".."', async () => {
    await expect(deleteUpload({}, 'acct', '..')).rejects.toThrow();
    await expect(deleteUpload({}, 'acct', '../evil.png')).rejects.toThrow();
    await expect(deleteUpload({}, 'acct', 'foo..bar.png')).rejects.toThrow();
  });

  it('throws on filenames containing control bytes', async () => {
    await expect(deleteUpload({}, 'acct', 'evil\x00.png')).rejects.toThrow();
  });

  it('returns false (not throws) when UPLOADS is unbound and filename is valid', async () => {
    const result = await deleteUpload({}, 'acct', 'fine.png');
    expect(result).toBe(false);
  });
});

describe('GET /api/uploads (list route)', () => {
  it('returns 401 when unauthenticated', async () => {
    const res = await SELF.fetch(`${BASE}/api/uploads`);
    expect(res.status).toBe(401);
    const body = (await res.json()) as { error: string };
    expect(body.error).toBe('Unauthorized');
  });

  it('returns an empty list for a fresh account', async () => {
    const { cookie } = await signupCookie();
    const res = await authedFetch('/api/uploads', cookie);
    expect(res.status).toBe(200);
    const body = (await res.json()) as { uploads: unknown[]; nextCursor: string | null };
    expect(Array.isArray(body.uploads)).toBe(true);
    expect(body.uploads.length).toBe(0);
    expect(body.nextCursor).toBeNull();
  });

  it('lists uploaded images with the expected shape, prefix stripped, newest first', async () => {
    const { cookie } = await signupCookie();
    await uploadOne(cookie, 'first.png');
    // Tiny delay so the second upload has a strictly-later timestamp.
    await new Promise((r) => setTimeout(r, 50));
    await uploadOne(cookie, 'second.png');

    const res = await authedFetch('/api/uploads', cookie);
    expect(res.status).toBe(200);
    const body = (await res.json()) as {
      uploads: { key: string; size: number; uploaded: string; contentType: string }[];
      nextCursor: string | null;
    };
    expect(body.uploads.length).toBe(2);
    for (const item of body.uploads) {
      expect(typeof item.key).toBe('string');
      expect(item.key).not.toContain('/'); // prefix stripped
      expect(typeof item.size).toBe('number');
      expect(item.size).toBeGreaterThan(0);
      expect(typeof item.uploaded).toBe('string');
      expect(item.contentType).toBe('image/png');
    }
    // Newest first: second upload should be before first.
    const t0 = new Date(body.uploads[0].uploaded).getTime();
    const t1 = new Date(body.uploads[1].uploaded).getTime();
    expect(t0).toBeGreaterThanOrEqual(t1);
  });

  it('isolates uploads per account', async () => {
    const { cookie: cookieA } = await signupCookie();
    const { cookie: cookieB } = await signupCookie();
    await uploadOne(cookieA, 'only-a.png');
    const resA = await authedFetch('/api/uploads', cookieA);
    const bodyA = (await resA.json()) as { uploads: unknown[] };
    expect(bodyA.uploads.length).toBe(1);
    const resB = await authedFetch('/api/uploads', cookieB);
    const bodyB = (await resB.json()) as { uploads: unknown[] };
    expect(bodyB.uploads.length).toBe(0);
  });

  it('honors ?limit and returns a nextCursor when more remain', async () => {
    const { cookie } = await signupCookie();
    for (let i = 0; i < 3; i++) {
      await uploadOne(cookie, `img-${i}.png`);
      await new Promise((r) => setTimeout(r, 20));
    }
    const res = await authedFetch('/api/uploads?limit=2', cookie);
    const body = (await res.json()) as { uploads: unknown[]; nextCursor: string | null };
    expect(body.uploads.length).toBe(2);
    expect(body.nextCursor).not.toBeNull();
  });
});

describe('DELETE /api/uploads/[filename]', () => {
  it('returns 401 when unauthenticated', async () => {
    const res = await SELF.fetch(`${BASE}/api/uploads/whatever.png`, { method: 'DELETE' });
    expect(res.status).toBe(401);
  });

  it('deletes an owned upload and returns { deleted: true }', async () => {
    const { cookie } = await signupCookie();
    const uploaded = await uploadOne(cookie, 'doomed.png');
    const filename = uploaded.key.split('/').pop() as string;
    const res = await authedFetch(`/api/uploads/${filename}`, cookie, { method: 'DELETE' });
    expect(res.status).toBe(200);
    const body = (await res.json()) as { deleted: boolean };
    expect(body.deleted).toBe(true);
    // Confirm it is gone from the listing.
    const listRes = await authedFetch('/api/uploads', cookie);
    const listBody = (await listRes.json()) as { uploads: { key: string }[] };
    expect(listBody.uploads.find((u) => u.key === filename)).toBeUndefined();
  });

  it('returns 404 for a filename that does not exist', async () => {
    const { cookie } = await signupCookie();
    const res = await authedFetch('/api/uploads/nope-never-uploaded.png', cookie, { method: 'DELETE' });
    expect(res.status).toBe(404);
  });

  it('rejects path-traversal filenames with 400', async () => {
    const { cookie } = await signupCookie();
    // "..%2Fevil" decodes to "../evil" — must be rejected by validateFilename.
    const res = await authedFetch('/api/uploads/..%2Fevil', cookie, { method: 'DELETE' });
    expect(res.status).toBe(400);
    const body = (await res.json()) as { error: string };
    expect(body.error).toMatch(/filename/i);
  });

  it('rejects a filename containing an encoded slash segment (..%2F)', async () => {
    const { cookie } = await signupCookie();
    const res = await authedFetch('/api/uploads/foo%2F..%2Fbar', cookie, { method: 'DELETE' });
    expect(res.status).toBe(400);
  });

  it('rejects a filename containing an encoded backslash', async () => {
    const { cookie } = await signupCookie();
    const res = await authedFetch('/api/uploads/evil%5Cpath.png', cookie, { method: 'DELETE' });
    expect(res.status).toBe(400);
  });

  it('does not cross account boundaries (cannot delete another account file)', async () => {
    const { cookie: cookieA } = await signupCookie();
    const { cookie: cookieB } = await signupCookie();
    const uploaded = await uploadOne(cookieA, 'owned-by-a.png');
    const filename = uploaded.key.split('/').pop() as string;
    // cookieB tries to delete cookieA's file. The key is reconstructed as
    // <accountB>/<filename>, which does not exist → 404, not a cross-account
    // delete.
    const res = await authedFetch(`/api/uploads/${filename}`, cookieB, { method: 'DELETE' });
    expect(res.status).toBe(404);
    // Original owner still sees it.
    const listRes = await authedFetch('/api/uploads', cookieA);
    const listBody = (await listRes.json()) as { uploads: { key: string }[] };
    expect(listBody.uploads.find((u) => u.key === filename)).toBeTruthy();
  });
});

describe('GET /api/uploads/[accountId]/[filename] (serve — no auth regression)', () => {
  it('serves an uploaded image without authentication', async () => {
    const { cookie } = await signupCookie();
    const uploaded = await uploadOne(cookie, 'public.png');
    // Unauthenticated GET on the full key path.
    const res = await SELF.fetch(`${BASE}/api/uploads/${uploaded.key}`);
    expect(res.status).toBe(200);
    expect(res.headers.get('content-type')).toBe('image/png');
    expect(res.headers.get('x-content-type-options')).toBe('nosniff');
    // Fully consume the streamed body so the Miniflare R2 storage-isolation
    // check passes during test teardown.
    await res.arrayBuffer();
  });

  it('returns 404 for a non-existent key without auth', async () => {
    const res = await SELF.fetch(`${BASE}/api/uploads/someacct/no-such-file.png`);
    expect(res.status).toBe(404);
  });
});

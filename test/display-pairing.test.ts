import { SELF } from 'cloudflare:test';
import { describe, expect, it } from 'vitest';

const BASE = 'https://dubmenu.com';
const unique = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 8);

async function signupCookie(): Promise<string> {
  const form = new FormData();
  form.set('email', `display-pairing-${unique()}@dubmenu-test.example`);
  form.set('password', 'test-password-1234');
  const response = await SELF.fetch(`${BASE}/api/signup`, {
    method: 'POST',
    body: form,
    redirect: 'manual',
  });
  const match = (response.headers.get('set-cookie') || '').match(/dubmenu_auth=([^;]+)/);
  if (!match) throw new Error('Sign-up did not set an auth cookie');
  return match[1];
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

async function claimCanonicalMenu(cookie: string, sessionId: string): Promise<void> {
  const response = await authedFetch(`/config/${sessionId}`, cookie);
  expect(response.status).toBe(200);
}

async function setDisplayCount(cookie: string, sessionId: string, displayCount: number): Promise<void> {
  const response = await SELF.fetch(`${BASE}/ws/${sessionId}?role=phone`, {
    headers: { Upgrade: 'websocket', Cookie: `dubmenu_auth=${cookie}` },
  });
  const phone = response.webSocket;
  if (!phone) throw new Error('Expected phone WebSocket');
  phone.accept();
  const updated = new Promise<void>((resolve) => {
    phone.addEventListener('message', (event) => {
      const message = JSON.parse(String(event.data)) as { type?: string; payload?: { displayCount?: number } };
      if (message.type === 'config' && message.payload?.displayCount === displayCount) resolve();
    });
  });
  phone.send(JSON.stringify({ type: 'config_update', payload: { displayCount } }));
  await updated;
  phone.close(1000, 'test complete');
}

function assignmentTokenFromHtml(html: string): string {
  const match = html.match(/var assignmentToken='([a-zA-Z0-9_-]+)'/);
  if (!match) throw new Error('Pairing page did not include an assignment token');
  return match[1];
}

describe('resumed multi-display QR setup', () => {
  it('asks which display was scanned and exposes one-to-four count controls', async () => {
    const cookie = await signupCookie();
    const canonicalSession = `CANONICAL-${unique()}`;
    const scannedSession = `SCANNED-${unique()}`;
    await claimCanonicalMenu(cookie, canonicalSession);
    await setDisplayCount(cookie, canonicalSession, 3);
    const tvResponse = await SELF.fetch(`${BASE}/ws/${scannedSession}?role=tv`, {
      headers: { Upgrade: 'websocket' },
    });
    const tv = tvResponse.webSocket;
    if (!tv) throw new Error('Expected scanned TV WebSocket');
    tv.accept();

    const response = await authedFetch(`/config/${scannedSession}`, cookie);
    expect(response.status).toBe(200);
    const html = await response.text();
    expect(html).toContain('Which display is this?');
    expect(html).toContain('id="displayCountDecrease"');
    expect(html).toContain('id="displayCountIncrease"');
    expect(html).toContain('id="displaySlotChoices"');
    expect(html).toContain('data-display-count="3"');
    expect(html).toContain('Display 1');
    expect(html).toContain('Display 2');
    expect(html).toContain('Display 3');
    expect(html).not.toContain('Display 5');
    expect(assignmentTokenFromHtml(html)).toMatch(/^[a-zA-Z0-9_-]+$/);
    tv.close(1000, 'test complete');
  });

  it('assigns the scanned TV, updates the stored count, and targets the canonical menu URL', async () => {
    const cookie = await signupCookie();
    const canonicalSession = `CANONICAL-${unique()}`;
    const scannedSession = `SCANNED-${unique()}`;
    await claimCanonicalMenu(cookie, canonicalSession);
    await setDisplayCount(cookie, canonicalSession, 2);

    const tvResponse = await SELF.fetch(`${BASE}/ws/${scannedSession}?role=tv`, {
      headers: { Upgrade: 'websocket' },
    });
    const tv = tvResponse.webSocket;
    if (!tv) throw new Error('Expected scanned TV WebSocket');
    tv.accept();
    const promptHtml = await (await authedFetch(`/config/${scannedSession}`, cookie)).text();
    const assignmentToken = assignmentTokenFromHtml(promptHtml);

    const assignment = new Promise<{ url?: string }>((resolve) => {
      tv.addEventListener('message', (event) => {
        const message = JSON.parse(String(event.data)) as { type?: string; payload?: { url?: string } };
        if (message.type === 'display_assignment') resolve(message.payload || {});
      });
    });
    const response = await authedFetch('/api/pair-display', cookie, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ scannedSession, canonicalSession, assignmentToken, displayNumber: 3, displayCount: 4 }),
    });
    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({
      success: true,
      redirectUrl: `/config/${canonicalSession}?pairedDisplay=3`,
    });
    expect(await assignment).toEqual({
      url: `/tv/${canonicalSession}?display=3&displays=4`,
    });

    const exported = await authedFetch(`/api/export/${canonicalSession}`, cookie);
    expect(exported.status).toBe(200);
    expect((await exported.json()) as { displayCount?: number }).toMatchObject({ displayCount: 4 });
    tv.close(1000, 'test complete');
  });

  it('marks active physical display slots but ignores embedded previews', async () => {
    const cookie = await signupCookie();
    const canonicalSession = `CANONICAL-${unique()}`;
    const scannedSession = `SCANNED-${unique()}`;
    await claimCanonicalMenu(cookie, canonicalSession);
    await setDisplayCount(cookie, canonicalSession, 3);

    const physicalResponse = await SELF.fetch(`${BASE}/ws/${canonicalSession}?role=tv&display=1`, {
      headers: { Upgrade: 'websocket' },
    });
    const previewResponse = await SELF.fetch(`${BASE}/ws/${canonicalSession}?role=tv&display=2&embed=1`, {
      headers: { Upgrade: 'websocket' },
    });
    const scannedResponse = await SELF.fetch(`${BASE}/ws/${scannedSession}?role=tv`, {
      headers: { Upgrade: 'websocket' },
    });
    const physical = physicalResponse.webSocket;
    const preview = previewResponse.webSocket;
    const scannedTv = scannedResponse.webSocket;
    if (!physical || !preview || !scannedTv) throw new Error('Expected TV WebSockets');
    physical.accept();
    preview.accept();
    scannedTv.accept();

    const response = await authedFetch(`/config/${scannedSession}`, cookie);
    const html = await response.text();
    expect(html).toContain('data-active-displays="1"');
    expect(html).toContain('data-display-number="1" data-active="true"');
    expect(html).toContain('data-display-number="2" data-active="false"');

    physical.close(1000, 'test complete');
    preview.close(1000, 'test complete');
    scannedTv.close(1000, 'test complete');
  });

  it('does not reduce the saved count below an active display number', async () => {
    const cookie = await signupCookie();
    const canonicalSession = `CANONICAL-${unique()}`;
    const scannedSession = `SCANNED-${unique()}`;
    await claimCanonicalMenu(cookie, canonicalSession);
    await setDisplayCount(cookie, canonicalSession, 4);

    const activeResponse = await SELF.fetch(`${BASE}/ws/${canonicalSession}?role=tv&display=3`, {
      headers: { Upgrade: 'websocket' },
    });
    const scannedResponse = await SELF.fetch(`${BASE}/ws/${scannedSession}?role=tv`, {
      headers: { Upgrade: 'websocket' },
    });
    const activeTv = activeResponse.webSocket;
    const scannedTv = scannedResponse.webSocket;
    if (!activeTv || !scannedTv) throw new Error('Expected TV WebSockets');
    activeTv.accept();
    scannedTv.accept();
    const promptHtml = await (await authedFetch(`/config/${scannedSession}`, cookie)).text();
    const assignmentToken = assignmentTokenFromHtml(promptHtml);

    const response = await authedFetch('/api/pair-display', cookie, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ scannedSession, canonicalSession, assignmentToken, displayNumber: 1, displayCount: 2 }),
    });
    expect(response.status).toBe(409);
    expect(await response.json()).toEqual({
      error: 'Disconnect Display 3 before reducing the display count',
    });
    const exported = await authedFetch(`/api/export/${canonicalSession}`, cookie);
    expect((await exported.json()) as { displayCount?: number }).toMatchObject({ displayCount: 4 });

    activeTv.close(1000, 'test complete');
    scannedTv.close(1000, 'test complete');
  });

  it('prompts on repeated scans until every saved display is connected', async () => {
    const cookie = await signupCookie();
    const canonicalSession = `CANONICAL-${unique()}`;
    await claimCanonicalMenu(cookie, canonicalSession);
    await setDisplayCount(cookie, canonicalSession, 3);
    const connectedDisplays: WebSocket[] = [];

    for (let displayNumber = 1; displayNumber <= 3; displayNumber += 1) {
      const scannedSession = `SCANNED-${displayNumber}-${unique()}`;
      const scannedResponse = await SELF.fetch(`${BASE}/ws/${scannedSession}?role=tv`, {
        headers: { Upgrade: 'websocket' },
      });
      const scannedTv = scannedResponse.webSocket;
      if (!scannedTv) throw new Error('Expected scanned TV WebSocket');
      scannedTv.accept();

      const prompt = await authedFetch(`/config/${scannedSession}`, cookie);
      const html = await prompt.text();
      const assignmentToken = assignmentTokenFromHtml(html);
      expect(html).toContain('Which display is this?');
      if (displayNumber > 1) {
        expect(html).toContain(`data-active-displays="${Array.from(
          { length: displayNumber - 1 },
          (_, index) => index + 1
        ).join(',')}"`);
      }

      const assignment = await authedFetch('/api/pair-display', cookie, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scannedSession, canonicalSession, assignmentToken, displayNumber, displayCount: 3 }),
      });
      expect(assignment.status).toBe(200);
      scannedTv.close(1000, 'assigned');

      const connectedResponse = await SELF.fetch(
        `${BASE}/ws/${canonicalSession}?role=tv&display=${displayNumber}`,
        { headers: { Upgrade: 'websocket' } }
      );
      const connectedTv = connectedResponse.webSocket;
      if (!connectedTv) throw new Error('Expected connected display WebSocket');
      connectedTv.accept();
      connectedDisplays.push(connectedTv);
    }

    const afterCapacity = await authedFetch(`/config/SCANNED-${unique()}`, cookie);
    const afterCapacityHtml = await afterCapacity.text();
    expect(afterCapacityHtml).toContain('DubMenu Remote Control');
    expect(afterCapacityHtml).not.toContain('Which display is this?');
    const accountResponse = await authedFetch('/api/sessions', cookie);
    expect((await accountResponse.json()) as { business?: { menuSessionId?: string } }).toMatchObject({
      business: { menuSessionId: canonicalSession },
    });

    connectedDisplays.forEach((socket) => socket.close(1000, 'test complete'));
  });

  it('refuses to assign a stale QR code after its TV disconnects', async () => {
    const cookie = await signupCookie();
    const canonicalSession = `CANONICAL-${unique()}`;
    const scannedSession = `SCANNED-${unique()}`;
    await claimCanonicalMenu(cookie, canonicalSession);
    await setDisplayCount(cookie, canonicalSession, 2);
    const tvResponse = await SELF.fetch(`${BASE}/ws/${scannedSession}?role=tv`, {
      headers: { Upgrade: 'websocket' },
    });
    const tv = tvResponse.webSocket;
    if (!tv) throw new Error('Expected scanned TV WebSocket');
    tv.accept();
    const promptHtml = await (await authedFetch(`/config/${scannedSession}`, cookie)).text();
    const assignmentToken = assignmentTokenFromHtml(promptHtml);
    tv.close(1000, 'stale before assignment');

    const response = await authedFetch('/api/pair-display', cookie, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ scannedSession, canonicalSession, assignmentToken, displayNumber: 2, displayCount: 4 }),
    });
    expect(response.status).toBe(409);
    expect(await response.json()).toEqual({ error: 'Unable to connect this TV' });
    const exported = await authedFetch(`/api/export/${canonicalSession}`, cookie);
    expect((await exported.json()) as { displayCount?: number }).toMatchObject({ displayCount: 2 });
  });

  it('reserves a selected slot while its assigned TV reconnects', async () => {
    const cookie = await signupCookie();
    const canonicalSession = `CANONICAL-${unique()}`;
    await claimCanonicalMenu(cookie, canonicalSession);
    await setDisplayCount(cookie, canonicalSession, 3);

    const scans = await Promise.all([1, 2].map(async () => {
      const scannedSession = `SCANNED-${unique()}`;
      const response = await SELF.fetch(`${BASE}/ws/${scannedSession}?role=tv`, {
        headers: { Upgrade: 'websocket' },
      });
      const tv = response.webSocket;
      if (!tv) throw new Error('Expected scanned TV WebSocket');
      tv.accept();
      const html = await (await authedFetch(`/config/${scannedSession}`, cookie)).text();
      return { scannedSession, assignmentToken: assignmentTokenFromHtml(html), tv };
    }));

    const responses = await Promise.all(scans.map(({ scannedSession, assignmentToken }) =>
      authedFetch('/api/pair-display', cookie, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          scannedSession,
          canonicalSession,
          assignmentToken,
          displayNumber: 2,
          displayCount: 3,
        }),
      })
    ));
    expect(responses.map((response) => response.status).sort()).toEqual([200, 409]);
    const rejected = responses.find((response) => response.status === 409);
    expect(await rejected?.json()).toEqual({ error: 'Display 2 is already connected' });
    scans.forEach(({ tv }) => tv.close(1000, 'test complete'));
  });

  it('refuses an ambiguous scanned session with multiple physical TVs', async () => {
    const cookie = await signupCookie();
    const canonicalSession = `CANONICAL-${unique()}`;
    const scannedSession = `SCANNED-${unique()}`;
    await claimCanonicalMenu(cookie, canonicalSession);
    await setDisplayCount(cookie, canonicalSession, 2);

    const responses = await Promise.all([1, 2].map(() =>
      SELF.fetch(`${BASE}/ws/${scannedSession}?role=tv`, {
        headers: { Upgrade: 'websocket' },
      })
    ));
    const televisions = responses.map((response) => response.webSocket);
    if (televisions.some((television) => !television)) throw new Error('Expected scanned TV WebSockets');
    televisions.forEach((television) => television?.accept());

    const html = await (await authedFetch(`/config/${scannedSession}`, cookie)).text();
    expect(html).toContain('Unable to identify one waiting TV');
    expect(html).not.toContain('Which display is this?');
    televisions.forEach((television) => television?.close(1000, 'test complete'));
  });

  it('keeps untouched single-display accounts on the normal configuration flow', async () => {
    const cookie = await signupCookie();
    const canonicalSession = `CANONICAL-${unique()}`;
    await claimCanonicalMenu(cookie, canonicalSession);

    const response = await authedFetch(`/config/SCANNED-${unique()}`, cookie);
    expect(response.status).toBe(200);
    const html = await response.text();
    expect(html).toContain('DubMenu Remote Control');
    expect(html).not.toContain('Which display is this?');
  });
});

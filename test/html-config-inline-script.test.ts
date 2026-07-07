import { describe, it, expect } from 'vitest';
import { configPage } from '../src/html-config';

describe('configPage inline script', () => {
  it('renders a parseable inline script', () => {
    const html = configPage('test-session-id', 'https://dubmenu.com');
    const match = html.match(/<script>([\s\S]*?)<\/script>/);
    expect(match).toBeTruthy();
    const script = match![1];

    // Guard against HTML prematurely closing the script tag.
    expect(script).not.toContain('</script>');
    expect(script).not.toContain('<!--');

    // Parsing with the Function constructor is a lightweight, no-exec
    // syntax check that works in the Workers vitest pool where node --check
    // and child_process are unavailable.
    expect(() => new Function(script)).not.toThrow();
  });
});

describe('configPage remote-control UI', () => {
  const html = configPage('test-session-id', 'https://dubmenu.com');

  it('labels the page as a remote control, not a menu', () => {
    expect(html).toContain('DubMenu — Remote Control');
    expect(html).toContain('DubMenu Remote Control');
    expect(html).toContain('This is your operator panel');
  });

  it('routes Open TV Display to the TV display URL, not the menu or config', () => {
    // The primary TV display link must point at /tv/<session>.
    expect(html).toMatch(/href="https:\/\/tv\.dubmenu\.com\/tv\/test-session-id"/);
    // It must not route to the customer menu or back to the config page.
    expect(html).not.toMatch(/href="https:\/\/[^"]*\/menu\/test-session-id"/);
    expect(html).not.toMatch(/href="https:\/\/[^"]*\/config\/test-session-id"/);
  });

  it('labels the simulator as a preview', () => {
    expect(html).toContain('TV Preview');
    expect(html).not.toContain('TV Simulator');
  });

  it('opens TV preview from a compact control on narrow screens', () => {
    // The large mobile preview card should be gone so settings stay primary.
    expect(html).not.toContain('mobile-preview-card');
    expect(html).not.toContain('See what customers see on the TV before you open it on a display.');
    // A compact floating button should open the existing modal.
    expect(html).toContain('mobile-preview-fab');
    expect(html).toContain('openMobilePreview');
    expect(html).toContain('mobilePreviewModal');
    expect(html).toContain('mobilePreviewModalFrame');
  });

  it('includes a closable TV preview modal', () => {
    expect(html).toContain('mobilePreviewClose');
    expect(html).toContain('closeMobilePreview');
    expect(html).toContain('mobilePreviewKeydown');
  });
});

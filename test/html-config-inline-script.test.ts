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

  it('labels the page as a compact remote control, not an operator copy block', () => {
    expect(html).toContain('DubMenu — Remote Control');
    expect(html).toContain('DubMenu Remote Control');
    expect(html).toContain('inline-status');
    expect(html).not.toContain('This is your operator panel');
    expect(html).not.toContain('Open TV Display on TV');
    expect(html).not.toContain('Copy TV URL');
    expect(html).not.toContain('tvDisplayLink');
  });

  it('labels the simulator as a preview', () => {
    expect(html).toContain('TV Preview');
    expect(html).not.toContain('TV Simulator');
  });

  it('opens TV preview from an in-flow control below the remote grid', () => {
    expect(html).not.toContain('mobile-preview-card');
    expect(html).not.toContain('See what customers see on the TV before you open it on a display.');
    expect(html).toContain('mobile-preview-fab remote-preview-button');
    expect(html).toContain('openMobilePreview');
    expect(html).toContain('mobilePreviewModal');
    expect(html).toContain('mobilePreviewModalFrame');
  });

  it('includes a closable TV preview modal', () => {
    expect(html).toContain('mobilePreviewClose');
    expect(html).toContain('closeMobilePreview');
    expect(html).toContain('mobilePreviewKeydown');
  });

  it('collapses secondary phone controls into a six-button remote', () => {
    expect(html).toContain('mobile-control-hub');
    expect(html).toContain("openControlSection('brand')");
    expect(html).toContain("openControlSection('design')");
    expect(html).toContain("openControlSection('promos')");
    expect(html).toContain("openControlSection('inventory')");
    expect(html).toContain("openControlSection('legal')");
    expect(html).toContain("openControlSection('import')");
    expect(html).toContain('id="section-import"');
    expect(html).toContain('id="section-design"');
    expect(html).toContain('id="section-inventory"');
    expect(html).toContain('closeControlSection');
    expect(html).toContain('body:not(.section-open){height:100dvh;overflow:hidden;}');
  });

  it('places JSON backup actions inside the Import section', () => {
    expect(html).toContain('Settings Backup');
    expect(html).toContain('Export Settings');
    expect(html).toContain('Import Settings');
    expect(html).toContain('id="importInput"');
  });

  it('shows mobile-friendly Dutchie import progress and result quality details', () => {
    expect(html).toContain('dutchieProgress');
    expect(html).toContain('dutchieProgressFill');
    expect(html).toContain('Find the menu feed or browser-rendered product cards');
    expect(html).toContain('Import product photos, prices, THC, strain, brand, and weights');
    expect(html).toContain('dutchieResults');
    expect(html).toContain('imageCountFromImport');
    expect(html).toContain('missing-photo products render as clean text rows, not icons');
  });

  it('separates color themes from layout controls', () => {
    expect(html).toContain('Color Theme');
    expect(html).toContain('Menu color theme');
    expect(html).toContain('Default Layout');
    expect(html).toContain('Auto (grid)');
    expect(html).not.toContain('Auto (match theme)');
  });

  it('generates per-screen layout override URLs', () => {
    expect(html).toContain('SCREEN_LAYOUT_OPTIONS');
    expect(html).toContain('setScreenLayout');
    expect(html).toContain('tvUrlForScreen');
    expect(html).toContain('&layout=');
    expect(html).toContain('screen-layout-select');
  });
});

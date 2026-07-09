import { describe, it, expect } from 'vitest';
import { configPage } from '../src/html-config';

function between(source: string, start: string, end: string): string {
  const s = source.indexOf(start);
  if (s === -1) return '';
  const e = source.indexOf(end, s + start.length);
  return source.slice(s, e === -1 ? undefined : e + end.length);
}

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

  it('uploads logos directly from the Brand section and sends the uploaded URL to the TV', () => {
    expect(html).toContain('id="logoFile"');
    expect(html).toContain('uploadLogoImage(this)');
    expect(html).toContain('function uploadLogoImage(input)');
    expect(html).toContain("sendConfig('logo',url)");
  });

  it('makes the specials card actionable instead of a dead-looking heading', () => {
    expect(html).toContain('ensureSpecialsOpen(event)');
    expect(html).toContain('function ensureSpecialsOpen');
    expect(html).toContain('Open / Add');
  });

  it('places JSON backup actions in the TV preview options area, not the import card', () => {
    const importSection = between(html, '<section class="control-section" id="section-import"', '</section>');
    const simulatorPanel = between(html, '<aside id="simulatorPanel"', '</aside>');
    expect(importSection).toBeTruthy();
    expect(simulatorPanel).toBeTruthy();
    expect(importSection).not.toContain('Settings Backup');
    expect(importSection).not.toContain('Export Settings');
    expect(importSection).not.toContain('Import Settings');
    expect(simulatorPanel).toContain('Export Settings');
    expect(simulatorPanel).toContain('Import Settings');
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

  it('includes deterministic reference style importer controls', () => {
    expect(html).toContain('Template Intelligence');
    expect(html).toContain('referenceStyleUrl');
    expect(html).toContain('referenceStyleNotes');
    expect(html).toContain('analyzeReferenceStyle');
    expect(html).toContain('styleProfile');
    expect(html).toContain('No competitor assets or HTML copied');
    expect(html).toContain('canSend');
    expect(html).toContain('Reconnect before applying reference style');
  });

  it('generates per-screen layout override URLs', () => {
    expect(html).toContain('SCREEN_LAYOUT_OPTIONS');
    expect(html).toContain('setScreenLayout');
    expect(html).toContain('tvUrlForScreen');
    expect(html).toContain('&layout=');
    expect(html).toContain('screen-layout-select');
  });
});

describe('configPage setup wizard', () => {
  const html = configPage('test-session-id', 'https://dubmenu.com');
  const scriptMatch = html.match(/<script>([\s\S]*?)<\/script>/);
  const script = scriptMatch ? scriptMatch[1] : '';

  it('renders a setup wizard shell for the blank/no-products state', () => {
    expect(html).toContain('<section class="setup-wizard" id="setupWizard"');
    expect(html).toContain('id="setupWizardTitle"');
    expect(html).toContain('Build your TV menu from one source.');
    expect(script).toContain('function runSetupWizard()');
  });

  it('wizard includes menu URL, style notes, display count, and settings JSON import', () => {
    expect(html).toContain('id="wizardMenuUrl"');
    expect(html).toContain('id="wizardStyleNotes"');
    expect(html).toContain('id="wizardDisplayCount"');
    expect(html).toContain('Import Settings JSON');
    expect(html).toContain('id="importInput"');
  });

  it('starts an import job with style notes and display count, then polls progress', () => {
    expect(script).toContain("'/api/import/jobs'");
    expect(script).toContain('pollImportJob(startData.statusUrl');
    expect(script).toContain('styleNotes:');
    expect(script).toContain('displayCount:');
  });

  it('preserves wizard and import display count after late config renders', () => {
    expect(html).toContain("this.dataset.userSet='1';var target=document.getElementById('dutchieDisplayCount');if(target)target.value=this.value");
    expect(html).toContain("<select id=\"dutchieDisplayCount\" onchange=\"this.dataset.userSet='1'\"");
    expect(script).toContain("display.dataset.userSet!=='1'");
    expect(script).toContain("wizardDisplays.dataset.userSet!=='1'");
  });

  it('normalizes QR wizard store domains before importing through the same endpoint', () => {
    expect(script).toContain("var target=document.getElementById('dutchieUrl')");
    expect(script).toContain("if(target)target.value=url");
    expect(script).toContain("url='https://'+url");
  });

  it('keeps large Dutchie imports visible as a long-running job', () => {
    expect(script).toContain('Starting an import job');
    expect(script).toContain('progress will update here');
    expect(script).toContain('Import debug log');
    expect(script).toContain('Trying the direct importer');
  });

  it('gates normal controls behind the wizard until products have been imported', () => {
    expect(script).toContain('function needsSetupWizard()');
    expect(script).toContain('function menuProductCount(');
    expect(script).toContain('function updateSetupWizard()');
    expect(script).toContain("wizard.classList.toggle('active',need)");
    expect(script).toContain("document.body.classList.toggle('wizard-body-lock',need)");
  });
});

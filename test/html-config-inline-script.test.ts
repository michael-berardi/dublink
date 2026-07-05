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

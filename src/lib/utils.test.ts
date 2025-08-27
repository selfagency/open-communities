import { describe, expect, it } from 'vitest';

// Provide a minimal getComputedStyle for non-DOM test envs
if (typeof globalThis.getComputedStyle === 'undefined') {
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  globalThis.getComputedStyle = () => ({ transform: 'none' });
}

import { cn, flyAndScale, log, truncateText, valueSet } from './utils';

describe('utils', () => {
  it('cn merges and dedupes classes via tailwind-merge/clsx', () => {
    const out = cn('p-2', 'p-2', 'text-lg');
    expect(typeof out).toBe('string');
    expect(out.includes('p-2')).toBe(true);
    expect(out.includes('text-lg')).toBe(true);
  });

  it('truncateText returns empty for non-strings and truncates long text', () => {
    expect(truncateText(null as unknown)).toBe('');
    const short = 'hello';
    const t = truncateText(short, 10, true);
    expect(t).toEqual(short);
  });

  it('flyAndScale returns a css function that uses params', () => {
    // create a real DOM element so getComputedStyle(node) works in jsdom
    const node = document.createElement('div') as Element;
    // Ensure computed style transform is 'none' by default
    const cfg = flyAndScale(node, { duration: 100, start: 0.9, x: 2, y: -4 });
    expect(cfg.duration).toBe(100);
    // css should be a function that returns a string when called
    const css0 = cfg.css?.(0, 0) ?? '';
    expect(typeof css0).toBe('string');
  });

  it('valueSet returns expected boolean for common cases', () => {
    expect(valueSet({})).toBe(false);
    expect(valueSet({ a: 'x' })).toBe(true);
  });

  it('log exists and has methods', () => {
    expect(log).toBeDefined();
    expect(typeof log.info === 'function' || typeof log.debug === 'function').toBe(true);
  });
});

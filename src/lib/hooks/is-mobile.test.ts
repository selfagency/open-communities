import { describe, expect, it } from 'vitest';

import { IsMobile } from '$lib/hooks/is-mobile.svelte';

describe('IsMobile', () => {
  it('creates a media query with default breakpoint', () => {
    const instance = new IsMobile();
    expect(instance).toBeDefined();
    expect(typeof instance.current).toBe('boolean');
  });

  it('creates a media query with custom breakpoint', () => {
    const instance = new IsMobile(1024);
    expect(instance).toBeDefined();
    expect(typeof instance.current).toBe('boolean');
  });
});

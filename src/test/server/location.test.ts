import { describe, expect, it } from 'vitest';

describe('Location class', () => {
  it('exports Location class', async () => {
    const mod = await import('../../lib/location');
    expect(mod.Location).toBeDefined();
    expect(typeof mod.Location).toBe('function');
  });

  it('constructs with countries', async () => {
    const { Location } = await import('../../lib/location');
    const loc = new Location({
      countries: [{ code: 'US', flag: '\u{1F1FA}\u{1F1F8}', id: 'us', name: 'United States' }]
    } as any);
    expect(loc).toBeDefined();
    const state = loc.state.get();
    expect(state.localities.countries).toHaveLength(1);
    expect(state.localities.countries[0].code).toBe('US');
  });

  it('handles empty countries', async () => {
    const { Location } = await import('../../lib/location');
    const loc = new Location({ countries: [] });
    expect(loc.state.get().localities.countries).toEqual([]);
  });
});

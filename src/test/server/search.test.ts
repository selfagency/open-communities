import { describe, expect, it } from 'vitest';

describe('Search class', () => {
  it('initializes with congregation data', async () => {
    const { Search } = await import('../../lib/search');
    const search = new Search([
      { denomination: 'Reform', id: '1', name: 'Beth Israel', visible: true },
      { denomination: 'Conservative', id: '2', name: 'Temple Sinai', visible: true }
    ]);
    expect(search.data).toHaveLength(2);
  });

  it('handles empty data', async () => {
    const { Search } = await import('../../lib/search');
    const search = new Search([]);
    expect(search.data).toEqual([]);
  });

  it('sorts data alphabetically by name', async () => {
    const { Search } = await import('../../lib/search');
    const search = new Search([
      { denomination: 'Orthodox', id: '3', name: 'Zion Temple', visible: true },
      { denomination: 'Reform', id: '1', name: 'Beth Israel', visible: true }
    ]);
    expect(search.data[0].name).toBe('Beth Israel');
    expect(search.data[1].name).toBe('Zion Temple');
  });

  it('has initial state with showLocation', async () => {
    const { Search } = await import('../../lib/search');
    const search = new Search([]);
    expect(search.store.showLocation).toBe(true);
  });
});

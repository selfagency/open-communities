import { describe, expect, it } from 'vitest';

describe('Search class', () => {
  it('initializes with congregation data', async () => {
    const { Search } = await import('../../lib/search');
    const search = new Search([
      { id: '1', name: 'Beth Israel', denomination: 'Reform', visible: true },
      { id: '2', name: 'Temple Sinai', denomination: 'Conservative', visible: true }
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
      { id: '3', name: 'Zion Temple', denomination: 'Orthodox', visible: true },
      { id: '1', name: 'Beth Israel', denomination: 'Reform', visible: true }
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

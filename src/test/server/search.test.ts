import { describe, expect, it } from 'vitest';

describe('Search class', () => {
  it('initializes with congregation data', async () => {
    const { Search } = await import('../../lib/search');
    const search = new Search([
      {
        id: '1',
        name: 'Beth Israel',
        denomination: 'Reform',
        location: { city: { name: 'New York' }, state: { name: 'NY' } }
      },
      {
        id: '2',
        name: 'Temple Sinai',
        denomination: 'Conservative',
        location: { city: { name: 'Los Angeles' }, state: { name: 'CA' } }
      }
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
      {
        id: '3',
        name: 'Zion Temple',
        denomination: 'Orthodox',
        location: { city: { name: 'Miami' }, state: { name: 'FL' } }
      },
      {
        id: '1',
        name: 'Beth Israel',
        denomination: 'Reform',
        location: { city: { name: 'New York' }, state: { name: 'NY' } }
      }
    ]);
    expect(search.data[0].name).toBe('Beth Israel');
    expect(search.data[1].name).toBe('Zion Temple');
  });

  it('has initial state with showLocation', async () => {
    const { Search } = await import('../../lib/search');
    const search = new Search([]);
    const state = search.state.get();
    expect(state.showLocation).toBe(true);
  });
});

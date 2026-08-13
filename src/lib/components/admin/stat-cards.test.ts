import '@testing-library/jest-dom/vitest';
import { mount, unmount } from 'svelte';
import { describe, expect, it } from 'vitest';

describe('StatCards', () => {
  it('renders count stats (congregations, users, pendingApprovals)', async () => {
    const { default: StatCards } = await import('./stat-cards.svelte');
    const target = document.createElement('div');
    const instance = mount(StatCards, {
      props: {
        congregations: 42,
        geoLoaded: false,
        pendingApprovals: 5,
        users: 100
      },
      target
    });
    expect(target.textContent).toContain('42');
    expect(target.textContent).toContain('100');
    expect(target.textContent).toContain('5');
    unmount(instance);
  });

  it('renders geo stats when loaded', async () => {
    const { default: StatCards } = await import('./stat-cards.svelte');
    const target = document.createElement('div');
    const instance = mount(StatCards, {
      props: {
        congregations: 10,
        geoLoaded: true,
        pendingApprovals: 0,
        topCities: [
          { count: 15, name: 'New York' },
          { count: 10, name: 'Los Angeles' }
        ],
        topCountries: [
          { count: 25, name: 'United States' },
          { count: 5, name: 'Canada' }
        ],
        topStates: [
          { count: 12, name: 'California' },
          { count: 8, name: 'New York' }
        ],
        totalCities: 50,
        totalCountries: 5,
        totalStates: 10,
        users: 20
      },
      target
    });
    expect(target.textContent).toContain('50');
    expect(target.textContent).toContain('10');
    expect(target.textContent).toContain('5');
    expect(target.textContent).toContain('New York');
    expect(target.textContent).toContain('Los Angeles');
    expect(target.textContent).toContain('California');
    expect(target.textContent).toContain('United States');
    unmount(instance);
  });

  it('renders empty geo stats when data is empty', async () => {
    const { default: StatCards } = await import('./stat-cards.svelte');
    const target = document.createElement('div');
    const instance = mount(StatCards, {
      props: {
        congregations: 0,
        geoLoaded: true,
        pendingApprovals: 0,
        totalCities: 0,
        totalCountries: 0,
        totalStates: 0,
        users: 0
      },
      target
    });
    expect(target.textContent).toContain('adminTotalCities');
    expect(target.textContent).toContain('adminTotalStates');
    expect(target.textContent).toContain('adminTotalCountries');
    unmount(instance);
  });
});

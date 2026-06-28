import '@testing-library/jest-dom/vitest';
import { mount, unmount } from 'svelte';
import { describe, expect, it } from 'vitest';

describe('StatCards', () => {
  it('renders count stats (congregations, users, pendingApprovals)', async () => {
    const { default: StatCards } = await import('./stat-cards.svelte');
    const target = document.createElement('div');
    const instance = mount(StatCards, {
      target,
      props: {
        congregations: 42,
        users: 100,
        pendingApprovals: 5,
        geoLoaded: false
      }
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
      target,
      props: {
        congregations: 10,
        users: 20,
        pendingApprovals: 0,
        geoLoaded: true,
        totalCities: 50,
        totalStates: 10,
        totalCountries: 5,
        topCities: [
          { name: 'New York', count: 15 },
          { name: 'Los Angeles', count: 10 }
        ],
        topStates: [
          { name: 'California', count: 12 },
          { name: 'New York', count: 8 }
        ],
        topCountries: [
          { name: 'United States', count: 25 },
          { name: 'Canada', count: 5 }
        ]
      }
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
      target,
      props: {
        congregations: 0,
        users: 0,
        pendingApprovals: 0,
        geoLoaded: true,
        totalCities: 0,
        totalStates: 0,
        totalCountries: 0
      }
    });
    expect(target.textContent).toContain('adminTotalCities');
    expect(target.textContent).toContain('adminTotalStates');
    expect(target.textContent).toContain('adminTotalCountries');
    unmount(instance);
  });
});

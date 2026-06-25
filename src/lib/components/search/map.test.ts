import { fireEvent, render, waitFor } from '@testing-library/svelte';
import { vi } from 'vitest';

// stub svelte-maplibre primitives used in the component
vi.mock('svelte-maplibre', () => ({
  DefaultMarker: (props: any) => ({ $$slot_def: props?.$$slots }),
  MapLibre: (props: any) => ({ $$slot_def: props?.$$slots }),
  Popup: (props: any) => ({ $$slot_def: props?.$$slots })
}));

import type { Search } from '$lib/search';

import { createFakeLocation } from '$test/stubs/fake-location';
import { FakeSearch } from '$test/stubs/fake-search';

import Map from './map.svelte';

it('renders markers and clicking opens location', async () => {
  const locations = [
    {
      city: { id: 'c1', latitude: 10, longitude: 20, name: 'City1' },
      // @ts-expect-error: partial test fixture
    country: { id: 'co1', name: 'Country1' },
      state: undefined
    }
  ];

  const search = new FakeSearch() as unknown as Search;
  const loadSpy = vi.fn();
  const fakeLocation = createFakeLocation(
    { city: undefined, // @ts-expect-error: partial test fixture
    country: { id: 'co1' }, state: undefined },
    { countryOptions: [{ id: 'co1', label: 'Country1', value: 'Country1' }] }
  );

  // attach a load spy so the component can call it

  (fakeLocation as any).load = loadSpy;

  const { container } = render(Map, {
    location: fakeLocation as any,
    locations,
    search
  });

  await waitFor(() => {
    const text = (container.textContent || '').replace(/\s+/g, ' ');
    expect(text).toContain('City1');
  });

  // click the first button in the rendered container
  const firstButton = container.querySelector('button');
  if (firstButton) {
    await fireEvent.click(firstButton);
  }
  // location.load should have been called with the location keys
  expect(loadSpy).toHaveBeenCalledWith({
    city: 'c1',
    country: 'co1',
    state: undefined
  });
});

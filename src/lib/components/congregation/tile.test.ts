/// <reference types="vitest" />

import { render, screen } from '@testing-library/svelte';
import '@testing-library/jest-dom/vitest';

import type { CongregationMetaRecord } from '$lib/pocketbase';

import { m } from '$lib/paraglide/messages';

import Tile from './tile.svelte';

describe('Tile component', () => {
  it('renders title, flavor, location and accessibility mini', () => {
    const congregation = {
      accessibility: { inPerson_adaSome: true },
      fit: { flag: 'yes' },
      flavor: 'A friendly tile',
      health: null,
      id: 'abc123',
      location: {
        city: { name: 'TestCity' },
        country: { name: 'TestCountry' },
        state: { name: 'TS' }
      },
      name: 'Test Tile',
      security: null,
      services: { onlineOnly: false },
      visible: true
    } as CongregationMetaRecord & { id: string };

    render(Tile, { congregation });

    expect(screen.getByText('Test Tile')).toBeInTheDocument();
    expect(screen.getByText('A friendly tile')).toBeInTheDocument();
    expect(screen.getByText('TestCity')).toBeInTheDocument();

    // accessibility mini should render the sr-only label text
    expect(screen.getByText(m.accessibility_ada())).toBeInTheDocument();
  });

  it('shows pending badge when visible is false', () => {
    const congregation = {
      accessibility: {},
      flavor: '',
      health: null,
      id: 'x',
      location: { city: { name: '' }, country: { name: '' }, state: { name: '' } },
      name: 'Hidden',
      security: null,
      services: { onlineOnly: false },
      visible: false
    } as CongregationMetaRecord & { id: string };

    render(Tile, { congregation });
    expect(screen.getByText(m.pending())).toBeInTheDocument();
  });
});

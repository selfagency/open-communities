/// <reference types="vitest" />

import { render, screen, within } from '@testing-library/svelte';
import '@testing-library/jest-dom';

import { m } from '$lib/paraglide/messages';
import type { ServicesRecord } from '$lib/pocketbase.d';

import Services from './services.svelte';

describe('Services component', () => {
  it('renders header', () => {
    render(Services, {});
    expect(screen.getByText(m.services())).toBeInTheDocument();
  });

  it('renders inPerson item when set', () => {
    const services = { inPerson: true } as unknown as ServicesRecord;
    render(Services, { services });
    const list = screen.getByRole('list');
    expect(within(list).getByText(m.services_inPerson())).toBeInTheDocument();
  });

  it('renders onlineOnly item when set', () => {
    const services = { onlineOnly: true } as unknown as ServicesRecord;
    render(Services, { services });
    const list = screen.getByRole('list');
    expect(within(list).getByText(m.services_onlineOnly())).toBeInTheDocument();
  });

  it('renders hybrid/offsite/otherText when provided', () => {
    const services = {
      hybrid: true,
      offsite: true,
      other: true,
      otherText: 'Other services'
    } as unknown as ServicesRecord;
    render(Services, { services });
    const list = screen.getByRole('list');
    expect(within(list).getByText(m.services_hybrid())).toBeInTheDocument();
    expect(within(list).getByText(m.services_offsite())).toBeInTheDocument();
    expect(within(list).getByText('Other services')).toBeInTheDocument();
  });
});

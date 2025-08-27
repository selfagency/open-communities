/// <reference types="vitest" />

import { render, screen, within } from '@testing-library/svelte';
import '@testing-library/jest-dom/vitest';

import type { HealthRecord } from '$lib/pocketbase.d';

import { m } from '$lib/paraglide/messages';

import Health from './health.svelte';

describe('Health component', () => {
  it('mini: shows maskingRecommended tooltip text', () => {
    const health = { protocol: 'maskingRecommended' } as unknown as HealthRecord;
    render(Health, { health, mode: 'mini' });

    expect(screen.getByText(m.health_maskingRecommended())).toBeInTheDocument();
  });

  it('mini: shows maskingRequired tooltip text', () => {
    const health = { protocol: 'maskingRequired' } as unknown as HealthRecord;
    render(Health, { health, mode: 'mini' });

    expect(screen.getByText(m.health_maskingRequired())).toBeInTheDocument();
  });

  it('full: renders maskingRecommended list item', () => {
    const health = { protocol: 'maskingRecommended' } as unknown as HealthRecord;
    render(Health, { health, mode: 'full' });

    const list = screen.getByRole('list');
    expect(within(list).getByText(m.health_maskingRecommended())).toBeInTheDocument();
  });

  it('full: renders noGuidelines item', () => {
    const health = { protocol: 'noGuidelines' } as unknown as HealthRecord;
    render(Health, { health, mode: 'full' });

    const list = screen.getByRole('list');
    expect(within(list).getByText(m.health_noGuidelines())).toBeInTheDocument();
  });

  it('full: renders otherText when protocol is other and otherText provided', () => {
    const health = { otherText: 'Masks requested', protocol: 'other' } as unknown as HealthRecord;
    render(Health, { health, mode: 'full' });

    const list = screen.getByRole('list');
    expect(within(list).getByText('Masks requested')).toBeInTheDocument();
  });

  it('full: renders notApplicable when otherText is N/A', () => {
    const health = { otherText: 'N/A', protocol: 'other' } as unknown as HealthRecord;
    render(Health, { health, mode: 'full' });

    // the component outputs the message directly (not wrapped in list item)
    expect(screen.getByText(m.health_notApplicable())).toBeInTheDocument();
  });
});

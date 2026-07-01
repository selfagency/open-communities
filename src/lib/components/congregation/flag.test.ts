/// <reference types="vitest" />

import { render, screen } from '@testing-library/svelte';
import '@testing-library/jest-dom/vitest';

import { m } from '$lib/paraglide/messages';
import type { FitFlagOptions } from '$lib/pocketbase.d';
import { assertAccessible } from '$test/accesslint';

import FlagComp from './flag.svelte';

describe('Flag component', () => {
  it('renders nothing when no flag provided', () => {
    render(FlagComp, {});
    expect(screen.queryByRole('heading')).not.toBeInTheDocument();
  });

  it('renders mini mode with sr-only text for yes', () => {
    render(FlagComp, { flag: 'yes' as FitFlagOptions, mode: 'mini' });
    // sr-only label should be present
    expect(screen.getByText(m.flag_yes())).toBeInTheDocument();
  });

  it('renders full mode for no flag', () => {
    render(FlagComp, { flag: 'no' as FitFlagOptions, mode: 'full' });
    expect(screen.getByText(m.flag_short())).toBeInTheDocument();
    const area = screen.getByText(m.flag_no());
    expect(area).toBeInTheDocument();
  });

  it('renders full mode for yesBima', () => {
    render(FlagComp, { flag: 'yesBima' as FitFlagOptions, mode: 'full' });
    const area = screen.getByText(m.flag_yesBima());
    expect(area).toBeInTheDocument();
  });

  it('has no accessibility violations in mini mode', () => {
    const { container } = render(FlagComp, { flag: 'yes' as FitFlagOptions, mode: 'mini' });
    assertAccessible(container);
  });

  it('has no accessibility violations in full mode', () => {
    const { container } = render(FlagComp, { flag: 'yes' as FitFlagOptions, mode: 'full' });
    assertAccessible(container);
  });
});

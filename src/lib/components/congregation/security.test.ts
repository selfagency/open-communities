/// <reference types="vitest" />

import { render, screen, within } from '@testing-library/svelte';
import '@testing-library/jest-dom/vitest';

import { m } from '$lib/paraglide/messages';
import type { SecurityRecord } from '$lib/pocketbase.d';
import { assertAccessible } from '$test/accesslint';

import Security from './security.svelte';

describe('Security component', () => {
  it('mini: shows armed tooltip when any armed flag is true', () => {
    const security = { localPolice: true } as unknown as SecurityRecord;
    render(Security, { mode: 'mini', security });

    expect(screen.getByText(m.security_armedSecurity())).toBeInTheDocument();
  });

  it('mini: shows unarmed tooltip when only privateSecurityUnarmed is true', () => {
    const security = { privateSecurityUnarmed: true } as unknown as SecurityRecord;
    render(Security, { mode: 'mini', security });

    expect(screen.getByText(m.security_unarmedSecurity())).toBeInTheDocument();
  });

  it('full: lists all armed reasons when present', () => {
    const security = {
      clergyArmed: true,
      congregantsArmed: true,
      localPolice: true,
      privateSecurityArmed: true
    } as unknown as SecurityRecord;
    render(Security, { mode: 'full', security });

    const list = screen.getByRole('list');
    expect(within(list).getByText((content) => content.includes(m.security_localPolice()))).toBeInTheDocument();
    expect(
      within(list).getByText((content) => content.includes(m.security_privateSecurityArmed()))
    ).toBeInTheDocument();
    expect(within(list).getByText((content) => content.includes(m.security_clergyArmed()))).toBeInTheDocument();
    expect(within(list).getByText((content) => content.includes(m.security_congregantsArmed()))).toBeInTheDocument();
  });

  it('full: shows unarmed and no-firearms messages when privateSecurityUnarmed is true', () => {
    const security = { privateSecurityUnarmed: true } as unknown as SecurityRecord;
    render(Security, { mode: 'full', security });

    const list = screen.getByRole('list');
    expect(within(list).getByText(m.security_privateSecurityUnarmed())).toBeInTheDocument();
    expect(within(list).getByText(m.security_noFirearms())).toBeInTheDocument();
  });

  it('has no accessibility violations in mini mode', () => {
    const security = { localPolice: true } as unknown as SecurityRecord;
    const { container } = render(Security, { mode: 'mini', security });
    assertAccessible(container);
  });

  it('has no accessibility violations in full mode', () => {
    const security = { clergyArmed: true, localPolice: true } as unknown as SecurityRecord;
    const { container } = render(Security, { mode: 'full', security });
    assertAccessible(container);
  });
});

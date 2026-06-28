import { describe, expect, it, vi } from 'vitest';

import { makeMockFormProps, mockSveltekitSuperforms } from '$test/testUtils';

vi.mock('sveltekit-superforms', () => mockSveltekitSuperforms);

describe.skip('Security segment (behavior)', () => {
  // NOSONAR — @testing-library/svelte × Svelte 5 incompatibility
  it('toggles a security checkbox and updates formData', async () => {
    const { default: Host } = await import('$test/components/SecurityHost.svelte');

    // initialize all expected keys in the same order as the component
    const props = makeMockFormProps(
      {
        security: {
          clergyArmed: false,
          congregantsArmed: false,
          localPolice: false,
          noFirearms: false,
          other: false,
          otherText: '',
          privateSecurityArmed: false,
          privateSecurityUnarmed: false
        }
      },
      {}
    );

    const target = document.createElement('div');

    new (Host as unknown as any)({ props: { props }, target });

    // wait for Svelte to render
    await Promise.resolve();

    const checkboxes = target.querySelectorAll('input[type="checkbox"], [role="checkbox"]');
    expect(checkboxes.length).toBeGreaterThan(0);

    // click the first checkbox
    (checkboxes[0] as HTMLElement).dispatchEvent(new MouseEvent('click', { bubbles: true }));
    await Promise.resolve();

    let latest: unknown;
    const unsub = (props.formData as unknown as { subscribe: (fn: (v: unknown) => void) => () => void }).subscribe(
      (v) => (latest = v)
    );
    unsub();

    const security = (latest as unknown as unknown as Record<string, unknown>)?.security as unknown as
      | Record<string, unknown>
      | undefined;
    expect(
      Boolean(security?.localPolice) ||
        Boolean(security?.privateSecurityArmed) ||
        Boolean(security?.privateSecurityUnarmed) ||
        Boolean(security?.clergyArmed) ||
        Boolean(security?.congregantsArmed) ||
        Boolean(security?.noFirearms) ||
        Boolean(security?.other)
    ).toBe(true);
  });
});

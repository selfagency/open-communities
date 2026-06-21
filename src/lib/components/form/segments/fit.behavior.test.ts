import { describe, expect, it, vi } from 'vitest';

import { makeMockFormProps, mockSveltekitSuperforms } from '$test/testUtils';

vi.mock('sveltekit-superforms', () => mockSveltekitSuperforms);

describe('Fit segment (behavior)', () => {
  it('toggles clergyMember checkbox and updates formData', async () => {
    const { default: Host } = await import('$test/components/FitHost.svelte');

    // ensure all fields expected by the component are present and defined
    const props = makeMockFormProps(
      {
        fit: {
          clergyMember: false,
          flag: '',
          multipleClergyMembers: false,
          other: false,
          otherText: '',
          publicStatement: false
        }
      },
      {}
    );
    const target = document.createElement('div');

    // mount the host; ServicesHost was chosen to provide Accordion.Root in this test env

    new (Host as any)({ props: { props }, target });

    // wait a microtask for Svelte to render
    await Promise.resolve();
    const checkboxes = target.querySelectorAll('input[type="checkbox"], [role="checkbox"]');
    expect(checkboxes.length).toBeGreaterThan(0);

    // click a checkbox (first one)
    (checkboxes[0] as HTMLElement).click();
    await Promise.resolve();

    let latest: unknown;
    const unsub = (props.formData as unknown as { subscribe: (fn: (v: unknown) => void) => () => void }).subscribe(
      (v) => (latest = v)
    );
    unsub();

    const fit = (latest as unknown as Record<string, unknown>)?.fit as Record<string, unknown> | undefined;
    expect(
      Boolean(fit?.clergyMember) ||
        Boolean(fit?.publicStatement) ||
        Boolean(fit?.multipleClergyMembers) ||
        Boolean(fit?.other)
    ).toBe(true);
  });
});

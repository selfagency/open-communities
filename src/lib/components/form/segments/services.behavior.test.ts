import '@testing-library/jest-dom/vitest';
import { describe, expect, it, vi } from 'vitest';
// use native DOM events to avoid import issues in the test environment

import { makeMockFormProps, mockSveltekitSuperforms } from '$test/testUtils';

vi.mock('sveltekit-superforms', () => mockSveltekitSuperforms);

describe.skip('Services segment (behavior)', () => {
  // NOSONAR — @testing-library/svelte × Svelte 5 incompatibility
  it('toggles inPerson checkbox and updates formData store', async () => {
    const { default: ServicesHost } = await import('$test/components/ServicesHost.svelte');

    const props = makeMockFormProps(
      {
        services: {
          hybrid: false,
          inPerson: false,
          offsite: false,
          onlineOnly: false,
          other: false,
          otherText: ''
        }
      },
      {}
    );
    const target = document.createElement('div');

    // mount the host which provides Accordion.Root and renders Services

    new (ServicesHost as any)({ props: { props }, target });

    // find checkbox-like elements (bits-ui may render non-input checkboxes)
    const checkboxes = target.querySelectorAll('input[type="checkbox"], [role="checkbox"]');
    expect(checkboxes.length).toBeGreaterThan(0);
    const first = checkboxes[0] as HTMLElement;

    // simulate user click
    first.click();

    // allow microtask for Svelte reactivity to run
    await Promise.resolve();

    // read formData store once
    let latest: unknown;
    const unsub = (props.formData as unknown as { subscribe: (fn: (v: unknown) => void) => () => void }).subscribe(
      (v: unknown) => (latest = v)
    );
    unsub();

    const data = latest as { services: Record<string, unknown> & { inPerson?: boolean } };
    expect(data.services.inPerson).toBe(true);
  });
});

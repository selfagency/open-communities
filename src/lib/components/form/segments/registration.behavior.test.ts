import { describe, expect, it, vi } from 'vitest';

import { makeMockFormProps, mockSveltekitSuperforms } from '$test/testUtils';

vi.mock('sveltekit-superforms', () => mockSveltekitSuperforms);

describe('Registration segment (behavior)', () => {
  it('updates registration email and url on input/change', async () => {
    const { default: Host } = await import('$test/components/RegistrationHost.svelte');

    // ensure registrationType exists so RadioGroup.bind:value is defined
    const props = makeMockFormProps({ registration: { email: '', otherText: '', registrationType: '', url: '' } }, {});
    const target = document.createElement('div');

    new (Host as unknown as any)({ props: { props }, target });

    // wait a tick for Svelte to render inputs
    await Promise.resolve();
    const inputs = Array.from(target.querySelectorAll('input')) as HTMLInputElement[];
    // expect at least inputs exist
    expect(inputs.length).toBeGreaterThan(0);

    // fill email and url (trim happens on change handler)
    const emailInput = inputs.find((i) => i.getAttribute('id')?.includes('registration_email')) || inputs[0];
    emailInput.value = '  user@example.com  ';
    emailInput.dispatchEvent(new Event('input', { bubbles: true }));
    emailInput.dispatchEvent(new Event('change', { bubbles: true }));

    const urlInput = inputs.find((i) => i.getAttribute('id')?.includes('registration_url')) || inputs[1];
    urlInput.value = '  https://example.com/page  ';
    urlInput.dispatchEvent(new Event('input', { bubbles: true }));
    urlInput.dispatchEvent(new Event('change', { bubbles: true }));

    await Promise.resolve();

    let latest: unknown;
    const unsub = (props.formData as unknown as { subscribe: (fn: (v: unknown) => void) => () => void }).subscribe(
      (v) => (latest = v)
    );
    unsub();

    const reg = (latest as unknown as Record<string, unknown>).registration as Record<string, unknown> | undefined;
    expect(reg?.email).toBe('user@example.com');
    expect(reg?.url).toBe('https://example.com/page');
  });
});

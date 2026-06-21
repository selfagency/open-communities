import { describe, expect, it, vi } from 'vitest';

import { makeMockFormProps, mockSveltekitSuperforms } from '$test/testUtils';

vi.mock('sveltekit-superforms', () => mockSveltekitSuperforms);

describe('Contact segment (behavior)', () => {
  it('updates contactName and contactEmail in formData on input', async () => {
    const { default: Host } = await import('$test/components/ContactHost.svelte');

    const props = makeMockFormProps({ contactEmail: '', contactName: '' }, {});
    const target = document.createElement('div');

    // mount the host which provides Accordion.Root and renders Contact

    new (Host as any)({ props: { props }, target });

    const inputs = Array.from(target.querySelectorAll('input')) as HTMLInputElement[];
    expect(inputs.length).toBeGreaterThanOrEqual(2);

    const nameInput = inputs[0];
    nameInput.value = 'Alice';
    nameInput.dispatchEvent(new Event('input', { bubbles: true }));

    const emailInput = inputs[1];
    emailInput.value = 'alice@example.org';
    emailInput.dispatchEvent(new Event('input', { bubbles: true }));
    emailInput.dispatchEvent(new Event('change', { bubbles: true }));

    await Promise.resolve();

    let latest: unknown;
    const unsub = (props.formData as unknown as { subscribe: (fn: (v: unknown) => void) => () => void }).subscribe(
      (v) => (latest = v)
    );
    unsub();

    expect((latest as unknown as Record<string, unknown>).contactName).toBe('Alice');
    expect((latest as unknown as Record<string, unknown>).contactEmail).toBe('alice@example.org');
  });
});

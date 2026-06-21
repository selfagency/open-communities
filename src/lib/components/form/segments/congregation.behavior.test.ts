import '@testing-library/jest-dom/vitest';
import { describe, expect, it, vi } from 'vitest';

import { makeMockFormProps, mockSveltekitSuperforms } from '$test/testUtils';

vi.mock('sveltekit-superforms', () => mockSveltekitSuperforms);

describe('Congregation segment (behavior)', () => {
  it('updates name and contactUrl in formData when inputs change', async () => {
    const { default: Host } = await import('$test/components/CongregationHost.svelte');

    const props = makeMockFormProps({ contactUrl: '', name: '' }, {});

    const target = document.createElement('div');

    // mount the host which provides Accordion.Root and renders Congregation

    new (Host as any)({ props: { props }, target });

    // find text inputs (name, contactUrl, clergy etc.). We'll target the first two text inputs.
    const textInputs = Array.from(
      target.querySelectorAll('input[type="text"], input:not([type])')
    ) as HTMLInputElement[];
    expect(textInputs.length).toBeGreaterThanOrEqual(1);

    const nameInput = textInputs[0];
    nameInput.value = '  My Congregation  ';
    nameInput.dispatchEvent(new Event('input', { bubbles: true }));
    nameInput.dispatchEvent(new Event('change', { bubbles: true }));

    // allow microtask for reactivity
    await Promise.resolve();

    let latest: unknown;
    const unsub = (props.formData as unknown as { subscribe: (fn: (v: unknown) => void) => () => void }).subscribe(
      (v) => (latest = v)
    );
    unsub();

    expect((latest as unknown as Record<string, unknown>).name).toBe('My Congregation');

    // If a second input exists, treat it as contactUrl and test trimming
    if (textInputs.length >= 2) {
      const urlInput = textInputs[1];
      urlInput.value = '  https://example.org/path  ';
      urlInput.dispatchEvent(new Event('input', { bubbles: true }));
      urlInput.dispatchEvent(new Event('change', { bubbles: true }));
      await Promise.resolve();

      let latest2: unknown;
      const unsub2 = (props.formData as unknown as { subscribe: (fn: (v: unknown) => void) => () => void }).subscribe(
        (v) => (latest2 = v)
      );
      unsub2();

      expect((latest2 as unknown as Record<string, unknown>).contactUrl).toBe('https://example.org/path');
    }
  });
});

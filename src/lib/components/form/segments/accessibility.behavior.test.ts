import { describe, expect, it, vi } from 'vitest';

import { makeMockFormProps, mockSveltekitSuperforms } from '$test/testUtils';
vi.mock('sveltekit-superforms', () => mockSveltekitSuperforms);

describe('Accessibility segment (behavior)', () => {
  it('toggles an accessibility checkbox and updates formData', async () => {
    const { default: Host } = await import('$test/components/AccessibilityHost.svelte');

    const props = makeMockFormProps({ accessibility: { online_asl: false, other: false, otherText: '' } }, {});
    const target = document.createElement('div');

    // mount the host which provides Accordion.Root and renders Accessibility

    new (Host as any)({ props: { props }, target });

    // find checkboxes rendered by bits-ui Checkbox (role or input)
    const checkboxes = target.querySelectorAll('input[type="checkbox"], [role="checkbox"]');
    expect(checkboxes.length).toBeGreaterThan(0);

    const first = checkboxes[0] as HTMLElement;
    first.click();

    await Promise.resolve();

    let latest: unknown;
    const unsub = (props.formData as unknown as { subscribe: (fn: (v: unknown) => void) => () => void }).subscribe(
      (v) => (latest = v)
    );
    unsub();

    // verify the nested accessibility flag changed
    const acc = (latest as unknown as Record<string, any>).accessibility || {};
    expect(acc.online_asl).toBe(true);
  });
});

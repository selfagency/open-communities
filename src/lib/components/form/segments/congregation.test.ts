import '@testing-library/jest-dom/vitest';
import { mount, unmount } from 'svelte';
import { describe, expect, it, vi } from 'vitest';

import { makeMockFormProps, mockSveltekitSuperforms } from '$test/testUtils';

vi.mock('sveltekit-superforms', () => mockSveltekitSuperforms);
vi.mock('$lib/api', () => ({ api: {} }));

describe('Congregation segment', () => {
  it('renders', async () => {
    const { default: Host } = await import('$test/components/CongregationHost.svelte');
    const props = makeMockFormProps({}, {});
    const target = document.createElement('div');

    // mount the segment via a static host that provides Accordion.Root
    const instance = mount(Host as any, { props: { props }, target });

    expect(target).toBeTruthy();
    unmount(instance);
  });
});

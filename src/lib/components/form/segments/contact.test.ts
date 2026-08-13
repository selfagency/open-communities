import '@testing-library/jest-dom/vitest';
import { describe, expect, it, vi } from 'vitest';

import { makeMockFormProps, mockSveltekitSuperforms } from '$test/testUtils';

vi.mock('sveltekit-superforms', () => mockSveltekitSuperforms);

describe('Contact segment', () => {
  it('renders', async () => {
    const { default: Host } = await import('$test/components/ContactHost.svelte');
    const props = makeMockFormProps({}, {});
    const target = document.createElement('div');

    // mount the segment via a static host that provides Accordion.Root

    const instance = new (Host as any)({ props: { props }, target });

    expect(instance).toBeTruthy();
  });
});

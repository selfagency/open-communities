import '@testing-library/jest-dom/vitest';
import { describe, expect, it, vi } from 'vitest';

import { makeMockFormProps, mockSveltekitSuperforms } from '$test/testUtils';

vi.mock('sveltekit-superforms', () => mockSveltekitSuperforms);

// biome-ignore lint/suspicious/noSkippedTests: @testing-library/svelte × Svelte 5 incompatibility — see AGENTS.md
describe.skip('Security segment', () => {
  it('renders', async () => {
    const { default: Component } = await import('./security.svelte');
    const props = makeMockFormProps({}, {});
    const target = document.createElement('div');

    new (Component as any)({ props, target });
    expect(target).toBeTruthy();
  });
});

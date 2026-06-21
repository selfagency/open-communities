import '@testing-library/jest-dom/vitest';
import { describe, expect, it, vi } from 'vitest';

import { makeMockFormProps, mockSveltekitSuperforms } from '$test/testUtils';

vi.mock('sveltekit-superforms', () => mockSveltekitSuperforms);

describe('Fit segment', () => {
  it('renders', async () => {
    const { default: Component } = await import('./fit.svelte');
    const props = makeMockFormProps({}, {});
    const target = document.createElement('div');

    new (Component as any)({ props, target });
    expect(target).toBeTruthy();
  });
});

import '@testing-library/jest-dom/vitest';
import { describe, expect, it, vi } from 'vitest';

import { makeMockFormProps, mockSveltekitSuperforms } from '$test/testUtils';

vi.mock('sveltekit-superforms', () => mockSveltekitSuperforms);

describe('Required form component', () => {
  it('renders without crashing', async () => {
    const { default: Component } = await import('./required.svelte');
    const props = makeMockFormProps({}, {});
    const target = document.createElement('div');

    new (Component as any)({ props, target });
    expect(target).toBeTruthy();
  });
});

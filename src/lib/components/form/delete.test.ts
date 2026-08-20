import '@testing-library/jest-dom/vitest';
import { describe, expect, it, vi } from 'vitest';

import { makeMockFormProps, mockSveltekitSuperforms } from '$test/testUtils';

vi.mock('sveltekit-superforms', () => mockSveltekitSuperforms);
// delete.svelte imports superForm from the client subpath; mock it too so the
// real client (which calls onDestroy outside a component) never loads.
vi.mock('sveltekit-superforms/client', () => mockSveltekitSuperforms);

describe('Delete form component', () => {
  it('renders without crashing', async () => {
    const { default: Component } = await import('./delete.svelte');
    const props = makeMockFormProps({}, {});
    const target = document.createElement('div');

    const instance = new (Component as any)({ props, target });
    expect(instance).toBeTruthy();
  });
});

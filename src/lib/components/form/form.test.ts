import '@testing-library/jest-dom/vitest';
import { mount, unmount } from 'svelte';
import { describe, expect, it, vi } from 'vitest';

import { makeMockFormProps, mockSveltekitSuperforms } from '$test/testUtils';

vi.mock('sveltekit-superforms', () => mockSveltekitSuperforms);
vi.mock('$lib/api', () => ({ api: {} }));

describe('Form component', () => {
  it('renders without crashing', async () => {
    const { default: Host } = await import('$test/components/FormHost.svelte');
    const props = makeMockFormProps({}, {});
    // ensure key ordering: errors, form, formData
    const ordered = { errors: props.errors, form: props.form, formData: props.formData };
    const target = document.createElement('div');
    // mount the Form component inside a static host that provides Accordion.Root
    const instance = mount(Host as any, { props: { props: ordered }, target });
    expect(target).toBeTruthy();
    unmount(instance);
  });
});

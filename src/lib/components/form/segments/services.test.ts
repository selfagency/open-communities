import '@testing-library/jest-dom/vitest';
import { describe, expect, it, vi } from 'vitest';

import { makeMockFormProps, mockSveltekitSuperforms } from '$test/testUtils';
vi.mock('sveltekit-superforms', () => mockSveltekitSuperforms);

describe('Services segment', () => {
  it('renders', async () => {
    // import the ServicesHost which mounts Services inside Accordion.Root
    const { default: ServicesHost } = await import('$test/components/ServicesHost.svelte');
    // provide formData with services so template conditionals don't fail
    const props = makeMockFormProps(
      { services: { hybrid: false, inPerson: false, offsite: false, onlineOnly: false } },
      {}
    );
    const target = document.createElement('div');
    // mount the Services component inside the ServicesHost which provides Accordion.Root

    new (ServicesHost as any)({ props: { props }, target });
    expect(target).toBeTruthy();
  });
});

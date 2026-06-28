import '@testing-library/jest-dom/vitest';
import { mount, unmount } from 'svelte';
import { describe, expect, it } from 'vitest';

import { makeMockFormProps } from '$test/testUtils';

describe('FormFooter', () => {
  const initData = () => {
    // no-op — component requires this callback but we don't need it for rendering tests
  };

  it('renders submit button with i18n label', async () => {
    const { default: FormFooter } = await import('./form-footer.svelte');
    const target = document.createElement('div');
    const instance = mount(FormFooter, {
      target,
      props: {
        mode: 'add',
        initData,
        ...makeMockFormProps()
      }
    });
    expect(target.textContent).toContain('submit');
    unmount(instance);
  });

  it('renders delete button in edit mode', async () => {
    const { default: FormFooter } = await import('./form-footer.svelte');
    const target = document.createElement('div');
    const instance = mount(FormFooter, {
      target,
      props: {
        mode: 'edit',
        initData,
        ...makeMockFormProps()
      }
    });
    expect(target.textContent).toContain('delete');
    unmount(instance);
  });

  it('renders reset button in edit mode', async () => {
    const { default: FormFooter } = await import('./form-footer.svelte');
    const target = document.createElement('div');
    const instance = mount(FormFooter, {
      target,
      props: {
        mode: 'edit',
        initData,
        ...makeMockFormProps()
      }
    });
    expect(target.textContent).toContain('reset');
    unmount(instance);
  });

  it('does not render delete button in add mode', async () => {
    const { default: FormFooter } = await import('./form-footer.svelte');
    const target = document.createElement('div');
    const instance = mount(FormFooter, {
      target,
      props: {
        mode: 'add',
        initData,
        ...makeMockFormProps()
      }
    });
    expect(target.textContent).not.toContain('delete');
    unmount(instance);
  });
});

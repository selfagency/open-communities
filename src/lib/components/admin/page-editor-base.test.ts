import '@testing-library/jest-dom/vitest';
import { mount, unmount } from 'svelte';
import { describe, expect, it } from 'vitest';

describe('PageEditorBase', () => {
  it('renders title and slug input fields', async () => {
    const { default: Component } = await import('./page-editor-base.svelte');
    const target = document.createElement('div');
    const instance = mount(Component, {
      target,
      props: { title: '', slug: '', description: '', content: '' }
    });
    expect(target.textContent).toContain('pageEditorTitleNew');
    expect(target.textContent).toContain('pageEditorTitleLabel');
    expect(target.textContent).toContain('pageEditorSlugLabel');
    unmount(instance);
  });

  it('renders description textarea', async () => {
    const { default: Component } = await import('./page-editor-base.svelte');
    const target = document.createElement('div');
    const instance = mount(Component, {
      target,
      props: { title: '', slug: '', description: '', content: '' }
    });
    expect(target.textContent).toContain('pageEditorDescriptionLabel');
    unmount(instance);
  });

  it('renders content editor area', async () => {
    const { default: Component } = await import('./page-editor-base.svelte');
    const target = document.createElement('div');
    const instance = mount(Component, {
      target,
      props: { title: '', slug: '', description: '', content: '' }
    });
    expect(target.textContent).toContain('pageEditorContentLabel');
    unmount(instance);
  });

  it('shows manual slug toggle', async () => {
    const { default: Component } = await import('./page-editor-base.svelte');
    const target = document.createElement('div');
    const instance = mount(Component, {
      target,
      props: { title: '', slug: '', description: '', content: '' }
    });
    expect(target.textContent).toContain('pageEditorSlugManual');
    unmount(instance);
  });
});

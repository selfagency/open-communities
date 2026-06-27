import '@testing-library/jest-dom/vitest';
import { mount, unmount } from 'svelte';
import { describe, expect, it } from 'vitest';

describe('PageEditorImage', () => {
  it('renders image card with empty state', async () => {
    const { default: Component } = await import('./page-editor-image.svelte');
    const target = document.createElement('div');
    const instance = mount(Component, {
      target,
      props: { imageFile: null, imagePreview: '', imageAlt: '', imageCaption: '' }
    });
    expect(target.textContent).toContain('pageEditorImage');
    unmount(instance);
  });

  it('renders alt text input', async () => {
    const { default: Component } = await import('./page-editor-image.svelte');
    const target = document.createElement('div');
    const instance = mount(Component, {
      target,
      props: { imageFile: null, imagePreview: '', imageAlt: '', imageCaption: '' }
    });
    expect(target.textContent).toContain('pageEditorImageAltLabel');
    unmount(instance);
  });

  it('renders caption text input', async () => {
    const { default: Component } = await import('./page-editor-image.svelte');
    const target = document.createElement('div');
    const instance = mount(Component, {
      target,
      props: { imageFile: null, imagePreview: '', imageAlt: '', imageCaption: '' }
    });
    expect(target.textContent).toContain('pageEditorImageCaptionLabel');
    unmount(instance);
  });

  it('renders image preview when imagePreview has a data URL', async () => {
    const { default: Component } = await import('./page-editor-image.svelte');
    const target = document.createElement('div');
    const instance = mount(Component, {
      target,
      props: {
        imageFile: null,
        imagePreview:
          'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
        imageAlt: '',
        imageCaption: ''
      }
    });
    expect(target.textContent).toContain('pageEditorImage');
    unmount(instance);
  });
});

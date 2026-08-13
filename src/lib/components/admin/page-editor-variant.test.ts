import '@testing-library/jest-dom/vitest';
import { mount, unmount } from 'svelte';
import { describe, expect, it } from 'vitest';

describe('PageEditorVariant', () => {
  const baseVariant = {
    content: '<p>Variant content</p>',
    description: 'A test page variant',
    imageAlt: '',
    imageCaption: '',
    title: 'Test Page'
  };

  it('renders the variant card with i18n title', async () => {
    const { default: Component } = await import('./page-editor-variant.svelte');
    const target = document.createElement('div');
    const instance = mount(Component, {
      props: {
        language: { code: 'es', label: 'Spanish' },
        variant: baseVariant
      },
      target
    });
    expect(target.textContent).toContain('pageEditorVariantTitle');
    unmount(instance);
  });

  it('renders title and description labels', async () => {
    const { default: Component } = await import('./page-editor-variant.svelte');
    const target = document.createElement('div');
    const instance = mount(Component, {
      props: {
        language: { code: 'es', label: 'Spanish' },
        variant: baseVariant
      },
      target
    });
    expect(target.textContent).toContain('pageEditorVariantTitleLabel');
    expect(target.textContent).toContain('pageEditorDescriptionLabel');
    expect(target.textContent).toContain('pageEditorContentLabel');
    unmount(instance);
  });

  it('renders image alt and caption inputs', async () => {
    const { default: Component } = await import('./page-editor-variant.svelte');
    const target = document.createElement('div');
    const instance = mount(Component, {
      props: {
        language: { code: 'fr', label: 'French' },
        variant: baseVariant
      },
      target
    });
    expect(target.textContent).toContain('pageEditorVariantImageAltLabel');
    expect(target.textContent).toContain('pageEditorVariantImageCaptionLabel');
    unmount(instance);
  });

  it('renders fallback note', async () => {
    const { default: Component } = await import('./page-editor-variant.svelte');
    const target = document.createElement('div');
    const instance = mount(Component, {
      props: {
        language: { code: 'he', label: 'Hebrew' },
        variant: baseVariant
      },
      target
    });
    expect(target.textContent).toContain('pageEditorVariantFallback');
    unmount(instance);
  });
});

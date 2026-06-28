import '@testing-library/jest-dom/vitest';
import { mount, unmount } from 'svelte';
import { describe, expect, it } from 'vitest';

describe('PageEditorVariant', () => {
  const baseVariant = {
    title: 'Test Page',
    description: 'A test page variant',
    content: '<p>Variant content</p>',
    imageAlt: '',
    imageCaption: ''
  };

  it('renders the variant card with i18n title', async () => {
    const { default: Component } = await import('./page-editor-variant.svelte');
    const target = document.createElement('div');
    const instance = mount(Component, {
      target,
      props: {
        variant: baseVariant,
        language: { code: 'es', label: 'Spanish' }
      }
    });
    expect(target.textContent).toContain('pageEditorVariantTitle');
    unmount(instance);
  });

  it('renders title and description labels', async () => {
    const { default: Component } = await import('./page-editor-variant.svelte');
    const target = document.createElement('div');
    const instance = mount(Component, {
      target,
      props: {
        variant: baseVariant,
        language: { code: 'es', label: 'Spanish' }
      }
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
      target,
      props: {
        variant: baseVariant,
        language: { code: 'fr', label: 'French' }
      }
    });
    expect(target.textContent).toContain('pageEditorVariantImageAltLabel');
    expect(target.textContent).toContain('pageEditorVariantImageCaptionLabel');
    unmount(instance);
  });

  it('renders fallback note', async () => {
    const { default: Component } = await import('./page-editor-variant.svelte');
    const target = document.createElement('div');
    const instance = mount(Component, {
      target,
      props: {
        variant: baseVariant,
        language: { code: 'he', label: 'Hebrew' }
      }
    });
    expect(target.textContent).toContain('pageEditorVariantFallback');
    unmount(instance);
  });
});

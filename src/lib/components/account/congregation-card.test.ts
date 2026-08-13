import '@testing-library/jest-dom/vitest';
import { mount, unmount } from 'svelte';
import { describe, expect, it, vi } from 'vitest';

describe('CongregationCard', () => {
  it('renders when congregation is set', async () => {
    const { default: CongregationCard } = await import('./congregation-card.svelte');
    const target = document.createElement('div');
    const instance = mount(CongregationCard, {
      props: {
        congregation: 'abc123',
        onUnlink: vi.fn()
      },
      target
    });
    expect(target.textContent).toContain('congregation');
    expect(target.textContent).toContain('unlinkFromCongregation');
    expect(target.textContent).toContain('editCongregation');
    unmount(instance);
  });

  it('renders nothing when congregation is empty', async () => {
    const { default: CongregationCard } = await import('./congregation-card.svelte');
    const target = document.createElement('div');
    const instance = mount(CongregationCard, {
      props: {
        congregation: '',
        onUnlink: vi.fn()
      },
      target
    });
    expect(target.textContent).toBe('');
    unmount(instance);
  });
});

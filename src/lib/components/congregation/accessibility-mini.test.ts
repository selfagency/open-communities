import '@testing-library/jest-dom/vitest';
import { mount, unmount } from 'svelte';
import { describe, expect, it } from 'vitest';

import type { AccessibilityResponse, IsoAutoDateString } from '$lib/pocketbase.d';

function makeAccessibility(overrides: Partial<AccessibilityResponse> = {}): AccessibilityResponse {
  return {
    id: 'test-acc',
    created: '2025-01-01T00:00:00.000Z' as IsoAutoDateString,
    updated: '2025-01-01T00:00:00.000Z' as IsoAutoDateString,
    collectionId: '',
    collectionName: 'accessibility',
    inPerson_adaSome: false,
    inPerson_adaAll: false,
    inPerson_asl: false,
    inPerson_eva: false,
    inPerson_noHearing: false,
    inPerson_wheelchair: false,
    inPerson_visual: false,
    inPerson_seating: false,
    inPerson_sensory: false,
    inPerson_bathroom: false,
    inPerson_carts: false,
    inPerson_tactile: false,
    inPerson_quiet: false,
    inPerson_guide: false,
    inPerson_masks: false,
    online_asl: false,
    online_automatedCaptions: false,
    online_liveCaptions: false,
    online_cart: false,
    online_transcript: false,
    online_guide: false,
    otherText: '',
    ...overrides
  } as AccessibilityResponse;
}

describe('AccessibilityMini', () => {
  it('renders ADA icon when ada accessibility present', async () => {
    const { default: A11yMini } = await import('./accessibility-mini.svelte');
    const target = document.createElement('div');
    const instance = mount(A11yMini, {
      target,
      props: { accessibility: makeAccessibility({ inPerson_adaAll: true }) }
    });
    expect(target.textContent).toContain('accessibility_ada');
    unmount(instance);
  });

  it('renders CC icon when captions present', async () => {
    const { default: A11yMini } = await import('./accessibility-mini.svelte');
    const target = document.createElement('div');
    const instance = mount(A11yMini, {
      target,
      props: { accessibility: makeAccessibility({ online_liveCaptions: true }) }
    });
    expect(target.textContent).toContain('accessibility_cc');
    unmount(instance);
  });

  it('renders EVA icon when eva present', async () => {
    const { default: A11yMini } = await import('./accessibility-mini.svelte');
    const target = document.createElement('div');
    const instance = mount(A11yMini, {
      target,
      props: { accessibility: makeAccessibility({ inPerson_eva: true }) }
    });
    expect(target.textContent).toContain('accessibility_eva');
    unmount(instance);
  });

  it('renders ASL icon when asl present', async () => {
    const { default: A11yMini } = await import('./accessibility-mini.svelte');
    const target = document.createElement('div');
    const instance = mount(A11yMini, {
      target,
      props: { accessibility: makeAccessibility({ inPerson_asl: true }) }
    });
    expect(target.textContent).toContain('accessibility_asl');
    unmount(instance);
  });

  it('renders nothing when no accessibility features', async () => {
    const { default: A11yMini } = await import('./accessibility-mini.svelte');
    const target = document.createElement('div');
    const instance = mount(A11yMini, {
      target,
      props: { accessibility: makeAccessibility() }
    });
    // no icons should render — the outer div has no visible text
    expect(target.textContent?.trim()).toBe('');
    unmount(instance);
  });

  it('renders multiple icons when multiple features present', async () => {
    const { default: A11yMini } = await import('./accessibility-mini.svelte');
    const target = document.createElement('div');
    const instance = mount(A11yMini, {
      target,
      props: {
        accessibility: makeAccessibility({
          inPerson_adaAll: true,
          online_liveCaptions: true,
          inPerson_eva: true,
          inPerson_asl: true
        })
      }
    });
    expect(target.textContent).toContain('accessibility_ada');
    expect(target.textContent).toContain('accessibility_cc');
    expect(target.textContent).toContain('accessibility_eva');
    expect(target.textContent).toContain('accessibility_asl');
    unmount(instance);
  });
});

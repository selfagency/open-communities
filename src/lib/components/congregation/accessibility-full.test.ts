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

describe('AccessibilityFull', () => {
  it('renders ADA section when ada present — lists adaSome and adaAll subtypes', async () => {
    const { default: A11yFull } = await import('./accessibility-full.svelte');
    const target = document.createElement('div');
    const instance = mount(A11yFull, {
      target,
      props: {
        accessibility: makeAccessibility({
          inPerson_adaAll: true,
          inPerson_adaSome: true
        })
      }
    });
    expect(target.textContent).toContain('accessibility_ada');
    expect(target.textContent).toContain('accessibility_inPerson_adaAll');
    expect(target.textContent).toContain('accessibility_inPerson_adaSome');
    unmount(instance);
  });

  it('renders CC section when captions present — lists automated and live subtypes', async () => {
    const { default: A11yFull } = await import('./accessibility-full.svelte');
    const target = document.createElement('div');
    const instance = mount(A11yFull, {
      target,
      props: {
        accessibility: makeAccessibility({
          online_automatedCaptions: true,
          online_liveCaptions: true
        })
      }
    });
    expect(target.textContent).toContain('accessibility_cc');
    expect(target.textContent).toContain('accessibility_online_automatedCaptions');
    expect(target.textContent).toContain('accessibility_online_liveCaptions');
    unmount(instance);
  });

  it('renders ASL section with inPerson and online subtypes', async () => {
    const { default: A11yFull } = await import('./accessibility-full.svelte');
    const target = document.createElement('div');
    const instance = mount(A11yFull, {
      target,
      props: {
        accessibility: makeAccessibility({
          inPerson_asl: true,
          online_asl: true
        })
      }
    });
    expect(target.textContent).toContain('accessibility_asl');
    expect(target.textContent).toContain('accessibility_inPerson_asl');
    expect(target.textContent).toContain('accessibility_online_asl');
    unmount(instance);
  });

  it('renders EVA section when eva present', async () => {
    const { default: A11yFull } = await import('./accessibility-full.svelte');
    const target = document.createElement('div');
    const instance = mount(A11yFull, {
      target,
      props: {
        accessibility: makeAccessibility({ inPerson_eva: true })
      }
    });
    expect(target.textContent).toContain('accessibility_eva');
    expect(target.textContent).toContain('accessibility_inPerson_eva');
    unmount(instance);
  });

  it('renders other text when present', async () => {
    const { default: A11yFull } = await import('./accessibility-full.svelte');
    const target = document.createElement('div');
    const instance = mount(A11yFull, {
      target,
      props: {
        accessibility: makeAccessibility({ otherText: 'Wheelchair ramp available' })
      }
    });
    expect(target.textContent).toContain('Wheelchair ramp available');
    unmount(instance);
  });

  it('renders unspecified message when no accessibility features', async () => {
    const { default: A11yFull } = await import('./accessibility-full.svelte');
    const target = document.createElement('div');
    const instance = mount(A11yFull, {
      target,
      props: { accessibility: makeAccessibility() }
    });
    expect(target.textContent).toContain('unspecified');
    unmount(instance);
  });

  it('does not render unspecified message when features exist', async () => {
    const { default: A11yFull } = await import('./accessibility-full.svelte');
    const target = document.createElement('div');
    const instance = mount(A11yFull, {
      target,
      props: {
        accessibility: makeAccessibility({ inPerson_adaAll: true })
      }
    });
    expect(target.textContent).not.toContain('unspecified');
    unmount(instance);
  });
});

/// <reference types="vitest" />
import { render, screen, within } from '@testing-library/svelte';
import '@testing-library/jest-dom/vitest';

import { m } from '$lib/paraglide/messages';
import type { AccessibilityRecord } from '$lib/pocketbase.d';
import { assertAccessible } from '$test/accesslint';

import Accessibility from './accessibility.svelte';

describe('Accessibility component', () => {
  it('renders mini mode icons for enabled accessibility features', () => {
    const accessibility = {
      inPerson_adaAll: false,
      inPerson_adaSome: true,
      inPerson_asl: false,
      inPerson_eva: false,
      online_asl: false,
      online_automatedCaptions: false,
      online_liveCaptions: false,
      otherText: ''
    } as AccessibilityRecord;

    render(Accessibility, { accessibility, mode: 'mini' });

    // sr-only labels should be present for the enabled feature
    expect(screen.getByText(m.accessibility_ada())).toBeInTheDocument();

    // disabled features should not be present
    expect(screen.queryByText(m.accessibility_cc())).not.toBeInTheDocument();
  });

  it('renders full mode with all present items and other text', () => {
    const accessibility = {
      inPerson_adaAll: true,
      inPerson_adaSome: false,
      inPerson_asl: true,
      inPerson_eva: true,
      online_asl: false,
      online_automatedCaptions: true,
      online_liveCaptions: false,
      otherText: 'Additional accessibility notes'
    } as AccessibilityRecord;

    render(Accessibility, { accessibility, mode: 'full' });

    // header exists
    expect(screen.getByText(m.accessibility())).toBeInTheDocument();

    // scope to the list so we avoid accidental global matches
    const list = screen.getByRole('list');

    // ada all text
    expect(within(list).getByText(m.accessibility_inPerson_adaAll())).toBeInTheDocument();

    // automated captions text
    expect(within(list).getByText(m.accessibility_online_automatedCaptions())).toBeInTheDocument();

    // eva and asl present
    expect(within(list).getByText(m.accessibility_inPerson_eva())).toBeInTheDocument();
    expect(within(list).getByText(m.accessibility_inPerson_asl())).toBeInTheDocument();

    // otherText should be rendered verbatim
    expect(within(list).getByText('Additional accessibility notes')).toBeInTheDocument();
  });

  it('renders unspecified when no accessibility flags are set', () => {
    const accessibility = {
      inPerson_adaAll: false,
      inPerson_adaSome: false,
      inPerson_asl: false,
      inPerson_eva: false,
      online_asl: false,
      online_automatedCaptions: false,
      online_liveCaptions: false,
      otherText: ''
    } as AccessibilityRecord;

    render(Accessibility, { accessibility, mode: 'full' });

    const list = screen.getByRole('list') as HTMLElement;

    // there should be a warning icon and a visible text node (the message may be a function inlined)
    const warnSvg = list.querySelector('.tabler-icon-alert-circle');
    expect(warnSvg).toBeInTheDocument();

    const spans = Array.from(list.querySelectorAll('span')) as HTMLSpanElement[];
    const visible = spans.find(
      (s) => !s.classList.contains('sr-only') && s.textContent && s.textContent.trim().length > 0
    );
    expect(visible).toBeDefined();
  });

  it('has no accessibility violations in mini mode', () => {
    const accessibility = { inPerson_adaSome: true } as AccessibilityRecord;
    const { container } = render(Accessibility, { accessibility, mode: 'mini' });
    assertAccessible(container);
  });

  it('has no accessibility violations in full mode', () => {
    const accessibility = {
      inPerson_adaAll: true,
      inPerson_asl: true,
      inPerson_eva: true,
      online_automatedCaptions: true,
      otherText: 'Notes'
    } as AccessibilityRecord;
    const { container } = render(Accessibility, { accessibility, mode: 'full' });
    assertAccessible(container);
  });
});

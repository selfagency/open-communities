/// <reference types="vitest" />

import { render, screen, within } from '@testing-library/svelte';
import '@testing-library/jest-dom/vitest';
import userEvent from '@testing-library/user-event';
import { copyText } from 'svelte-copy';
import { toast } from 'svelte-sonner';

import { m } from '$lib/paraglide/messages';

import Congregation from './congregation.svelte';

// use the same shape as pocketbase types (minimal)
const baseCong = {
  flavor: 'A friendly place',
  id: 'abc123',
  location: { city: { name: 'TestCity' }, country: { name: 'TestCountry' }, state: { name: 'TS' } },
  name: 'Test Congregation',
  services: { onlineOnly: false },
  visibility: true,
  visible: true
};

describe('Congregation component', () => {
  it('renders title and copy/share triggers copyText and toast', async () => {
    const user = userEvent.setup();

    // render dialog open so Dialog.Content (which contains the share button) is present
    render(Congregation, { congregation: baseCong, open: true });

    // title exists inside the opened dialog
    const dialog = screen.getByRole('dialog');
    expect(within(dialog).getByText('Test Congregation')).toBeInTheDocument();

    // find the invisible sr-only label for share and click its parent button
    const shareLabel = screen.getByText(m.share());
    const shareButton = shareLabel.closest('button');
    if (!shareButton) {
      throw new Error('share button not found');
    }

    await user.click(shareButton);

    expect(copyText).toHaveBeenCalled();
    expect(toast.success).toHaveBeenCalled();
  });

  // Accessibility test skipped: bits-ui Dialog uses svelte-toolbelt's
  // onDestroyEffect which triggers effect_orphan in Svelte 5's test
  // environment. This is a known @testing-library/svelte × Svelte 5
  // incompatibility (see AGENTS.md).
  // it('has no accessibility violations', () => { ... });
});

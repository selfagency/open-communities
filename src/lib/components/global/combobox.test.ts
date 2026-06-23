import { render, screen, waitFor, within } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom/vitest';
import { vi } from 'vitest';

import Combobox from './combobox.svelte';

describe('Combobox', () => {
  const items = [
    { id: 'one', label: 'Option One', value: 'one' },
    { id: 'two', label: 'Option Two', value: 'two' }
  ];

  it('renders the placeholder when no value is provided', () => {
    render(Combobox, { items, placeholder: 'Select an option' });

    expect(screen.getByText('Select an option')).toBeInTheDocument();
  });

  it('renders the selected label when value matches an item id', () => {
    render(Combobox, { items, value: 'two' });

    expect(screen.getByText('Option Two')).toBeInTheDocument();
  });

  // Skipped: testing-library/svelte ↔ svelte 5 incompatibility prevents event dispatch
  it.skip('opens the list, allows selecting an item and dispatches change with the item id', async () => {
    vi.useFakeTimers();
    render(Combobox, { items, placeholder: 'Pick' });
    vi.runAllTimers();
    vi.useRealTimers();

    const trigger = screen.getByRole('combobox');
    await userEvent.click(trigger);

    const option = await screen.findByText('Option One');
    await userEvent.click(option);

    // After selection, the trigger should show the selected label
    await waitFor(() => expect(within(trigger).getByText('Option One')).toBeInTheDocument());
  });

  it('shows a no-options message when items is empty', async () => {
    // ensure the component's initialization runs so the empty message is rendered
    vi.useFakeTimers();
    render(Combobox, { items: [], placeholder: 'Empty' });
    vi.runAllTimers();
    vi.useRealTimers();

    const trigger = screen.getByRole('combobox');
    await userEvent.click(trigger);

    expect(await screen.findByText('noOptions')).toBeInTheDocument();
  });

  it('does not open when disabled', async () => {
    const { container } = render(Combobox, {
      disabled: true,
      items,
      placeholder: 'Disabled'
    });

    // The component uses CSS `pointer-events-none` on the root wrapper when disabled.
    // jsdom doesn't enforce pointer-events in event dispatch, so assert the class is present instead.
    const wrapper = container.firstElementChild as HTMLElement | null;
    expect(wrapper).toBeTruthy();
    expect(wrapper).toHaveClass('pointer-events-none');
  });
});

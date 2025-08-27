import { render, screen } from '@testing-library/svelte';
import '@testing-library/jest-dom/vitest';

import Locale from './locale.svelte';

describe('Locale component', () => {
  it('renders current language label in mini mode', () => {
    render(Locale, { mode: 'mini' });
    // The trigger contains the language label (English root default)
    expect(screen.getByText(/English|EN|en/i)).toBeInTheDocument();
  });

  it('renders trigger with correct aria attributes', async () => {
    const { container } = render(Locale);
    const trigger = container.querySelector('button') as HTMLElement;
    expect(trigger).toBeTruthy();
    expect(trigger).toHaveAttribute('aria-haspopup', 'menu');
    expect(trigger).toHaveAttribute('data-slot', 'dropdown-menu-trigger');
  });
});

import { render, screen } from '@testing-library/svelte';
import '@testing-library/jest-dom/vitest';

import Locale from './locale.svelte';

describe('Locale component', () => {
  it('renders current language label in mini mode', () => {
    render(Locale, { mode: 'mini' });
    // The trigger contains the language label (English root default)
    // biome-ignore lint/performance/useTopLevelRegex: inline regex in test
    expect(screen.getByText(/English|EN|en/i)).toBeInTheDocument();
  });

  // biome-ignore lint/suspicious/useAwait: required by SvelteKit signature
  it('renders trigger with correct aria attributes', async () => {
    const { container } = render(Locale);
    const trigger = container.querySelector('button') as HTMLElement;
    expect(trigger).toBeTruthy();
    expect(trigger).toHaveAttribute('aria-haspopup', 'menu');
    expect(trigger).toHaveAttribute('data-slot', 'dropdown-menu-trigger');
  });
});

import { render, screen } from '@testing-library/svelte';
import '@testing-library/jest-dom/vitest';

import Page from './page.svelte';

describe('Page component', () => {
  it('renders title and sets document title with site title key', () => {
    const content = { content: '<p>Hello <strong>World</strong></p>', title: 'My Page' };
    render(Page, { content });

    // heading text
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('My Page');

    // head <title> includes page title and the messages title key (tests use key names)
    expect(document.title).toContain('My Page');
    expect(document.title).toContain('title');
  });

  it('renders HTML content safely via {@html}', () => {
    const content = { content: '<div data-testid="injected">Injected</div>', title: 'HTML Test' };
    render(Page, { content });

    const injected = screen.getByTestId('injected');
    expect(injected).toBeInTheDocument();
    expect(injected).toHaveTextContent('Injected');
  });

  it('renders heading and empty content when content.content is empty', () => {
    const content = { content: '', title: 'Empty' };
    render(Page, { content });

    // heading should still render
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Empty');

    // content area should exist but be empty
    const prose = document.querySelector('.prose');
    expect(prose).toBeInTheDocument();
    expect(prose).toBeEmptyDOMElement();
  });
});

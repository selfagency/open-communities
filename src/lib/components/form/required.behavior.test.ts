import '@testing-library/jest-dom/vitest';
import { describe, expect, it } from 'vitest';

describe('Required component (behavior)', () => {
  it('renders the required text when set=true', async () => {
    const { default: Component } = await import('./required.svelte');
    const target = document.createElement('div');

    new (Component as any)({ props: { set: true }, target });

    const textNode = target.querySelector('span');
    expect(textNode).toBeTruthy();
    expect(textNode?.textContent?.trim().length).toBeGreaterThan(0);
  });

  it('renders the required text when set=false', async () => {
    const { default: Component } = await import('./required.svelte');
    const target = document.createElement('div');

    new (Component as any)({ props: { set: false }, target });

    const textNode = target.querySelector('span');
    expect(textNode).toBeTruthy();
    expect(textNode?.textContent?.trim().length).toBeGreaterThan(0);
  });
});

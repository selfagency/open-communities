import { describe, expect, it, vi } from 'vitest';

vi.mock('svelte-sonner', () => ({ toast: { error: vi.fn(), success: vi.fn() } }));
vi.mock('sveltekit-superforms', () => ({
  superForm: () => ({
    enhance: vi.fn(),
    errors: { subscribe: vi.fn() },
    form: { subscribe: vi.fn() },
    message: { subscribe: vi.fn() }
  })
}));
// signup.ts imports superForm from the client subpath; mock it too.
vi.mock('sveltekit-superforms/client', () => ({
  superForm: () => ({
    enhance: vi.fn(),
    errors: { subscribe: vi.fn() },
    form: { subscribe: vi.fn() },
    message: { subscribe: vi.fn() }
  })
}));
vi.mock('$lib/paraglide/messages', () => ({
  m: { signUpFailure: () => 'Sign up failed', signUpSuccess: () => 'Signed up' }
}));
vi.mock('$lib/stores', () => ({ setState: vi.fn() }));
vi.mock('$lib/utils', () => ({ log: { debug: vi.fn(), error: vi.fn(), warn: vi.fn() } }));

describe('initForm', () => {
  it('exports initForm function', async () => {
    const mod = await import('../../lib/signup');
    expect(mod.initForm).toBeDefined();
    expect(typeof mod.initForm).toBe('function');
  });

  it('creates a form without throwing', async () => {
    const { initForm } = await import('../../lib/signup');
    expect(() => initForm({ name: 'test' })).not.toThrow();
  });

  it('handles empty data', async () => {
    const { initForm } = await import('../../lib/signup');
    expect(() => initForm({})).not.toThrow();
  });
});

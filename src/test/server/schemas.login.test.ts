import { describe, expect, it } from 'vitest';

import { loginSchema, tokenSchema } from '../../lib/schemas/login';

describe('loginSchema', () => {
  it('accepts valid login', () => {
    const result = loginSchema.safeParse({ email: 'user@example.com', password: 'secret123' });
    expect(result.success).toBe(true);
  });

  it('rejects missing email', () => {
    const result = loginSchema.safeParse({ password: 'secret123' });
    expect(result.success).toBe(false);
  });

  it('rejects missing password', () => {
    const result = loginSchema.safeParse({ email: 'user@example.com' });
    expect(result.success).toBe(false);
  });

  it('rejects empty email', () => {
    const result = loginSchema.safeParse({ email: '', password: 'secret123' });
    expect(result.success).toBe(false);
  });
});

describe('tokenSchema', () => {
  const validToken = 'verify-token-123';

  it('accepts verifyEmail with token', () => {
    const result = tokenSchema.safeParse({ token: validToken, type: 'verifyEmail' });
    expect(result.success).toBe(true);
  });

  it('accepts requestReset with token', () => {
    const result = tokenSchema.safeParse({ token: validToken, type: 'requestReset' });
    expect(result.success).toBe(true);
  });

  it('accepts resetPassword with matching passwords', () => {
    const result = tokenSchema.safeParse({
      token: validToken,
      type: 'resetPassword',
      email: 'user@example.com',
      password: 'NewPw123!',
      passwordConfirm: 'NewPw123!'
    });
    expect(result.success).toBe(true);
  });

  it('rejects missing token', () => {
    const result = tokenSchema.safeParse({ type: 'verifyEmail' });
    expect(result.success).toBe(false);
  });

  it('rejects empty token', () => {
    const result = tokenSchema.safeParse({ token: '', type: 'verifyEmail' });
    expect(result.success).toBe(false);
  });

  it('rejects invalid type', () => {
    const result = tokenSchema.safeParse({ token: validToken, type: 'invalid' });
    expect(result.success).toBe(false);
  });

  it('rejects mismatched passwords', () => {
    const result = tokenSchema.safeParse({
      token: validToken,
      type: 'resetPassword',
      email: 'user@example.com',
      password: 'NewPw123!',
      passwordConfirm: 'DifferentPw456!'
    });
    expect(result.success).toBe(false);
  });

  it('accepts optional email', () => {
    const result = tokenSchema.safeParse({ token: validToken, type: 'verifyEmail', email: 'user@example.com' });
    expect(result.success).toBe(true);
  });

  it('accepts optional password fields', () => {
    const result = tokenSchema.safeParse({
      token: validToken,
      type: 'verifyEmail',
      password: 'abc',
      passwordConfirm: 'abc'
    });
    expect(result.success).toBe(true);
  });
});

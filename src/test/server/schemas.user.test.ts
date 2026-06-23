import { describe, expect, it } from 'vitest';

import { userSchema } from '../../lib/schemas/user';

const validPw = 'Abcd1234!xyz';

describe('userSchema', () => {
  it('accepts valid user with lang and email', () => {
    const result = userSchema.safeParse({
      email: 'test@example.com',
      name: 'Test User',
      password: validPw,
      passwordConfirm: validPw,
      lang: 'en'
    });
    expect(result.success).toBe(true);
  });

  it('accepts Hebrew language', () => {
    const result = userSchema.safeParse({
      email: 'test@example.com',
      name: 'Test User',
      password: validPw,
      passwordConfirm: validPw,
      lang: 'he'
    });
    expect(result.success).toBe(true);
  });

  it('rejects invalid language', () => {
    const result = userSchema.safeParse({
      email: 'test@example.com',
      name: 'Test User',
      password: validPw,
      passwordConfirm: validPw,
      lang: 'invalid'
    });
    expect(result.success).toBe(false);
  });

  it('rejects mismatched passwords', () => {
    const result = userSchema.safeParse({
      email: 'test@example.com',
      name: 'Test User',
      password: validPw,
      passwordConfirm: 'differentPw1!'
    });
    expect(result.success).toBe(false);
  });
});

import { describe, expect, it } from 'vitest';

import { userSchema } from '../../lib/schemas/user';

describe('userSchema', () => {
  const validUser = {
    lang: 'en',
    name: 'Test User',
    name_public: true
  };

  it('accepts valid user settings', () => {
    const result = userSchema.safeParse(validUser);
    expect(result.success).toBe(true);
  });

  it('accepts Hebrew language', () => {
    const result = userSchema.safeParse({ ...validUser, lang: 'he' });
    expect(result.success).toBe(true);
  });

  it('rejects invalid language', () => {
    const result = userSchema.safeParse({ ...validUser, lang: 'invalid' });
    expect(result.success).toBe(false);
  });

  it('accepts optional fields', () => {
    const result = userSchema.safeParse({ lang: 'en', name: 'Test' });
    expect(result.success).toBe(true);
  });
});

import { describe, expect, it } from 'vitest';

import { childrenSchema } from '../../lib/schemas/children';

describe('childrenSchema', () => {
  const validData = {
    accessibility: 'wheelchair',
    email: 'test@example.com',
    name: 'Test Child',
    phone: '+1234567890',
    services: 'childcare'
  };

  it('accepts valid data', () => {
    const result = childrenSchema.safeParse(validData);
    expect(result.success).toBe(true);
  });

  it('rejects missing name', () => {
    const result = childrenSchema.safeParse({ ...validData, name: undefined });
    expect(result.success).toBe(false);
  });

  it('rejects invalid email', () => {
    const result = childrenSchema.safeParse({ ...validData, email: 'not-an-email' });
    expect(result.success).toBe(false);
  });
});

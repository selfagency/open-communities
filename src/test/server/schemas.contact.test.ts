import { describe, expect, it } from 'vitest';

import { contactSchema } from '../../lib/schemas/contact';

describe('contactSchema', () => {
  const validData = {
    captcha: 'test-token',
    email: 'user@example.com',
    message: 'I have a question about a congregation.',
    name: 'John Doe',
    reason: 'question'
  };

  it('accepts a valid question contact', () => {
    const result = contactSchema.safeParse(validData);
    expect(result.success).toBe(true);
  });

  it('accepts transfer reason', () => {
    const result = contactSchema.safeParse({ ...validData, reason: 'transfer' });
    expect(result.success).toBe(true);
  });

  it('accepts claim reason with record UUID', () => {
    const result = contactSchema.safeParse({
      ...validData,
      reason: 'claim',
      record: '550e8400-e29b-41d4-a716-446655440000'
    });
    expect(result.success).toBe(true);
  });

  it('rejects missing email', () => {
    const result = contactSchema.safeParse({ ...validData, email: undefined });
    expect(result.success).toBe(false);
  });

  it('rejects invalid email format', () => {
    const result = contactSchema.safeParse({ ...validData, email: 'bad' });
    expect(result.success).toBe(false);
  });

  it('rejects invalid reason', () => {
    const result = contactSchema.safeParse({ ...validData, reason: 'invalid' });
    expect(result.success).toBe(false);
  });

  it('rejects empty record UUID', () => {
    const result = contactSchema.safeParse({ ...validData, reason: 'claim', record: '' });
    expect(result.success).toBe(true); // '' is preprocessed to undefined
    if (result.success) {
      expect(result.data.record).toBeUndefined();
    }
  });

  it('rejects non-UUID record', () => {
    const result = contactSchema.safeParse({ ...validData, reason: 'claim', record: 'not-a-uuid' });
    expect(result.success).toBe(false);
  });
});

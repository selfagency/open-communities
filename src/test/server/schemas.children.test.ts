import { describe, expect, it } from 'vitest';

import { accessibilitySchema, registrationSchema } from '../../lib/schemas/children';

describe('accessibilitySchema', () => {
  const validData = {
    inPerson_adaAll: false,
    inPerson_adaSome: false,
    inPerson_asl: false,
    inPerson_eva: false,
    online_asl: false,
    online_automatedCaptions: false,
    online_liveCaptions: false,
    other: false
  };

  it('accepts valid data', () => {
    const result = accessibilitySchema.safeParse(validData);
    expect(result.success).toBe(true);
  });

  it('rejects missing required boolean', () => {
    const result = accessibilitySchema.safeParse({ ...validData, inPerson_adaAll: undefined });
    expect(result.success).toBe(false);
  });
});

describe('registrationSchema', () => {
  it('rejects invalid url', () => {
    const result = registrationSchema.safeParse({
      registrationType: 'free',
      url: 'not-a-url'
    });
    expect(result.success).toBe(false);
  });
});

import { describe, expect, it } from 'vitest';

import {
  accessibilitySchema,
  fitSchema,
  healthSchema,
  registrationSchema,
  securitySchema,
  servicesSchema
} from '../../lib/schemas/children';

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
  it('accepts free registration with email', () => {
    const result = registrationSchema.safeParse({
      email: 'register@shul.org',
      registrationType: 'free'
    });
    expect(result.success).toBe(true);
  });

  it('accepts sliding scale with url', () => {
    const result = registrationSchema.safeParse({
      registrationType: 'slidingScale',
      url: 'https://shul.org/register'
    });
    expect(result.success).toBe(true);
  });

  it('rejects invalid url', () => {
    const result = registrationSchema.safeParse({
      registrationType: 'free',
      url: 'not-a-url'
    });
    expect(result.success).toBe(false);
  });

  it('rejects missing registrationType', () => {
    const result = registrationSchema.safeParse({ email: 'test@test.com' });
    expect(result.success).toBe(false);
  });

  it('rejects empty registrationType', () => {
    const result = registrationSchema.safeParse({ registrationType: '' });
    expect(result.success).toBe(false);
  });

  it('rejects missing email and url (hasContact fails)', () => {
    const result = registrationSchema.safeParse({ registrationType: 'free' });
    expect(result.success).toBe(false);
  });

  it('accepts null url (preprocessed to undefined, hasContact passes with email)', () => {
    const result = registrationSchema.safeParse({
      email: 'test@test.com',
      registrationType: 'free',
      url: null
    });
    expect(result.success).toBe(true);
  });
});

describe('fitSchema', () => {
  it('accepts valid fit with flag', () => {
    const result = fitSchema.safeParse({
      clergyMember: true,
      flag: 'yes',
      multipleClergyMembers: false,
      other: false,
      otherText: '',
      publicStatement: true
    });
    expect(result.success).toBe(true);
  });

  it('accepts fit with other', () => {
    const result = fitSchema.safeParse({
      clergyMember: false,
      flag: null,
      multipleClergyMembers: false,
      other: true,
      otherText: 'vetted by committee',
      publicStatement: false
    });
    expect(result.success).toBe(true);
  });

  it('rejects when no option selected (valueSelected fails)', () => {
    const result = fitSchema.safeParse({
      clergyMember: false,
      multipleClergyMembers: false,
      other: false,
      publicStatement: false
    });
    expect(result.success).toBe(false);
  });

  it('accepts empty flag (preprocessed to undefined)', () => {
    const result = fitSchema.safeParse({
      clergyMember: true,
      flag: '',
      multipleClergyMembers: false,
      other: false,
      otherText: '',
      publicStatement: true
    });
    expect(result.success).toBe(true);
  });

  it('accepts yesBima flag', () => {
    const result = fitSchema.safeParse({
      clergyMember: true,
      flag: 'yesBima',
      multipleClergyMembers: false,
      other: false,
      otherText: '',
      publicStatement: true
    });
    expect(result.success).toBe(true);
  });

  it('rejects invalid flag value', () => {
    const result = fitSchema.safeParse({
      clergyMember: true,
      flag: 'invalid',
      multipleClergyMembers: false,
      other: false,
      otherText: '',
      publicStatement: true
    });
    expect(result.success).toBe(false);
  });
});

describe('healthSchema', () => {
  it('accepts maskingRequired', () => {
    const result = healthSchema.safeParse({ protocol: 'maskingRequired' });
    expect(result.success).toBe(true);
  });

  it('accepts maskingRecommended', () => {
    const result = healthSchema.safeParse({ protocol: 'maskingRecommended' });
    expect(result.success).toBe(true);
  });

  it('accepts noGuidelines', () => {
    const result = healthSchema.safeParse({ protocol: 'noGuidelines' });
    expect(result.success).toBe(true);
  });

  it('accepts other with text', () => {
    const result = healthSchema.safeParse({ otherText: 'outdoor only', protocol: 'other' });
    expect(result.success).toBe(true);
  });

  it('rejects empty protocol', () => {
    const result = healthSchema.safeParse({ protocol: '' });
    expect(result.success).toBe(false);
  });

  it('rejects missing protocol', () => {
    const result = healthSchema.safeParse({});
    expect(result.success).toBe(false);
  });

  it('rejects invalid protocol', () => {
    const result = healthSchema.safeParse({ protocol: 'invalid' });
    expect(result.success).toBe(false);
  });
});

describe('securitySchema', () => {
  it('accepts all false', () => {
    const result = securitySchema.safeParse({
      clergyArmed: false,
      congregantsArmed: false,
      localPolice: false,
      noFirearms: false,
      other: false,
      otherText: '',
      privateSecurityArmed: false,
      privateSecurityUnarmed: false
    });
    expect(result.success).toBe(true);
  });

  it('accepts multiple security measures', () => {
    const result = securitySchema.safeParse({
      clergyArmed: false,
      congregantsArmed: false,
      localPolice: true,
      noFirearms: true,
      other: false,
      otherText: '',
      privateSecurityArmed: false,
      privateSecurityUnarmed: true
    });
    expect(result.success).toBe(true);
  });

  it('accepts other with text', () => {
    const result = securitySchema.safeParse({
      clergyArmed: false,
      congregantsArmed: false,
      localPolice: false,
      noFirearms: false,
      other: true,
      otherText: 'neighborhood watch',
      privateSecurityArmed: false,
      privateSecurityUnarmed: false
    });
    expect(result.success).toBe(true);
  });

  it('rejects missing required boolean', () => {
    const result = securitySchema.safeParse({
      clergyArmed: false,
      localPolice: false,
      noFirearms: false,
      other: false,
      otherText: '',
      privateSecurityArmed: false,
      privateSecurityUnarmed: false
    });
    expect(result.success).toBe(false);
  });
});

describe('servicesSchema', () => {
  it('accepts inPerson', () => {
    const result = servicesSchema.safeParse({
      hybrid: false,
      inPerson: true,
      offsite: false,
      onlineOnly: false,
      other: false,
      otherText: ''
    });
    expect(result.success).toBe(true);
  });

  it('accepts hybrid', () => {
    const result = servicesSchema.safeParse({
      hybrid: true,
      inPerson: true,
      offsite: false,
      onlineOnly: false,
      other: false,
      otherText: ''
    });
    expect(result.success).toBe(true);
  });

  it('accepts onlineOnly', () => {
    const result = servicesSchema.safeParse({
      hybrid: false,
      inPerson: false,
      offsite: false,
      onlineOnly: true,
      other: false,
      otherText: ''
    });
    expect(result.success).toBe(true);
  });

  it('accepts offsite', () => {
    const result = servicesSchema.safeParse({
      hybrid: false,
      inPerson: false,
      offsite: true,
      onlineOnly: false,
      other: false,
      otherText: ''
    });
    expect(result.success).toBe(true);
  });

  it('accepts other with text', () => {
    const result = servicesSchema.safeParse({
      hybrid: false,
      inPerson: false,
      offsite: false,
      onlineOnly: false,
      other: true,
      otherText: 'outdoor gatherings'
    });
    expect(result.success).toBe(true);
  });

  it('rejects when no option selected (valueSelected fails)', () => {
    const result = servicesSchema.safeParse({
      hybrid: false,
      inPerson: false,
      offsite: false,
      onlineOnly: false,
      other: false,
      otherText: ''
    });
    expect(result.success).toBe(false);
  });

  it('accepts missing otherText (optional)', () => {
    const result = servicesSchema.safeParse({
      hybrid: false,
      inPerson: true,
      offsite: false,
      onlineOnly: false,
      other: false
    });
    expect(result.success).toBe(true);
  });
});

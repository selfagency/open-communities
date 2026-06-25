import { describe, expect, it } from 'vitest';

import { defaultSchema, deleteSchema, transferSchema } from '../../lib/schemas/record';

describe('deleteSchema', () => {
  it('accepts valid id', () => {
    const result = deleteSchema.safeParse({ id: 'abc123' });
    expect(result.success).toBe(true);
  });

  it('rejects empty id', () => {
    const result = deleteSchema.safeParse({ id: '' });
    expect(result.success).toBe(false);
  });

  it('rejects missing id', () => {
    const result = deleteSchema.safeParse({});
    expect(result.success).toBe(false);
  });
});

describe('transferSchema', () => {
  it('accepts valid transfer', () => {
    const result = transferSchema.safeParse({ email: 'new@owner.com', id: 'abc123' });
    expect(result.success).toBe(true);
  });

  it('accepts transfer with owner', () => {
    const result = transferSchema.safeParse({ email: 'new@owner.com', id: 'abc123', owner: 'user456' });
    expect(result.success).toBe(true);
  });

  it('rejects missing email', () => {
    const result = transferSchema.safeParse({ id: 'abc123' });
    expect(result.success).toBe(false);
  });

  it('rejects empty email', () => {
    const result = transferSchema.safeParse({ email: '', id: 'abc123' });
    expect(result.success).toBe(false);
  });

  it('rejects missing id', () => {
    const result = transferSchema.safeParse({ email: 'new@owner.com' });
    expect(result.success).toBe(false);
  });

  it('rejects empty id', () => {
    const result = transferSchema.safeParse({ email: 'new@owner.com', id: '' });
    expect(result.success).toBe(false);
  });
});

describe('defaultSchema', () => {
  const validData = {
    accessibility: {
      inPerson_adaAll: false,
      inPerson_adaSome: false,
      inPerson_asl: false,
      inPerson_eva: false,
      online_asl: false,
      online_automatedCaptions: false,
      online_liveCaptions: false,
      other: false
    },
    captcha: 'test-token',
    clergy: 'rabbi',
    contactEmail: 'rabbi@shul.org',
    contactName: 'Rabbi Cohen',
    contactUrl: 'https://shul.org/contact',
    denomination: 'reform',
    fit: {
      clergyMember: true,
      flag: 'yes',
      multipleClergyMembers: false,
      other: false,
      otherText: '',
      publicStatement: true
    },
    flavor: 'egalitarian',
    health: {
      otherText: '',
      protocol: 'maskingRequired'
    },
    location: {
      city: 'New York',
      country: 'US',
      state: 'NY'
    },
    name: 'Beth Shalom',
    notes: 'A welcoming community',
    owner: 'user123',
    registration: {
      email: 'register@shul.org',
      otherText: '',
      registrationType: 'free',
      url: 'https://shul.org/register'
    },
    security: {
      clergyArmed: false,
      congregantsArmed: false,
      localPolice: true,
      noFirearms: false,
      other: false,
      otherText: '',
      privateSecurityArmed: false,
      privateSecurityUnarmed: true
    },
    services: {
      hybrid: true,
      inPerson: true,
      offsite: false,
      onlineOnly: false,
      other: false,
      otherText: ''
    },
    visible: true
  };

  it('accepts valid congregation data', () => {
    const result = defaultSchema.safeParse(validData);
    expect(result.success).toBe(true);
  });

  it('accepts minimal valid data', () => {
    const result = defaultSchema.safeParse({
      accessibility: {
        inPerson_adaAll: false,
        inPerson_adaSome: false,
        inPerson_asl: false,
        inPerson_eva: false,
        online_asl: false,
        online_automatedCaptions: false,
        online_liveCaptions: false,
        other: false
      },
      clergy: 'rabbi',
      fit: {
        clergyMember: false,
        flag: 'no',
        multipleClergyMembers: false,
        other: true,
        otherText: 'vetted',
        publicStatement: false
      },
      flavor: 'traditional',
      health: { otherText: '', protocol: 'noGuidelines' },
      location: { city: '', country: '', state: '' },
      name: 'Min Shul',
      registration: {
        email: 'register@shul.org',
        otherText: '',
        registrationType: 'suggestedDonation',
        url: ''
      },
      security: {
        clergyArmed: false,
        congregantsArmed: false,
        localPolice: false,
        noFirearms: false,
        other: false,
        otherText: '',
        privateSecurityArmed: false,
        privateSecurityUnarmed: false
      },
      services: {
        hybrid: false,
        inPerson: true,
        offsite: false,
        onlineOnly: false,
        other: false,
        otherText: ''
      },
      visible: false
    });
    expect(result.success).toBe(true);
  });

  it('rejects missing name', () => {
    const result = defaultSchema.safeParse({ ...validData, name: '' });
    expect(result.success).toBe(false);
  });

  it('rejects missing clergy', () => {
    const result = defaultSchema.safeParse({ ...validData, clergy: '' });
    expect(result.success).toBe(false);
  });

  it('rejects missing flavor', () => {
    const result = defaultSchema.safeParse({ ...validData, flavor: '' });
    expect(result.success).toBe(false);
  });

  it('accepts empty contact fields (preprocessed to undefined)', () => {
    const result = defaultSchema.safeParse({
      ...validData,
      contactEmail: '',
      contactName: '',
      contactUrl: '',
      denomination: '',
      notes: ''
    });
    expect(result.success).toBe(true);
  });

  it('accepts null contactUrl', () => {
    const result = defaultSchema.safeParse({ ...validData, contactUrl: null });
    expect(result.success).toBe(true);
  });

  it('accepts null denomination', () => {
    const result = defaultSchema.safeParse({ ...validData, denomination: null });
    expect(result.success).toBe(true);
  });

  it('rejects invalid denomination', () => {
    const result = defaultSchema.safeParse({ ...validData, denomination: 'invalid' });
    expect(result.success).toBe(false);
  });

  it('rejects invalid email format in contactEmail', () => {
    const result = defaultSchema.safeParse({ ...validData, contactEmail: 'not-an-email' });
    expect(result.success).toBe(false);
  });

  it('rejects invalid url in contactUrl', () => {
    const result = defaultSchema.safeParse({ ...validData, contactUrl: 'not-a-url' });
    expect(result.success).toBe(false);
  });

  it('accepts missing captcha (nullable)', () => {
    const result = defaultSchema.safeParse({ ...validData, captcha: null });
    expect(result.success).toBe(true);
  });

  it('accepts optional id', () => {
    const result = defaultSchema.safeParse({ ...validData, id: 'cong-123' });
    expect(result.success).toBe(true);
  });

  it('accepts empty owner (preprocessed to undefined)', () => {
    const result = defaultSchema.safeParse({ ...validData, owner: '' });
    expect(result.success).toBe(true);
  });
});

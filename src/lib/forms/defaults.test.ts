import { describe, expect, it } from 'vitest';

import { createInitForm } from './defaults';

describe('createInitForm', () => {
  it('returns default form with owner set to user id for non-admin', () => {
    const user = { admin: false, id: 'user123' } as any;
    const form = createInitForm(user);
    expect(form.visible).toBe(false);
    expect(form.name).toBe('');
    expect(form.owner).toBe('user123');
  });

  it('returns default form with empty owner for admin', () => {
    const user = { admin: true, id: 'admin123' } as any;
    const form = createInitForm(user);
    expect(form.owner).toBe('');
  });

  it('returns owner as undefined when no user provided', () => {
    const form = createInitForm(undefined);
    expect(form.owner).toBeUndefined();
    expect(form.visible).toBe(false);
  });

  it('all fields have correct defaults', () => {
    const form = createInitForm(undefined);
    expect(form.accessibility).toEqual({
      inPerson_adaAll: false,
      inPerson_adaSome: false,
      inPerson_asl: false,
      inPerson_eva: false,
      online_asl: false,
      online_automatedCaptions: false,
      online_liveCaptions: false,
      other: false,
      otherText: ''
    });
    expect(form.health).toEqual({ otherText: '', protocol: '' });
    expect(form.services).toEqual({
      hybrid: false,
      inPerson: false,
      offsite: false,
      onlineOnly: false,
      other: false,
      otherText: ''
    });
    expect(form.location).toEqual({ city: '', country: '', latitude: 0, longitude: 0, state: '' });
  });
});

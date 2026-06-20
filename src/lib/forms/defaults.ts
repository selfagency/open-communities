import type { UsersRecord } from '$lib/pocketbase.d';

/** Default form values for the add/edit congregation form. */
export function createInitForm(user: UsersRecord & { id: string }) {
  return {
    accessibility: {
      inPerson_adaAll: false,
      inPerson_adaSome: false,
      inPerson_asl: false,
      inPerson_eva: false,
      online_asl: false,
      online_automatedCaptions: false,
      online_liveCaptions: false,
      other: false,
      otherText: ''
    },
    captcha: '',
    clergy: '',
    contactEmail: '',
    contactName: '',
    contactUrl: '',
    denomination: '',
    fit: {
      clergyMember: false,
      flag: '',
      multipleClergyMembers: false,
      other: false,
      otherText: '',
      publicStatement: false
    },
    flavor: '',
    health: {
      otherText: '',
      protocol: ''
    },
    location: {
      city: '',
      country: '',
      latitude: 0,
      longitude: 0,
      state: ''
    },
    name: '',
    notes: '',
    owner: user?.admin ? '' : user?.id,
    registration: {
      email: '',
      otherText: '',
      registrationType: '',
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
      inPerson: false,
      offsite: false,
      onlineOnly: false,
      other: false,
      otherText: ''
    },
    visible: false
  };
}

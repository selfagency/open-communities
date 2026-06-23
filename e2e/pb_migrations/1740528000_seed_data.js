/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  console.log('[seed] Seeding test data...');

  // Skip if already seeded
  const existing = app.findRecordsByFilter('users', 'email="regular@example.test"', '', 0, 0);
  if (existing.length > 0) {
    console.log('[seed] Already seeded, skipping');
    return;
  }

  function create(collection, data) {
    const col = app.findCollectionByNameOrId(collection);
    const record = new Record(col);
    for (const [key, value] of Object.entries(data)) {
      record.set(key, value);
    }
    app.save(record);
    return record;
  }

  // Countries
  const us = create('countries', { name: 'United States', code: 'US', flag: '🇺🇸', longitude: -98.5795, latitude: 39.8283 });

  // States
  const ny = create('states', { name: 'New York', code: 'NY', country: us.getId(), longitude: -74.006, latitude: 40.7128 });
  const ca = create('states', { name: 'California', code: 'CA', country: us.getId(), longitude: -119.6816, latitude: 36.1162 });

  // Cities
  const nyc = create('cities', { name: 'New York City', state: ny.getId(), country: us.getId(), longitude: -74.006, latitude: 40.7128 });
  const bkn = create('cities', { name: 'Brooklyn', state: ny.getId(), country: us.getId(), longitude: -73.9442, latitude: 40.6782 });
  const la  = create('cities', { name: 'Los Angeles', state: ca.getId(), country: us.getId(), longitude: -118.2437, latitude: 34.0522 });

  // Users
  const regular = create('users', { email: 'regular@example.test', password: 'TestPass123!', passwordConfirm: 'TestPass123!', name: 'Regular User', verified: true, admin: false, lang: 'en', emailVisibility: true });
  const other = create('users', { email: 'other@example.test', password: 'TestPass123!', passwordConfirm: 'TestPass123!', name: 'Other User', verified: true, admin: false, lang: 'en', emailVisibility: true });

  // Congregations
  create('accessibility', { online_liveCaptions: true, online_automatedCaptions: true, inPerson_eva: true, inPerson_asl: true, inPerson_adaAll: true, inPerson_adaSome: true });
  create('fit', { youngFamilies: true, youngAdults: true, seniors: true, singles: true, interfaith: true, lgbtq: true, beginners: true, families: true });
  create('health', { requiresVax: true, hasAirPurification: true });
  create('registration', { maxCapacity: 500 });
  create('security', { securityPresent: true, secureEntry: true, cctv: true, guards: true, emergencyPlan: true });
  create('services', { fridayNight: true, saturdayMorning: true, holiday: true, hybrid: true, online: true, timeFridayNight: '18:30', timeSaturdayMorning: '09:30' });

  create('congregations', {
    name: 'Shalom Congregation', clergy: 'rabbi', denomination: 'reform', flavor: 'egalitarian',
    notes: 'A welcoming Reform community', contactName: 'Rabbi Cohen', contactEmail: 'info@shalom.org',
    contactUrl: 'https://shalom.org', country: us.getId(), state: ny.getId(), city: nyc.getId(),
    visible: true, owner: regular.getId(),
  });

  create('services', { fridayNight: true, holiday: true });
  create('congregations', {
    name: 'Private Minyan', clergy: 'lay-led', denomination: 'conservative', flavor: 'traditional',
    contactName: 'Private Member', contactEmail: 'private@example.test',
    country: us.getId(), state: ny.getId(), city: bkn.getId(),
    visible: false, owner: regular.getId(),
  });

  create('services', { saturdayMorning: true, holiday: true });
  create('congregations', {
    name: 'Other Community', clergy: 'rabbi', denomination: 'orthodox', flavor: 'modern',
    contactName: 'Other Rabbi', contactEmail: 'other@example.test',
    country: us.getId(), state: ca.getId(), city: la.getId(),
    visible: true, owner: other.getId(),
  });

  create('accessibility', { online_liveCaptions: true, online_automatedCaptions: true });
  create('fit', { interfaith: true, lgbtq: true });
  create('registration', { requiresRegistration: true });
  create('services', { fridayNight: true, hybrid: true, online: true, timeFridayNight: '19:00' });
  create('congregations', {
    name: 'Online Gathering', clergy: '', denomination: 'reconstructionist', flavor: 'online',
    notes: 'Zoom-based community', contactName: 'Online Group', contactEmail: 'online@example.test',
    contactUrl: 'https://online.example.test', country: us.getId(), state: ca.getId(), city: la.getId(),
    visible: true, owner: regular.getId(),
  });

  // Pages
  create('pages', { title: 'About', slug: 'about', content: '# About Open Communities\n\nDirectory.', published: true });
  create('pages', { title: 'Privacy Policy', slug: 'privacy', content: '# Privacy\n\nYour privacy matters.', published: true });
  create('pages', { title: 'FAQ', slug: 'faq', content: '# FAQ\n\n## How do I add?\n\nClick the button.', published: true });

  console.log('[seed] Seed complete!');
}, (app) => {
  // down
  console.log('[seed] Down migration (no-op)');
});

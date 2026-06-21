// Auto-generated migration to seed E2E test data.
// Created by e2e/scripts/bootstrap.mjs — do not edit manually.
// Run by PocketBase on startup.

migrate((app) => {
  console.log('[seed] Seeding test data...');

  function createRecord(collectionName, data) {
    const collection = app.findCollectionByNameOrId(collectionName);
    const record = new Record(collection);
    for (const [key, value] of Object.entries(data)) {
      record.set(key, value);
    }
    app.save(record);
    return record;
  }

  // Skip if already seeded
  const existing = app.findRecordsByFilter('users', 'email="regular@example.test"', '', 0, 0);
  if (existing.length > 0) {
    console.log('[seed] Already seeded, skipping');
    return;
  }

  // ── Countries ──
  const us = createRecord('countries', { name: 'United States', code: 'US', flag: '🇺🇸', longitude: -98.5795, latitude: 39.8283 });

  // ── States ──
  const ny = createRecord('states', { name: 'New York', code: 'NY', country: us.getId(), longitude: -74.006, latitude: 40.7128 });
  const ca = createRecord('states', { name: 'California', code: 'CA', country: us.getId(), longitude: -119.6816, latitude: 36.1162 });
  const il = createRecord('states', { name: 'Illinois', code: 'IL', country: us.getId(), longitude: -89.3985, latitude: 40.6331 });
  const fl = createRecord('states', { name: 'Florida', code: 'FL', country: us.getId(), longitude: -81.5158, latitude: 27.6648 });
  const ma = createRecord('states', { name: 'Massachusetts', code: 'MA', country: us.getId(), longitude: -71.3824, latitude: 42.4072 });

  // ── Cities ──
  const cities = {
    NYC: createRecord('cities', { name: 'New York City', state: ny.getId(), country: us.getId(), longitude: -74.006, latitude: 40.7128 }),
    BKN: createRecord('cities', { name: 'Brooklyn', state: ny.getId(), country: us.getId(), longitude: -73.9442, latitude: 40.6782 }),
    LA: createRecord('cities', { name: 'Los Angeles', state: ca.getId(), country: us.getId(), longitude: -118.2437, latitude: 34.0522 }),
    SF: createRecord('cities', { name: 'San Francisco', state: ca.getId(), country: us.getId(), longitude: -122.4194, latitude: 37.7749 }),
    CHI: createRecord('cities', { name: 'Chicago', state: il.getId(), country: us.getId(), longitude: -87.6298, latitude: 41.8781 }),
    MIA: createRecord('cities', { name: 'Miami', state: fl.getId(), country: us.getId(), longitude: -80.1918, latitude: 25.7617 }),
    BOS: createRecord('cities', { name: 'Boston', state: ma.getId(), country: us.getId(), longitude: -71.0589, latitude: 42.3601 }),
  };

  // ── Users ──
  const userData = [
    { email: 'regular@example.test', password: 'TestPass123!', passwordConfirm: 'TestPass123!', name: 'Regular User', verified: true, admin: false, lang: 'en', emailVisibility: true },
    { email: 'other@example.test', password: 'TestPass123!', passwordConfirm: 'TestPass123!', name: 'Other User', verified: true, admin: false, lang: 'en', emailVisibility: true },
    { email: 'admin@example.test', password: 'TestPass123!', passwordConfirm: 'TestPass123!', name: 'Admin User', verified: true, admin: true, lang: 'en', emailVisibility: true },
  ];
  const users = {};
  for (const u of userData) {
    const r = createRecord('users', u);
    users[u.email] = r.getId();
  }

  // ── Congregations ──
  const childTableNames = ['accessibility', 'fit', 'health', 'registration', 'security', 'services'];
  const congregationDefs = [
    {
      name: 'Shalom Congregation', clergy: 'rabbi', denomination: 'reform', flavor: 'egalitarian',
      notes: 'A welcoming Reform community', contactName: 'Rabbi Cohen', contactEmail: 'info@shalom.org',
      contactUrl: 'https://shalom.org', city: cities.NYC, visible: true, owner: users['regular@example.test'],
      children: {
        accessibility: { online_liveCaptions: true, online_automatedCaptions: true, inPerson_eva: true, inPerson_asl: true, inPerson_adaAll: true, inPerson_adaSome: true },
        fit: { youngFamilies: true, youngAdults: true, seniors: true, singles: true, interfaith: true, lgbtq: true, beginners: true, families: true },
        health: { requiresVax: true, hasAirPurification: true },
        registration: { maxCapacity: 500 },
        security: { securityPresent: true, secureEntry: true, cctv: true, guards: true, emergencyPlan: true },
        services: { fridayNight: true, saturdayMorning: true, holiday: true, hybrid: true, online: true, timeFridayNight: '18:30', timeSaturdayMorning: '09:30' },
      },
    },
    {
      name: 'Private Minyan', clergy: 'lay-led', denomination: 'conservative', flavor: 'traditional',
      notes: '', contactName: 'Private Member', contactEmail: 'private@example.test',
      contactUrl: '', city: cities.BKN, visible: false, owner: users['regular@example.test'],
      children: { services: { fridayNight: true, holiday: true } },
    },
    {
      name: 'Other Community', clergy: 'rabbi', denomination: 'orthodox', flavor: 'modern',
      notes: '', contactName: 'Other Rabbi', contactEmail: 'other@example.test',
      contactUrl: '', city: cities.LA, visible: true, owner: users['other@example.test'],
      children: { services: { saturdayMorning: true, holiday: true } },
    },
    {
      name: 'Online Gathering', clergy: '', denomination: 'reconstructionist', flavor: 'online',
      notes: 'Zoom-based community', contactName: 'Online Group', contactEmail: 'online@example.test',
      contactUrl: 'https://online.example.test', city: cities.SF, visible: true, owner: users['regular@example.test'],
      children: {
        accessibility: { online_liveCaptions: true, online_automatedCaptions: true },
        fit: { interfaith: true, lgbtq: true },
        registration: { requiresRegistration: true },
        services: { fridayNight: true, hybrid: true, online: true, timeFridayNight: '19:00' },
      },
    },
  ];

  for (const cd of congregationDefs) {
    for (const table of childTableNames) {
      const childData = cd.children[table];
      if (!childData || Object.keys(childData).length === 0) continue;
      createRecord(table, childData);
    }

    createRecord('congregations', {
      name: cd.name, clergy: cd.clergy, denomination: cd.denomination, flavor: cd.flavor,
      notes: cd.notes, contactName: cd.contactName, contactEmail: cd.contactEmail,
      contactUrl: cd.contactUrl, country: us.getId(), state: cd.city.get('state'),
      city: cd.city.getId(), visible: cd.visible, owner: cd.owner,
    });
  }

  // ── Pages ──
  const pages = [
    { title: 'About', slug: 'about', content: '# About\n\nDirectory of Jewish congregations.', published: true },
    { title: 'Privacy Policy', slug: 'privacy', content: '# Privacy\n\nYour privacy matters.', published: true },
    { title: 'FAQ', slug: 'faq', content: '# FAQ\n\n## How do I add?\n\nClick the button.', published: true },
  ];
  for (const p of pages) createRecord('pages', p);

  console.log('[seed] Seed complete!');
}, (app) => {
  console.log('[seed] Down migration (no-op)');
});

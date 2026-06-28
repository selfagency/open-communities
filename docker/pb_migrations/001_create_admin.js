// fallow-ignore-file unused-file -- auto-loaded by PocketBase at startup
// Migration: Create default admin user for local development
// Runs automatically on fresh PB database startup.
//
// PB v0.29+ JSVM API (process.env not available — vars set via docker exec):
//   app.findRecordByFilter(coll, filter, params)
//   app.newRecord(coll)
//   record.set(col, value)
//   record.setPassword(password)
//   app.save(record)

migrate((app) => {
  try {
    const existing = app.findRecordByFilter('_superusers', 'email = {:email}', {
      email: 'admin@test.com'
    });
    if (existing) {
      console.log('[migration] Admin already exists, skipping');
      return;
    }
    const record = app.newRecord('_superusers');
    record.set('email', 'admin@test.com');
    record.setPassword('i3_NL-dfzzFt5TX'); // NOSONAR — test fixture fallback
    app.save(record);
    console.log('[migration] Admin created');
  } catch (e) {
    console.log('[migration] Admin creation:', e.message);
  }
});

// Migration: Create default admin user for local development
// Runs automatically on fresh PB database startup.

migrate((app) => {
  const email = process.env.PB_TEST_ADMIN || 'admin@test.com';
  const password = process.env.PB_TEST_PASSWORD || process.env.PB_TEST_PASSWORD_FALLBACK || 'i3_NL-dfzzFt5TX';

  try {
    const dao = app.dao();
    const existing = dao.findFirstRecordByFilter('_superusers', 'email = {:email}', { email });
    if (existing) {
      console.log('[migration] Admin already exists, skipping');
      return;
    }
    const record = dao.findRecordById('_superusers', '');
    record.set('email', email);
    record.setPassword(password);
    dao.saveRecord(record);
    console.log('[migration] Admin created');
  } catch (e) {
    console.log('[migration] Admin creation:', e.message);
  }
});

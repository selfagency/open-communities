// E2E test credentials — centralized fixture, not real secrets
// Override via environment variables for CI

export const TEST_PASSWORD = process.env.E2E_TEST_PASSWORD ?? 'TestPass123!'; // NOSONAR — E2E test fixture, not a real credential
export const TEST_EMAIL = process.env.E2E_TEST_EMAIL ?? 'regular@example.test';
export const ADMIN_EMAIL = process.env.E2E_ADMIN_EMAIL ?? 'admin@test.com';
export const ADMIN_PASSWORD = process.env.E2E_ADMIN_PASSWORD ?? 'i3_NL-dfzzFt5TX'; // NOSONAR — E2E test fixture, not a real credential

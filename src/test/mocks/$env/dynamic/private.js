// Private env vars used by server tests
const { CAPTCHA_SITE_SECRET } = process.env;
const ADMIN_EMAIL = 'admin@test.local';
const MAILGUN_API_KEY = 'test-key';
const MAILGUN_DOMAIN = 'm.opencommunities.info';

export const env = {
  ADMIN_EMAIL,
  CAPTCHA_SITE_SECRET,
  MAILGUN_API_KEY,
  MAILGUN_DOMAIN,
  POSTHOG_CLI_API_KEY: 'phx_test_key',
  POSTHOG_CLI_HOST: 'http://localhost:3001',
  POSTHOG_CLI_PROJECT_ID: '212770',
  // Getter so tests can set process.env.REDIS_URL after module load (the
  // module is cached across test files in the same worker).
  get REDIS_URL() {
    return process.env.REDIS_URL ?? '';
  }
};

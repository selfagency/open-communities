const SMTP_USER = '';
const SMTP_PASS = '';
const SMTP_HOST = 'localhost';
const SMTP_PORT = '1025';

// Private env vars used by server tests
const ADMIN_EMAIL = 'admin@test.local';
const CAPTCHA_SITE_SECRET = process.env.CAPTCHA_SITE_SECRET;

export const env = {
  ADMIN_EMAIL,
  CAPTCHA_SITE_SECRET,
  POSTHOG_CLI_API_KEY: 'phx_test_key',
  POSTHOG_CLI_PROJECT_ID: '212770',
  POSTHOG_CLI_HOST: 'http://localhost:3001',
  // Getter so tests can set process.env.REDIS_URL after module load (the
  // module is cached across test files in the same worker).
  get REDIS_URL() {
    return process.env.REDIS_URL ?? '';
  },
  SMTP_HOST,
  SMTP_PASS,
  SMTP_PORT,
  SMTP_USER
};

export default env;

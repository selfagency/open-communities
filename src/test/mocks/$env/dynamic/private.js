const SMTP_USER = '';
const SMTP_PASS = '';
const SMTP_HOST = 'localhost';
const SMTP_PORT = '1025';

// Private env vars used by server tests
const ADMIN_EMAIL = 'admin@test.local';
const CAPTCHA_SITE_SECRET = process.env.CAPTCHA_SITE_SECRET

export const env = {
	ADMIN_EMAIL,
	CAPTCHA_SITE_SECRET,
	SMTP_HOST,
	SMTP_PASS,
	SMTP_PORT,
	SMTP_USER
}

export default env;
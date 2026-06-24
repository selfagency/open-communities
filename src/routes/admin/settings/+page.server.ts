import type { PageServerLoad } from './$types';
import { env } from '$env/dynamic/private';

export const load: PageServerLoad = async () => {
  return {
    nodeVersion: process.version,
    smtpHost: env.SMTP_HOST || 'Not configured',
    smtpPort: env.SMTP_PORT || '',
    posthogHost: env.POSTHOG_CLI_HOST || 'Not configured',
    pocketBaseUrl: env.PUBLIC_API_ENDPOINT || 'http://localhost:8090'
  };
};

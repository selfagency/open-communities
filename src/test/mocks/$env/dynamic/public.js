const PUBLIC_API_ENDPOINT = 'http://127.0.0.1:8090';
const PUBLIC_HOSTNAME = 'http://localhost:4173';
const PUBLIC_SENTRY_DSN = '';

export const env = {
  PUBLIC_API_ENDPOINT,
  PUBLIC_HOSTNAME,
  PUBLIC_SENTRY_DSN
}

// Provide a default export to avoid ESM named export resolution issues under test bundling
export default env;
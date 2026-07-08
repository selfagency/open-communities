// fallow-ignore-file unused-file -- loaded via require() by posthog.pb.js handlers
// Shared config module loaded via require() from posthog.pb.js handlers.
// Exporting as a module avoids the isolated-scope issue where handler
// contexts can't access variables declared outside the handler function.

let key = '';
let host = 'https://us.i.posthog.com';

try {
  if (typeof process !== 'undefined') {
    if (process.env.POSTHOG_PB_API_KEY) {
      key = process.env.POSTHOG_PB_API_KEY;
    }
    if (process.env.POSTHOG_PB_HOST) {
      host = process.env.POSTHOG_PB_HOST.replace(/\/+$/, '');
    }
  }
} catch {
  /* silent — env access must never break PB */
}

module.exports = { key, host };

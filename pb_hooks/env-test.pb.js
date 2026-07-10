// pb_hooks/env-test.pb.js

const POSTHOG_PB_API_KEY = process.env.POSTHOG_PB_API_KEY;
console.log('POSTHOG_PB_API_KEY: ', POSTHOG_PB_API_KEY);

// Test the hook registration
onModelCreate((e) => {
  console.log('env-test hook fired');
  e.next();
}, '_logs');

<wizard-report>
# PostHog post-wizard report

The wizard completed a deep integration of your project, supplementing the existing PostHog instrumentation with missing event captures, user identification on login, session reset on logout, and a corrected client-side initialization sequence.

## Changes made

| File | Change |
|------|--------|
| `src/lib/posthog.ts` | Fixed `ui_host` (was pointing to the reverse proxy; changed to `https://us.posthog.com`). Added `defaults: '2026-01-30'` option. |
| `src/hooks.client.ts` | Added `init` export that calls `initPosthog()` so PostHog is guaranteed to be initialized before `handleError` runs. |
| `src/routes/login/+page.server.ts` | Added `capture(user.id, 'login')` on successful authentication. |
| `src/lib/components/login/index.svelte` | Added `posthog.identify(result.data.user.id)` in the success callback so the client-side session is linked to the authenticated user. |
| `src/routes/logout/+page.svelte` | Added `posthog.capture('logout')` and `posthog.reset()` before the redirect so the session is cleanly closed. |

## Events instrumented

| Event name | Description | File |
|------------|-------------|------|
| `signup` | User created a new account | `src/routes/login/+page.server.ts` _(pre-existing)_ |
| `login` | User successfully authenticated | `src/routes/login/+page.server.ts` _(added)_ |
| `logout` | User explicitly ended their session | `src/routes/logout/+page.svelte` _(added)_ |
| `addCongregation` | User submitted a new congregation listing | `src/routes/add/+page.server.ts` _(pre-existing)_ |
| `editCongregation` | User edited their congregation listing | `src/routes/edit/+page.server.ts` _(pre-existing)_ |
| `deleteCongregation` | User deleted their congregation listing | `src/routes/edit/+page.server.ts` _(pre-existing)_ |
| `transferCongregation` | Admin transferred ownership of a congregation | `src/routes/edit/+page.server.ts` _(pre-existing)_ |
| `contactForm` | User submitted the contact form | `src/routes/contact/+page.server.ts` _(pre-existing)_ |

## Next steps

We've built a dashboard and five insights to monitor key user behaviors:

- [Analytics basics (wizard) dashboard](https://us.posthog.com/project/212770/dashboard/1750330)
- [User signups over time](https://us.posthog.com/project/212770/insights/BZaJA6ly)
- [User logins over time](https://us.posthog.com/project/212770/insights/0gYzV168)
- [Congregation submissions](https://us.posthog.com/project/212770/insights/WXwbUi2C)
- [Congregation management activity](https://us.posthog.com/project/212770/insights/TSnhcFSR)
- [Signup → congregation submission funnel](https://us.posthog.com/project/212770/insights/w0QjqFYK)

## Verify before merging

- [ ] Run a full production build (`pnpm build`) and fix any lint or type errors introduced by the generated code.
- [ ] Run the test suite — call sites that were rewritten or instrumented may need updated mocks or fixtures.
- [ ] Add `PUBLIC_POSTHOG_KEY` and `PUBLIC_POSTHOG_HOST` to `.env.example` (they're already present as empty placeholders — confirm collaborator docs reference them).
- [ ] Wire source-map upload (`posthog-cli sourcemap` or your bundler's upload step) into CI so production stack traces de-minify.
- [ ] Confirm the returning-visitor path also calls `identify` — currently `initPosthog(user)` in `+layout.ts` handles this on page load, but verify a logged-in user refreshing the app still gets identified correctly in PostHog.

### Agent skill

We've left an agent skill folder in your project. You can use this context for further agent development when using Claude Code. This will help ensure the model provides the most up-to-date approaches for integrating PostHog.

</wizard-report>

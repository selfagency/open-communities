# AGENTS.md

## Project Overview

**Open Communities** — a SvelteKit 5 directory app for finding Jewish congregations welcoming of Jews opposed to Israel's war in Gaza. Users search a map-based directory, submit congregations, and contact admins. Backed by PocketBase (self-hosted), with i18n (EN/ES/FR/HE), captcha, email notifications, and PostHog analytics.

**Key technologies:**

- SvelteKit 5 (adapter-node, standalone mode) + Svelte 5 runes
- PocketBase 0.29.x (typed via `pocketbase-typegen`)
- Tailwind CSS v4 (CSS-first, `@import "tailwindcss"`)
- shadcn-svelte + Bits UI component library
- TypeScript (strict mode, `noImplicitAny: false` — fix before adding new code)
- Vitest (browser mode via Playwright) + Playwright E2E
- Paraglide/Inlang for i18n
- Zod 4 + Superforms + Formsnap for form validation
- MapLibre GL JS via `svelte-maplibre`
- PostHog for analytics (client + server)
- tslog for structured logging
- Radashi utility library
- nanostores for client state management
- svelte-sonner for toasts
- sveltekit-helmet for security headers

## Architecture

```
src/
├── app.html              # HTML shell with OG tags, fonts, cap.js widget
├── app.css               # Tailwind v4 entry + CSS custom properties
├── app.d.ts              # SvelteKit App namespace (Locals, PageData, Error)
├── hooks.server.ts       # Server hooks: auth, i18n, PostHog, logging
├── hooks.client.ts       # Client error handler
├── hooks.ts              # Reroute for i18n URL de-localization
├── lib/
│   ├── api.ts            # Client-side PocketBase helpers (convertBooleans, expand)
│   ├── server/
│   │   ├── api.ts        # Server-side PocketBase singleton + loadUser
│   │   ├── mail.ts       # Nodemailer transport + email templates
│   │   ├── security.ts   # Helmet CSP config
│   │   ├── posthog.ts    # Server-side PostHog capture
│   │   ├── logger.ts     # tslog structured logger
│   │   └── utils.ts      # validateCaptcha, cleanResponse
│   ├── components/       # Svelte components (congregation/, form/, global/, login/, search/, ui/)
│   ├── schemas/          # Zod schemas (children, contact, login, record, user)
│   ├── stores.ts         # nanostores (app state, form state)
│   ├── search.ts         # Fuzzy search via uFuzzy
│   ├── location.ts       # Country/state/city cascade from PocketBase
│   ├── posthog.ts        # Client-side PostHog init
│   ├── utils.ts          # Shared client utilities
│   └── paraglide/        # Auto-generated i18n (do not edit)
├── routes/               # SvelteKit file-based routing
│   ├── +layout.svelte    # App shell (nav, footer, i18n switcher)
│   ├── +page.svelte      # Home/map page
│   ├── [slug]/           # Dynamic pages from PocketBase `pages` collection
│   ├── add/              # Add congregation form
│   ├── contact/          # Contact form
│   ├── edit/             # Edit congregation (submit + delete actions)
│   ├── login/            # Login/signup/verify
│   ├── logout/           # Logout
│   └── user/             # User settings (lang endpoint)
└── test/                 # Test infrastructure
    ├── setupTest.ts      # Vitest setup (mocks SvelteKit $app, $env modules)
    ├── mocks/            # Mock implementations for $app, $env, superforms, logger
    ├── stubs/            # Stub implementations (formsnap)
    ├── server/           # Server-side tests (Node environment)
    ├── testUtils.ts      # Shared test helpers
    └── components/       # Component tests
```

## Setup Commands

```bash
# Install dependencies (pnpm required)
pnpm install

# Start local dependencies (PocketBase + Mailpit + Cap captcha)
pnpm deps:up

# Stop local dependencies
pnpm deps:down

# Start dev server (reads .env.dynamic)
pnpm dev

# Preview production build (reads .env.dynamic)
pnpm preview
```

### Environment Files

- **`.env.dynamic`** — development environment (loaded by `pnpm dev` and `pnpm preview`)
- **`.env.test`** — test environment (loaded by `pnpm test:unit`, `pnpm test:e2e`)
- **`.env.e2e`** — E2E overrides (loaded alongside `.env.test` for E2E)

Required variables in all env files:

```
ADMIN_EMAIL=""
CAP_API_KEY=""              # Cap captcha API key
CAPTCHA_SITE_SECRET=""      # Cap site secret
NODE_ENV="development"      # or "test"
PB_TEST_ADMIN="admin@test.com"
PB_TEST_PASSWORD="i3_NL-dfzzFt5TX"
PUBLIC_API_ENDPOINT="http://localhost:8090"
PUBLIC_CAPTCHA_ENDPOINT="http://localhost:3001"
PUBLIC_HOSTNAME="http://localhost:5173"  # 4173 for preview
PUBLIC_POSTHOG_HOST="http://localhost:3001"
PUBLIC_POSTHOG_KEY="phc_dummy"          # set real key for analytics
SMTP_HOST="localhost"
SMTP_PORT="1025"
```

### PocketBase Setup (E2E)

The bootstrap script handles all PB setup automatically:

```bash
pnpm deps:up           # Start Docker containers (PB + Mailpit + Cap)
pnpm deps:bootstrap    # Create superuser, import schema, seed data
pnpm deps:reset        # Full wipe: down -v → up → bootstrap
```

The bootstrap script (e2e/scripts/bootstrap.mjs):
- Extracts PB's installation token from startup logs
- Imports all collections from `pb_schema.json` via `PUT /api/collections/import`
- Seeds locations (countries/states/cities), test users, congregations (with child records), and static pages
- Creates the superuser via `docker exec` for admin panel access

For manual admin panel access: `http://localhost:8090/_/` with credentials from `.env.test` (`PB_TEST_ADMIN` / `PB_TEST_PASSWORD`).

### Cap Captcha Setup

1. Open `http://localhost:3001` and create an admin user
2. Generate an API key and a site key
3. Set `CAP_API_KEY` and `CAPTCHA_SITE_SECRET` in `.env.dynamic`

## Development Workflow

```bash
# Start everything for local development
pnpm deps:up
pnpm dev                    # http://localhost:5173

# After development
pnpm deps:down

# Type-check (generates paraglide messages first)
pnpm check

# Lint (Biome check)
pnpm lint

# Auto-format
pnpm format
```

**Important:** `pnpm check` requires the Vite dev server or a build to have run first, because paraglide messages are generated by the Vite plugin, not by `svelte-kit sync`. If `pnpm check` fails with paraglide import errors, run `pnpm build` first.

## Testing Instructions

### Unit Tests (Vitest)

```bash
# Run all unit tests with coverage
pnpm test:unit

# Run a specific test file
pnpm vitest run src/lib/api.test.ts

# Run tests matching a pattern
pnpm vitest run -t "captcha"

# Watch mode
pnpm vitest
```

**Test architecture:**

- Test files live alongside source: `src/**/*.test.ts`
- Server tests in `src/test/server/` use `node` environment
- Component tests use `happy-dom` + Vitest browser mode (Playwright chromium)
- SvelteKit `$app` and `$env` modules are mocked in `src/test/mocks/`
- `sveltekit-superforms` is mocked in `src/test/mocks/sveltekit-superforms.js`
- `formsnap` is stubbed in `src/test/stubs/formsnap.js`
- Server logger is mocked in `src/test/mocks/$lib_server_logger.js`
- Setup file: `src/test/setupTest.ts` (loads `vitest-browser-svelte` first, then project setup)
- Coverage provider: Istanbul, output to `test-results/coverage/`

**Vitest config:** `vitest.config.ts` (separate from `vite.config.ts`). The `vite.config.ts` also has test settings for CI (jsdom environment, no browser mode). The `vitest.config.ts` is the authoritative config for local development with browser mode.

### E2E Tests (Playwright)

```bash
# Start test dependencies
pnpm deps:up

# Build for E2E
pnpm build:test

# Start preview server
pnpm preview:test

# In another terminal, run E2E tests
pnpm test:e2e
```

E2E config: `e2e/playwright.config.mjs` — chromium only, headless, `http://localhost:4173`.

### CI Pipeline (GitHub Actions)

The CI runs in sequence: **Build** → **CI** (unit tests) → **E2E** → **Deploy**

1. **Build** — triggered on push to `main`. Builds Docker image via Nixpacks and pushes to GHCR.
2. **CI** — triggered on Build success. Runs `pnpm test:unit` with coverage. Uploads test results.
3. **E2E** — triggered on CI success. Pulls the Docker image, starts PocketBase + Mailpit + Cap, runs Playwright tests.
4. **Deploy** — triggered on Build success. Calls Coolify webhook.
5. **Test Report** — triggered on CI completion. Posts coverage and test results to PRs.

## Code Style

### TypeScript

- Strict mode enabled (`strict: true` in tsconfig.json)
- **`noImplicitAny: false`** — do NOT rely on this; always annotate function parameters explicitly
- Prefer `unknown` over `any`; avoid `as` type assertions (use Zod validation at trust boundaries)
- Use `const` over `let`; prefer `async`/`await` over raw promises
- Svelte 5 runes: `$state`, `$derived`, `$effect`, `$props`, `$bindable`

### Biome (Linting + Formatting)

Config: `biome.json` (Biome v2.5). Key rules:

- `recommended` preset base
- `correctness.noUnusedImports` (error)
- Imports sorted automatically via `assist.actions.source.organizeImports`
- Svelte files supported natively via `html.experimentalFullSupportEnabled`

Run: `pnpm lint` (Biome check) or `pnpm format` (Biome check --write).

### File Organization

- Components in `src/lib/components/{domain}/` (congregation, form, global, login, search, ui)
- shadcn components in `src/lib/components/ui/` (auto-generated, do not edit directly)
- Zod schemas in `src/lib/schemas/`
- Server-only code in `src/lib/server/` (never imported client-side)
- Tests co-located with source files (`*.test.ts`)
- E2E tests in `e2e/tests/`

### Naming Conventions

- Files: kebab-case (`+page.svelte`, `api.test.ts`, `hooks.server.ts`)
- Functions: camelCase (`validateCaptcha`, `cleanResponse`)
- Types/interfaces: PascalCase (`CongregationMetaRecord`, `LoginSchema`)
- Constants: UPPER_SNAKE_CASE for env vars, camelCase for module-level constants
- SvelteKit route files: `+page.svelte`, `+page.server.ts`, `+layout.svelte`, `+server.ts`

## Build and Deployment

```bash
# Production build
pnpm build

# Build with test env
pnpm build:test

# Regenerate PocketBase types from local DB
pnpm build:types
```

**Build output:** `build/` directory (adapter-node standalone mode).

**Docker:** Built via Nixpacks (see `nixpacks.toml`). After build, PostHog sourcemap injection runs:

```toml
[phases.build]
aptPkgs = ["wget"]
cmds = [
  'pnpm run build',
  'pnpx @posthog/cli sourcemap inject --directory ./build',
  'pnpx @posthog/cli sourcemap upload --directory ./build'
]
```

**Deployment:** Coolify webhook (triggered by GitHub Actions after Build succeeds).

**Node version:** `^22.0.0` (see `.nvmrc` and `package.json` engines). CI uses Node 20.x — this mismatch is known.

## i18n (Internationalization)

- Framework: Paraglide/Inlang
- Messages in `messages/` directory (JSON files per locale)
- Supported locales: EN, ES, FR, HE
- Auto-generated runtime in `src/lib/paraglide/` (do not edit)
- Machine translate: `pnpm machine-translate`
- Locale switching via cookie (`lang`), persisted to user profile
- RTL support for Hebrew (`dir="rtl"`)

## Security Considerations

- **CSP** configured via `sveltekit-helmet` in `src/lib/server/security.ts` — staged rollout (report-only in dev, enforced in production)
- **Auth cookies** are `httpOnly: true`, `sameSite: 'strict'`, `secure: !dev`
- **SMTP** uses `rejectUnauthorized: true` with proper Port 465/587 negotiation
- **Captcha validation** — `validateCaptcha()` returns a boolean; always check `if (!captchaValid) return fail(400, { form })`
- **IDOR** — always verify `client.congregation === data.id` for non-admin mutations
- **Auth cookies** are `httpOnly: false` and `secure` is commented out (known issue)
- **SMTP** has `rejectUnauthorized: false` (known issue — needed for local Mailpit)
- **PocketBase filter injection** — use `pb.filter(expr, params)` instead of string interpolation for all queries
- **Captcha validation** — `validateCaptcha()` returns a boolean; always check `if (!captchaValid) return fail(400, { form })`
- **IDOR** — always verify `client.congregation === data.id` for non-admin mutations
- **Secrets** — never hardcode in workflow files; use GitHub Actions secrets
- **`{@html}`** — sanitize with DOMPurify before rendering user-controlled content
- **Email headers** — sanitize `\r\n` from user-controlled `name`/`email` before building SMTP headers

## Pull Request Guidelines

- **Title format:** `[component] Brief description` (e.g., `[auth] Fix captcha validation bypass`)
- **Required before submission:**
  - `pnpm lint` — zero errors
  - `pnpm check` — zero type errors
  - `pnpm test:unit` — all tests passing
- **Commit messages:** Conventional Commits (`fix:`, `feat:`, `chore:`, `refactor:`, `security:`)
- **Review process:** PRs are reviewed against the exhaustive `CODE_REVIEW.md` checklist

## Debugging and Troubleshooting

### Common Issues

| Symptom                                   | Likely Cause                                         | Fix                                                                             |
| ----------------------------------------- | ---------------------------------------------------- | ------------------------------------------------------------------------------- |
| `paraglide` import errors in `pnpm check` | Messages not generated                               | Run `pnpm build` first                                                          |
| Tests fail with `The $ name is reserved`  | `@testing-library/svelte` / Svelte 5 incompatibility | Known issue; CI uses `continue-on-error`                                        |
| ESLint fails on CSS files                 | `@eslint/css` plugin incompatibility                 | Known issue; lint `src/` only with `pnpm exec eslint "src/**/*.{ts,js,svelte}"` |
| Prettier fails on `messages/en.json`      | Sorted JSON keys                                     | `pnpm format` fixes this                                                        |
| PocketBase connection refused             | Docker not running                                   | `pnpm deps:up`                                                                  |
| Auth refresh fails on every request       | Known performance issue                              | `authRefresh()` called on every authenticated request                           |

### Logging

- Server-side: `tslog` via `$lib/server/logger` — structured JSON logs
- Client-side: `$lib/utils` `log` export (wraps console)
- PostHog: events captured server-side via `event.locals.capture()` and client-side via `posthog.capture()`

### Key Dependencies

| Package                               | Version  | Purpose                        |
| ------------------------------------- | -------- | ------------------------------ |
| `svelte`                              | ^5.56.3  | UI framework                   |
| `@sveltejs/kit`                       | ^2.66.0  | SvelteKit                      |
| `@sveltejs/adapter-node`              | ^5.5.4   | Node deployment                |
| `pocketbase`                          | ^0.27.0  | PocketBase JS SDK              |
| `tailwindcss`                         | ^4.3.1   | CSS framework                  |
| `bits-ui`                             | ^2.18.1  | UI primitives                  |
| `sveltekit-superforms`                | ^2.30.1  | Form handling                  |
| `zod`                                 | ^4.4.3   | Schema validation              |
| `vitest`                              | ^4.1.9   | Test runner                    |
| `@playwright/test`                    | ^1.61.0  | E2E testing                    |
| `nanostores`                          | ^1.3.0   | State management               |
| `svelte-maplibre`                     | ^1.3.0   | MapLibre integration           |
| `tslog`                               | ^4.10.2  | Structured logging             |
| `radashi`                             | ^12.9.1  | Utility library                |
| `posthog-js` / `posthog-node`         | latest   | Analytics                      |
| `@inlang/paraglide-js`                | ^2.20.0  | i18n                           |
| `sveltekit-helmet`                    | ^2.1.0   | Security headers               |
| `cookie`                              | ^1.1.1   | Cookie parsing                 |
| `marked`                              | ^18.0.5  | Markdown rendering             |
| `nodemailer`                          | ^9.0.1   | Email transport                |
| `cmdk-sv`                             | ^0.0.19  | Command menu                   |
| `mode-watcher`                        | ^1.1.0   | Dark mode                      |
| `svelte-sonner`                       | ^1.1.1   | Toast notifications            |
| `svelte-copy`                         | ^2.0.0   | Clipboard                      |
| `@internationalized/date`             | ^3.12.2  | Date handling                  |
| `tailwind-variants`                   | ^3.2.2   | Component variants             |
| `tailwind-merge`                      | ^3.6.0   | Class merging                  |
| `clsx`                                | ^2.1.1   | Class utilities                |
| `@lucide/svelte`                      | ^1.0.1   | Icons                          |
| `public-ip`                           | ^8.0.0   | Public IP detection            |
| `fast-string-truncated-width`         | ^3.0.3   | String truncation              |
| `@leeoniya/ufuzzy`                    | ^1.0.19  | Fuzzy search                   |
| `formsnap`                            | ^2.0.1   | Form label/error binding       |
| `concurrently`                        | ^10.0.3  | Parallel command execution     |
| `sqlite3`                             | ^6.0.1   | SQLite (PocketBase dependency) |
| `form-data`                           | ^4.0.6   | Form data handling             |
| `wait-for-the-element`                | ^4.0.2   | DOM element waiting            |
| `@poppanator/sveltekit-svg`           | ^7.0.0   | SVG imports                    |
| `vite-plugin-mcp`                     | ^0.3.2   | MCP protocol for Vite          |
| `vite-plugin-devtools-json`           | ^1.0.0   | DevTools JSON plugin           |
| `vite-plugin-svelte-inline-component` | ^0.0.8   | Inline Svelte components       |
| `vite-tsconfig-paths`                 | ^6.1.1   | TS path resolution             |
| `tailwind-csstree`                    | ^0.3.3   | Tailwind CSS tree              |
| `tw-animate-css`                      | ^1.4.0   | Tailwind animations            |
| `tailwindcss-animate`                 | ^1.0.7   | Animation utilities            |
| `@tailwindcss/forms`                  | ^0.5.11  | Form reset                     |
| `@tailwindcss/typography`             | ^0.5.20  | Prose styling                  |
| `@tailwindcss/vite`                   | ^4.3.1   | Tailwind Vite plugin           |
| `@testing-library/svelte`             | ^5.3.1   | Component testing              |
| `@testing-library/jest-dom`           | ^6.9.1   | DOM matchers                   |
| `@testing-library/user-event`         | ^14.6.1  | User event simulation          |
| `happy-dom`                           | ^20.10.6 | DOM environment (tests)        |
| `jsdom`                               | ^29.1.1  | DOM environment (CI tests)     |
| `@vitest/browser`                     | ^4.1.9   | Browser mode                   |
| `@vitest/coverage-istanbul`           | ^4.1.9   | Coverage                       |
| `vitest-browser-svelte`               | ^2.1.1   | Svelte browser testing         |
| `typescript`                          | ^6.0.3   | TypeScript compiler            |
| `typescript-eslint`                   | ^8.61.1  | TS ESLint integration          |
| `eslint`                              | ^10.5.0  | Linter                         |
| `eslint-plugin-svelte`                | ^3.19.0  | Svelte lint rules              |
| `eslint-plugin-perfectionist`         | ^5.9.1   | Import sorting                 |
| `eslint-config-prettier`              | ^10.1.8  | Prettier compat                |
| `eslint-plugin-html`                  | ^8.1.4   | HTML linting                   |
| `@eslint/css`                         | ^1.3.0   | CSS linting                    |
| `@html-eslint/eslint-plugin`          | ^0.62.0  | HTML lint plugin               |
| `prettier`                            | ^3.8.4   | Formatter                      |
| `prettier-plugin-svelte`              | ^4.1.1   | Svelte formatting              |
| `prettier-plugin-tailwindcss`         | ^0.8.0   | Tailwind class sorting         |
| `svelte-check`                        | ^4.6.0   | Svelte type checking           |
| `@inlang/cli`                         | ^3.1.14  | i18n CLI                       |
| `@types/node`                         | ^26.0.0  | Node types                     |
| `@types/nodemailer`                   | ^8.0.1   | Nodemailer types               |
| `@types/web`                          | ^0.0.350 | Web API types                  |
| `@types/eslint`                       | ^9.6.1   | ESLint types                   |
| `@types/jest`                         | ^30.0.0  | Jest types (for compat)        |
| `globals`                             | ^17.6.0  | Global type definitions        |
| `tslib`                               | ^2.8.1   | TS runtime helpers             |
| `@eslint/compat`                      | ^2.1.0   | ESLint compat                  |
| `@eslint/eslintrc`                    | ^3.3.5   | ESLint config                  |
| `@eslint/js`                          | ^10.0.1  | ESLint JS rules                |
| `@sveltejs/vite-plugin-svelte`        | ^7.1.2   | Svelte Vite plugin             |

## Additional Notes

- **Package manager:** pnpm v10.18.3 (`engine-strict=true` in `.npmrc`)
- **Node version:** ^22.0.0 (`.nvmrc` = 22)
- **Editor:** `.editorconfig` enforces spaces, LF, UTF-8
- **SonarLint:** `.sonarlint/` config present for IDE integration
- **Known issues** (from `CODE_REVIEW.md`):
  - `@testing-library/svelte` / Svelte 5 incompatibility blocks some tests
  - CSP allows `'unsafe-inline'` on style-src (required for Tailwind v4 runtime style injection)
  - `noImplicitAny: false` in tsconfig has been removed — strict mode is now fully enabled
  - Playwright 1.61 has a `Fatal Error: exe.match is not a function` on Node.js 22/pnpm — E2E tests may need `npx playwright install chromium`

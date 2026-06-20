<!-- Context: project-intelligence/technical | Priority: critical | Version: 1.0 | Updated: 2026-06-19 -->

# Technical Domain

**Purpose**: Tech stack, architecture, development patterns for Open Communities.
**Audience**: Developers, AI agents.
**Last Updated**: 2026-06-19

## Primary Stack

| Layer | Technology | Version | Rationale |
|-------|-----------|---------|-----------|
| Framework | SvelteKit 5 (adapter-node) | ^2.66 | SSR, standalone mode |
| Language | TypeScript | ^6.0 | strict: true (note: noImplicitAny: false) |
| Database | PocketBase (self-hosted) | ^0.27 | typed via pocketbase-typegen |
| Styling | Tailwind CSS v4 + tailwind-variants | ^4.3 | CSS-first, @import "tailwindcss" |
| Validation | Zod 4 + sveltekit-superforms | ^4.4 / ^2.30 | sveltekit-superforms/adapters/zod4 |
| UI Library | shadcn-svelte + bits-ui | ^2.18 | Form, Button, Dialog, Card, etc. |
| i18n | Paraglide/Inlang | ^2.20 | messages/ dir, m.key() usage |
| Analytics | PostHog (client + server) | ^1.39 / ^5.38 | capture, captureException |
| Map | MapLibre GL JS via svelte-maplibre | ^1.3 | Interactive map |
| Client State | nanostores | ^1.3 | Persistent + derived stores |
| Testing | Vitest + browser mode | ^4.1 | happy-dom + Playwright browser |
| E2E | Playwright | ^1.61 | Chromium headless |
| Logging | tslog | ^4.10 | Structured JSON logger |
| Utilities | Radashi | ^12.9 | omit, isEmpty, isFunction, uid, etc. |

## Code Patterns

### API Endpoint (+page.server.ts)

```typescript
/* region imports */
import { fail, redirect } from '@sveltejs/kit';
import { isFunction } from 'radashi';
import { setError } from 'sveltekit-superforms';
import type { CollectionRecord } from '$lib/pocketbase.d';
import { m } from '$lib/paraglide/messages';
import { mySchema } from '$lib/schemas';
import { handleError } from '$lib/server/api';
import { validateCaptcha } from '$lib/server/utils';
/* endregion imports */

export const load = async (event) => {
  const { fetch, locals } = event;
  const { api, captureException, validate } = locals;
  try {
    const records = await api.collection('collectionName').getFullList({ fetch });
    return { records };
  } catch (err) {
    if (isFunction(captureException)) await captureException(err);
    return handleError(err);
  }
};

export const actions = {
  submit: async (event) => {
    const { locals } = event;
    const { api, capture, validate } = locals;
    const form = await validate(event, mySchema);
    if (!form.valid) return fail(400, { form });
    const captchaValid = await validateCaptcha(form);
    if (!captchaValid) { setError(form, 'captcha', m.invalidCaptcha()); return fail(400, { form }); }
    try {
      await api.collection('collectionName').create(form.data, { fetch });
      return { form };
    } catch (err) {
      return fail(500, { form: { ...form, error: err.message } });
    }
  }
};
```

### Component (+page.svelte)

```svelte
<script lang="ts">
  /* region imports */
  import type { RecordType } from '$lib/pocketbase.d';
  import { m } from '$lib/paraglide/messages';
  import { Button } from '$lib/components/ui/button';
  import { state } from '$lib/stores';
  import type { PageProps } from './$types';
  /* endregion imports */

  let { data }: PageProps = $props();
  let localState = $state(0);
</script>

<svelte:head><title>{m.pageTitle()} · {m.title()}</title></svelte:head>

{#if $state.loading}
  <Loading />
{:else}
  <Button onclick={() => doThing()}>{m.action()}</Button>
{/if}
```

### App Layout (+layout.svelte)

```svelte
<script lang="ts">
  import type { Snippet } from 'svelte';
  import { afterNavigate, beforeNavigate } from '$app/navigation';
  import { browser } from '$app/environment';
  import posthog from 'posthog-js';

  if (browser) { beforeNavigate(() => posthog.capture('$pageleave')); afterNavigate(() => posthog.capture('$pageview')); }
  let { children, data }: { children: Snippet; data: LayoutData } = $props();
</script>

<Header />
{@render children()}
<Footer />
<Toaster />
```

### Form Field Pattern

```svelte
<Form.Field {form} name="fieldName">
  <Form.Label>{m.labelKey()}</Form.Label>
  <Form.Input />
  <Form.Error />
</Form.Field>
```

## Naming Conventions

| Type | Convention | Example |
|------|-----------|---------|
| Files | kebab-case | `+page.server.ts`, `user-profile.ts` |
| SvelteKit routes | `+page.svelte`, `+page.server.ts`, `+layout.svelte`, `+server.ts` | `routes/add/` |
| Components | PascalCase | `UserCard`, `CongregationTile` |
| Functions | camelCase | `getUserProfile`, `validateCaptcha` |
| Variables | camelCase | `clientId`, `formData` |
| Types/Interfaces | PascalCase | `CongregationMetaRecord`, `LoginSchema` |
| Constants (env) | UPPER_SNAKE_CASE | `PUBLIC_API_ENDPOINT`, `ADMIN_EMAIL` |
| PocketBase collections | snake_case | `congregation_meta`, `users` |
| PocketBase fields | camelCase / snake_case | `contactEmail`, `ada_access` |
| Directories (domains) | kebab-case | `congregation/`, `form/`, `login/` |

## Code Standards

- **TypeScript strict** with explicit annotations (avoid relying on noImplicitAny: false)
- **Zod 4** validation at all trust boundaries (form input, API data)
- **Svelte 5 runes**: `$state`, `$derived`, `$effect`, `$props`, `$bindable`
- **Region comments**: `/* region name */` / `/* endregion name */` to organize imports/logic
- **Error handling**: `try/catch` → `captureException()` → `handleError()`
- **Async/await** over raw promises; `const` over `let`
- **Perfectionist** sorted imports (ESLint rule)
- **Prettier** formatting (single quotes, no trailing commas, 120 print width)
- **`$lib/`** path aliases for imports
- **nanostores** for global client state; runes for component-local state
- **tslog** for server-side structured logging
- **Co-located tests**: `*.test.ts` alongside source files
- **`pb.filter(expr, params)`** instead of string interpolation for PocketBase queries
- **pocketbase-typegen** to regenerate typed SDK from local DB schema
- **PNPM** as package manager (engine-strict=true)

## Security Requirements

- **Captcha validation**: Always check `validateCaptcha(form)` — returns bool; if false → `fail(400, { form })` with `setError(form, 'captcha', ...)`
- **CSP**: Configured via sveltekit-helmet in `src/lib/server/security.ts`
- **Auth**: PocketBase `authStore` — verify `client?.id` and `client?.admin` for authorization
- **IDOR prevention**: Always verify ownership before mutations (`client.congregation === data.id`)
- **Server-only code**: Place in `src/lib/server/` — never import on client
- **Filter injection prevention**: Use `pb.filter(expr, params)` not string interpolation
- **Email headers**: Sanitize `\r\n` from user-controlled name/email in SMTP
- **PostHog**: Capture events server-side via `event.locals.capture()` and client-side via `posthog.capture()`

## 📂 Codebase References

| File | Role |
|------|------|
| `src/routes/add/+page.server.ts` | API endpoint pattern (load + actions + validation) |
| `src/lib/components/form/form.svelte` | Component pattern (props + context + shadcn fields) |
| `src/routes/+layout.svelte` | App layout (runes + PostHog + i18n) |
| `src/hooks.server.ts` | Server hooks (PocketBase init, PostHog, i18n) |
| `src/lib/server/api.ts` | PocketBase singleton + error handler |
| `src/lib/schemas/record.ts` | Zod schema composition |
| `src/app.css` | Tailwind v4 entry + CSS custom properties |
| `src/lib/stores.ts` | nanostores pattern |
| `eslint.config.js` | Linting (perfectionist, TypeScript-ESLint) |
| `tsconfig.json` | TypeScript strict config |
| `vitest.config.ts` | Test configuration |

## Related Files

- `navigation.md` — Quick overview of all context files

## Update Triggers

- Tech stack/library version changes
- New API or component patterns
- Architecture decisions
- Security policy changes
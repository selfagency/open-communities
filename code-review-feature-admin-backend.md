# Exhaustive Code Review — `feature/admin-backend`

**Repository:** `selfagency/open-communities`
**Branch:** `feature/admin-backend`
**Base:** `origin/main` (merge base `d6f1634`)
**Scope:** 587 files changed, +72,562 / −30,405 lines; ~123 source files in `src/` (+7,680 / −3,230)
**Skill used:** `selfagency/skills/code-review/SKILL.md` (Exhaustive Code Review)
**Reviewer date:** 2026-06-26

> **Note on automated verification.** Per skill Phase 4, the reviewer attempted `pnpm run check` (Biome/Ultracite), `pnpm svelte-check` (tsgo), and the Vitest suite. `pnpm run check` completed and produced **6 errors** (details below). `pnpm svelte-check` could not complete within the environment: it requires a prior `pnpm build` to generate the Paraglide message runtime, and the build requires a reachable PocketBase + `.env.dynamic`/`.env.test`. The Vitest server project likewise depends on `.env.test` and Dockerised PocketBase/Mailpit/Cap. Manual review of every changed source file in `src/routes/**`, `src/lib/server/**`, `src/lib/components/admin/**`, `src/lib/components/users/**`, `src/lib/components/account/**`, `src/lib/schemas/**`, `src/hooks.server.ts`, and `src/routes/sitemap.xml/**` was performed instead; type issues were traced by reading the generated `src/lib/pocketbase.d.ts` and the PocketBase 0.27.0 SDK source. Items that could not be machine-verified are flagged `VERIFICATION: requires env`.

---

## Executive Summary

This branch introduces a substantial admin backend: a dashboard with PostHog analytics, congregations / users / pages / translations CRUD, a CSV user export, a Coolify redeploy hook, an XML sitemap, an account self-service page, a Pell-based page editor, and DB-backed translations with a build-time fetch. The feature surface is broad and the UX scaffolding is solid (DOMPurify on `{@html}` for page content, `pb.filter()` parameterised queries on the public `users` search, graceful degradation throughout).

However, the branch is **not safe to merge as-is**. It contains **five CRITICAL defects** that will cause data loss, security breach, or broken core functionality on first use:

1. **Unauthenticated Coolify redeploy/status actions** — anyone can POST to `/admin/translations?/redeploy` and trigger a production rebuild.
2. **Unauthenticated `/account` actions** — `?/unlink` and `?/deleteAccount` have no auth check; any request can delete any account whose id is in the auth cookie.
3. **Stored XSS in the admin user list** — `createRawSnippet` + template-literal HTML concatenation of user-controlled `name`/`email`. A non-admin can set their name to `<img src=x onerror=…>` and hijack an admin session when the admin opens `/admin/users`.
4. **Admin "edit user" form silently strips `admin` and `verified`** — the form only posts `name`/`email`, but the server action writes `verified: false, admin: false` on every save. Editing a user's name demotes them.
5. **Page image upload is silently broken** — `page-editor.svelte` sends the image as a base64 data URL in a hidden `<input name="image">`, but the server casts `form.get('image') as File | null` and checks `.size`, which is `undefined` for a string. Images are dropped on every save.

Beyond the blockers, the branch exhibits a systemic **type-safety regression**: the entire admin layer is built on `as unknown as Record<string, unknown>` casts that bypass the generated `pocketbase.d.ts` types. This violates the repo's own zero-`any` policy (AGENTS.md "Type Safety & Explicitness", `noImplicitAny` now enabled) and makes every admin handler fragile to PocketBase schema changes. There are also real security weaknesses (CSV injection, SQL-injection-shaped code in `posthog-api.ts`, silent email failures, missing rate limits, missing audit logs) and performance issues (`getFullList` of all congregations on every dashboard load).

**Final recommendation: BLOCK UNTIL FIXED.** The five CRITICAL issues must be remediated before merge; the HIGH issues should be addressed in this PR or a tightly-scoped follow-up. The remediation plan below is ordered by dependency and risk.

---

## Automated Check Results (Phase 4)

| Check | Command | Result | Notes |
|---|---|---|---|
| Lint (Biome via Ultracite) | `pnpm run check` | **FAIL — 6 errors** | All 6 are `lint/suspicious/noSkippedTests` in `combobox.test.ts`, `menu.loggedin.test.ts`, and `svg-diagnostics.test.ts`. Per AGENTS.md these are skipped due to a known `@testing-library/svelte` × Svelte 5 incompatibility; the suppression comments exist in some files but not all. |
| Type check (svelte-check / tsgo) | `pnpm svelte-check` | **COULD NOT RUN** | Requires `pnpm build` first to generate `src/lib/paraglide/messages`. Build requires `.env.dynamic` + reachable PocketBase. Manual type tracing performed instead. |
| Unit tests (Vitest) | `pnpm test:unit` | **COULD NOT RUN** | Requires `.env.test` + `docker-compose -f e2e/docker-compose.yml up -d` (PocketBase + Mailpit + Cap). |
| Format check | `pnpm fix --check` (Biome) | Not run separately; `pnpm run check` includes format. |

**Lint finding detail (6 errors, all `noSkippedTests`):**

- `src/lib/components/global/combobox.test.ts:7:10` — `describe.skip('Combobox', …)`
- `src/lib/components/global/menu.loggedin.test.ts:7:10` — `describe.skip('Menu component (logged in)', …)`
- `src/test/svg-diagnostics.test.ts` — 4 skipped SVG tests

Per the skill, **any failed automated check is a CRITICAL finding**. The lint failure is treated as CRITICAL-13 below (the underlying skips are documented in AGENTS.md, but the `biome-ignore` suppression comments are missing on these specific files — commit `dbaf2a1` claims they were added).

---

## Findings

### Security Vulnerabilities

#### S-1. Unauthenticated Coolify redeploy / status actions

- **Severity:** CRITICAL
- **File(s):** `src/routes/admin/translations/+page.server.ts:152-220` (`redeploy` and `status` actions)
- **Description:** The `redeploy` and `status` form actions have no `client?.authStore?.record?.admin` check. They read `process.env.COOLIFY_TOKEN` / `COOLIFY_URL` / `COOLIFY_APP_UUID` and call the Coolify deploy API directly. SvelteKit does **not** run parent `+layout.server.ts` `load` functions before a form action — the action handler runs first, then layout/page `load` runs to produce the response. The `/admin/+layout.server.ts` auth check at line 8 therefore only protects GET requests, not POSTs to `?/redeploy` / `?/status`.
- **Why it matters:** Any unauthenticated user can `curl -X POST https://opencommunities.info/admin/translations?/redeploy` with an empty form body and trigger a production rebuild. Repeated calls DoS the deploy pipeline. The `status` action additionally leaks deployment UUIDs.
- **Affected code path:** POST `/admin/translations` with `?/redeploy` → `redeploy` action → `fetch(${COOLIFY_URL}/api/v1/deploy?uuid=${COOLIFY_APP_UUID}&force=true)` with bearer token. No auth gate between request and the privileged fetch.
- **Root cause:** Author assumed SvelteKit layout `load` protects actions. It does not. The other admin actions (`/admin/users/[id]` `update`/`unlink`/`deleteAccount`/`assign`/`resetPassword`, `/admin/pages/[id]` `save`, `/admin/pages/new` `save`) **do** have explicit `if (!client?.authStore?.record?.admin) throw redirect(303, '/')` guards — `translations` is the outlier.
- **Recommended fix:** Add the same guard to every action in `translations/+page.server.ts`, including `save`, `delete`, `add`, `redeploy`, `status`:
  ```ts
  save: async ({ locals, request }) => {
    const client = locals.api;
    if (!client?.authStore?.record?.admin) throw error(401, 'Unauthorized');
    // …
  }
  ```
  Prefer `error(401, …)` over `redirect(303, '/')` for actions called via `fetch` (the client cannot follow a 303 on a `fetch` POST).
- **Verification:** `VERIFICATION: requires env` — write a Vitest server test that POSTs to `/admin/translations?/redeploy` with no auth cookie and asserts 401. Also add a Playwright spec in `e2e/tests/admin.spec.js` that confirms a logged-in non-admin cannot trigger redeploy.

#### S-2. Unauthenticated `/account` actions (`unlink`, `deleteAccount`)

- **Severity:** CRITICAL
- **File(s):** `src/routes/account/+page.server.ts:64-79`
- **Description:** The `update` action (line 32) implicitly validates via `superValidate`/`userSchema`, but `unlink` (line 64) and `deleteAccount` (line 72) have no auth check. They call `client.authStore.record?.id as string` and then `client.collection('users').update/delete(id, …)`. If the auth store is empty (no cookie, or cookie cleared), `record?.id` is `undefined`, cast to `string` — `update(undefined as string, …)` throws, but `deleteAccount` could be made to fire against any id an attacker can place in the auth store via a crafted cookie.
- **Why it matters:** Combined with the weak `loadUser` validation in `src/lib/server/api.ts:152-175` (which only checks `typeof model.id === 'string'`), a crafted `pb_auth` cookie could let an attacker delete arbitrary user accounts by POSTing to `/account?/deleteAccount`. The `load` function checks `user?.email` and throws 401, but again, `load` does not gate actions.
- **Affected code path:** POST `/account?/deleteAccount` → `deleteAccount` action → `client.collection('users').delete(id)` with `id` derived from the (attacker-controllable) auth cookie.
- **Root cause:** Same SvelteKit misconception as S-1. The `update` action is accidentally protected by `superValidate` failing on an empty form, but the other two actions are not.
- **Recommended fix:** Add `if (!client.authStore?.record?.id) throw error(401, 'Not authenticated');` at the top of `unlink` and `deleteAccount`. Use the validated `id` directly without the `as string` cast.
- **Verification:** Add a server test that POSTs `/account?/deleteAccount` with no cookie and asserts 401; another with a non-owner cookie and asserts the target account is not deleted.

#### S-3. Stored XSS in admin user list via `createRawSnippet` + unescaped interpolation

- **Severity:** CRITICAL
- **File(s):** `src/lib/components/users/user-list.svelte:55-122`
- **Description:** The TanStack table column `cell` renderers use `createRawSnippet` whose `render` returns an HTML string built by template-literal interpolation of user-controlled fields:
  ```ts
  createRawSnippet<[{ v: string }]>((get) => ({
    render: () => `<span class="font-medium">${get().v || '—'}</span>`
  }))
  ```
  `get().v` is `row.original.name` (line 60) and `row.original.email` (line 69). `createRawSnippet` is documented as "raw" — it does **not** HTML-escape. A user who sets their name to `<img src=x onerror=fetch('/api/admin/...')>` triggers script execution in the admin's session when the admin opens `/admin/users`.
- **Why it matters:** This is a privilege-escalation primitive. A non-admin registers with a malicious `name`, waits for an admin to open the user list, and the admin's session is hijacked. Because the admin layout does not require a fresh auth check per request (auth refresh is on a 5-minute cooldown — `hooks.server.ts:34`), the hijack window is large. The same pattern is used for `email` (line 68), `congregationName` (line 116), and the `verified`/`admin` badges (lines 80, 86, 98, 104 — these interpolate `m.verified()` etc., lower risk since translations are admin-controlled, but still unsafe if a translation key is ever user-influenced).
- **Affected code path:** User registers → `name` stored in PocketBase `users` table → admin opens `/admin/users` → `user-list.svelte` renders table → `createRawSnippet` interpolates `name` into HTML string → browser parses → `onerror` fires.
- **Root cause:** `createRawSnippet` was used for performance (snippets are cheaper than component instantiation per cell) but the author treated it like a normal Svelte template, where `{value}` auto-escapes. Raw snippets do not.
- **Recommended fix:** Either (a) replace `createRawSnippet` with normal Svelte markup via `renderSnippet` from `$lib/components/ui/data-table/render-helpers.ts` using a `.svelte` snippet that lets Svelte auto-escape, or (b) HTML-escape the interpolated value before concatenation:
  ```ts
  const escapeHtml = (s: string) => s
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
  render: () => `<span class="font-medium">${escapeHtml(get().v || '—')}</span>`
  ```
  Option (a) is strongly preferred — it restores Svelte's automatic escaping and is more maintainable.
- **Verification:** Add a Vitest browser test that mounts `user-list.svelte` with a user whose `name` is `<img src=x onerror="window.__xss=true">` and asserts `window.__xss` is undefined after render. Also add a Playwright test that confirms no `img` element appears in the table.

#### S-4. CSV formula injection in user export

- **Severity:** HIGH
- **File(s):** `src/routes/admin/users/export/+server.ts:5-16`
- **Description:** `csvEscape` wraps values in double quotes and escapes embedded quotes by doubling, but does not neutralise formula prefixes. A user whose `email` or `name` begins with `=`, `+`, `-`, `@`, a tab, or a carriage return will produce a cell that Excel/Google Sheets/Numbers interprets as a formula. Example: a user registers with email `=HYPERLINK("https://evil/","click")` and the exported CSV opens a malicious link when an admin double-clicks the cell.
- **Why it matters:** Spreadsheet clients (Excel, Sheets, LibreOffice) execute formulas on open. A targeted user can exfiltrate other cells, call webhook URLs, or in older Excel versions execute `cmd`. The exported CSV contains all users' emails — a single malicious row can pivot to leaking the whole list.
- **Affected code path:** User sets `email` to `=cmd|'/c calc'!A1` → admin clicks "Export CSV" → `csvEscape` produces `"=cmd|'/c calc'!A1"` → admin opens in Excel → formula executes.
- **Root cause:** The escape function handles RFC 4180 quoting but not the OWASP CSV-injection mitigation, which requires prefixing a leading `=`, `+`, `-`, or `@` with a single quote (`'`) or a space.
- **Recommended fix:**
  ```ts
  function csvEscape(val: unknown): string {
    if (val === null || val === undefined) return '""';
    let s: string;
    if (typeof val === 'string') s = val;
    else if (typeof val === 'number' || typeof val === 'boolean') s = String(val);
    else return '""';
    // OWASP CSV injection mitigation
    if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`;
    return `"${s.replaceAll('"', '""')}"`;
  }
  ```
- **Verification:** Add a server test asserting `csvEscape('=cmd|...')` starts with `"'=cmd"` and that `csvEscape('normal')` does not.

#### S-5. SQL-injection-shaped code in `_queryTrends` (PostHog HogQL)

- **Severity:** HIGH
- **File(s):** `src/lib/server/posthog-api.ts:119-144`
- **Description:** `_queryTrends` interpolates `event` and `days` directly into a HogQL string:
  ```ts
  const q = "\\'";
  const escapedEvent = event.replaceAll(/'/g, q);
  const sql = [
    `SELECT toStartOf${interval === 'week' ? 'Week' : 'Day'}(timestamp) AS date,`,
    '       count(DISTINCT person_id) AS count',
    '    FROM events',
    `    WHERE event = '${escapedEvent}'`,
    `      AND timestamp >= now() - INTERVAL ${days} DAY`,
    // …
  ].join('\n');
  ```
  The escape is wrong for HogQL/ClickHouse: ClickHouse string literals use doubled single quotes (`''`) for an embedded quote, not backslash-escaped (`\'`). The backslash form only works when `allow_settings_after_format_in_insert` / `input_format_with_names_use_header` etc. are set, which is not guaranteed. `days` is typed `number` but TypeScript types are erased at runtime; if a caller ever passes a string (e.g. via a future form action), it injects directly.
- **Why it matters:** The function is currently only called internally with hardcoded event names (and is in fact unused — see L-2), so this is a latent risk rather than an active exploit. But the file is `export`ed from `$lib/server`, the leading underscore is a convention not a barrier, and any future caller that passes user-influenced input will create a real HogQL injection. PostHog HogQL can read any event/person data in the project, so an injection is a data-leak primitive.
- **Affected code path:** Future caller passes user input → `_queryTrends(userInput, …)` → HogQL string → PostHog `/api/projects/{id}/query/` → arbitrary HogQL.
- **Root cause:** The author reached for string concatenation instead of PostHog's parameterised query API. PostHog's HogQL query endpoint does not support bind parameters, but it does support `${'…'}` style substitutions in some contexts; the safe pattern is to validate `event` against an allowlist of known event names and `days` with `Number.isInteger(days) && days > 0 && days <= 365`.
- **Recommended fix:**
  ```ts
  const ALLOWED_EVENTS = new Set(['$pageview', '$pageleave', '$session_start', /* … */]);
  export async function queryTrends(event: string, days = 30, interval: 'day' | 'week' = 'day') {
    if (!ALLOWED_EVENTS.has(event)) throw new Error(`Disallowed event: ${event}`);
    if (!Number.isInteger(days) || days < 1 || days > 365) throw new Error('Invalid days');
    // Then the existing interpolation is safe because both values are allowlisted/validated.
  }
  ```
  Better: remove the function entirely (it is unused — see L-2).
- **Verification:** Unit-test that passing a non-allowlisted event throws; passing a non-integer days throws.

#### S-6. Silent email failures in `transactionalMail` / `adminMail`

- **Severity:** HIGH
- **File(s):** `src/lib/server/mail.ts:43-74` (`adminMail`), `130-141` (`transactionalMail`)
- **Description:** Both public functions wrap `mailTransport` in `try { … } catch (e) { log.error(…); }` and return `void`. Callers cannot tell whether the email was sent. The congregation approval/rejection endpoints (`/api/admin/congregations/[id]/toggle/+server.ts:19-28` and `/delete/+server.ts:19-26`) call `transactionalMail` and then return `json({ success: true })` unconditionally — if the email fails, the admin sees "success" but the user never receives their approval/rejection notice.
- **Why it matters:** For the delete endpoint, the email is sent **before** the PocketBase delete. If the email succeeds but the delete fails, the user is told their congregation was rejected but the record still exists. For the toggle endpoint, the email is sent after the `update` — if the email fails, the user does not know they were approved. Either way, the admin UI lies about success.
- **Affected code path:** Admin clicks "Approve" → `toggle/+server.ts` → `client.collection('congregations').update(...)` succeeds → `transactionalMail` throws internally → caught and logged → endpoint returns `{ success: true }` → admin sees success toast → user never gets email.
- **Root cause:** The mail functions were designed for fire-and-forget contact-form emails, then reused for transactional notices where delivery matters.
- **Recommended fix:** Change `transactionalMail` to return `{ ok: true } | { ok: false; error: string }` and re-throw or surface the error. In the toggle/delete endpoints, either (a) return `json({ success: true, emailSent: false })` and let the client warn, or (b) queue the email for retry and return `success: true` only if both the DB write and the queue push succeed. At minimum, log the failure prominently and surface it in the response.
- **Verification:** Add a Vitest test mocking `nodemailer.createTransport` to throw; assert `transactionalMail` returns/throws appropriately and that `toggle/+server.ts` returns a non-success indicator.

#### S-7. Missing rate limiting on admin export / redeploy / API endpoints

- **Severity:** MEDIUM
- **File(s):** `src/routes/admin/users/export/+server.ts`, `src/routes/admin/translations/+page.server.ts` (`redeploy`, `status`), `src/routes/api/admin/**`
- **Description:** None of the admin endpoints apply rate limits. The CSV export calls `getFullList` over `users` with `expand: 'congregations,congregation.city,congregation.state,congregation.country'` — a single request loads every user and their full geographic expansion into memory and serialises to CSV. An admin (or anyone who obtains an admin session, see S-1) can call it repeatedly to DoS PocketBase and the Node process. The Coolify redeploy action has no throttle — even after S-1 is fixed, an admin could spam it.
- **Why it matters:** DoS surface, plus the export is a PII firehose (every user email + congregation + location) with no audit log.
- **Recommended fix:** Add a simple in-memory rate limiter (e.g. 1 export per minute per admin, 1 redeploy per 5 minutes) using the same `Map<sessionKey, timestamp>` pattern already in `hooks.server.ts:33-43`. Log every export/redeploy to PostHog with the admin's user id.
- **Verification:** Test that two rapid calls to `/admin/users/export` return 429 on the second.

#### S-8. No audit log for destructive admin actions

- **Severity:** MEDIUM
- **File(s):** All of `src/routes/admin/**` and `src/routes/api/admin/**`
- **Description:** No admin action writes an audit record. There is no `audit_log` collection, no PostHog `capture` call, no `log.info` with the acting admin's id. The congregation delete, congregation toggle (approve/reject), user delete, user admin-grant/revoke, page create/update/delete, translation key create/delete, and Coolify redeploy are all silent.
- **Why it matters:** For a directory of a politically sensitive community (Jews opposing the war in Gaza), admin actions against user accounts and congregations need an audit trail. If an admin account is compromised (see S-3), there is no way to reconstruct what was done.
- **Recommended fix:** Add a `capture('admin_action', { action, target, adminId })` call to every admin action (the `event.locals.capture` helper already exists in `hooks.server.ts:88`). For destructive actions, also write to a PocketBase `audit_log` collection with `admin`, `action`, `target_type`, `target_id`, `timestamp`, `metadata`.
- **Verification:** Inspect PostHog for the `admin_action` event after running through the admin flows in an E2E test.

#### S-9. Admin can demote themselves or the last admin

- **Severity:** MEDIUM
- **File(s):** `src/routes/admin/users/[id]/+page.server.ts:48-71` (`update` action)
- **Description:** The `update` action accepts `admin: formData.get('admin') === 'true'` and writes it directly. There is no check that (a) the target is not the acting admin themselves (self-demotion locks out), or (b) the target is not the last remaining admin (system lockout). Combined with the S-3 XSS, an attacker could set their own account to `admin: true` via the hijacked admin session, or demote all real admins.
- **Why it matters:** Availability risk — a compromised or malicious admin can brick the admin layer.
- **Recommended fix:** Before writing `admin: false`, count active admins (`client.collection('users').getList(1, 1, { filter: 'admin=true' })`); if the count is 1 and the target is that admin, return `fail(400, { error: 'Cannot demote the last admin' })`. Also refuse self-demotion: `if (params.id === client.authStore.record?.id && admin === false) return fail(400, …)`.
- **Verification:** Unit-test both refusal paths.

#### S-10. `loadUser` accepts minimally-validated cookie models

- **Severity:** MEDIUM
- **File(s):** `src/lib/server/api.ts:152-175`
- **Description:** `loadUser` parses the `pb_auth` cookie, calls `JSON.parse`, checks `typeof model.id === 'string' && typeof model.email === 'string'`, and returns `model as UsersRecord & { email: string; id: string }`. The cast claims the entire object conforms to `UsersRecord`, but only `id` and `email` were validated. Other fields (`admin`, `congregation`, `notifications`, `lang`, `verified`) could be any type or missing. SvelteKit code that reads `model.admin` (e.g. `/admin/+layout.server.ts:8`) trusts the cast.
- **Why it matters:** A crafted cookie could set `model.admin = true` without PocketBase ever issuing that claim. Whether this is exploitable depends on whether `loadUser`'s output is used for authz — inspecting the code, `loadUser` is only called in a few places and `locals.api.authStore.record` (which is set from a real PocketBase `authRefresh`) is the actual auth source. But the function is exported and the cast is a lie; any future caller inherits the risk.
- **Recommended fix:** Replace the cast with a Zod schema (`userCookieSchema.parse(decoded.model)`) that validates every field used downstream, or remove `loadUser` if it is unused (the hooks use `requestApi.authStore.record` directly).
- **Verification:** `VERIFICATION: requires env` — search for callers; if only tests use it, delete it.

---

### Programmatic / Data-Flow Correctness

#### P-1. Admin "edit user" form silently strips `admin` and `verified` status

- **Severity:** CRITICAL
- **File(s):** `src/routes/admin/users/[id]/+page.server.ts:48-71` (`update` action) + `src/routes/admin/users/[id]/+page.svelte:66-83` (the form)
- **Description:** The form at `+page.svelte:66-83` posts only `name` and `email`. The server action at `+page.server.ts:56-59` reads:
  ```ts
  const verified = formData.get('verified') === 'true';
  const admin = formData.get('admin') === 'true';
  ```
  Since the form has no `verified` or `admin` fields, `formData.get()` returns `null`, `null === 'true'` is `false`, and line 66 writes `verified: false, admin: false` to PocketBase. **Every time an admin edits a user's name or email, the user is demoted from admin and un-verified.**
- **Why it matters:** This is silent data corruption of the most sensitive fields in the system. An admin editing a typo in another admin's name will revoke their admin access and force re-verification. The form also does not let the admin set `verified` or `admin` at all — there is no UI for it.
- **Affected code path:** Admin opens `/admin/users/<id>` → edits name → submits → server writes `{ name, email, verified: false, admin: false }` → target user loses admin and verification.
- **Root cause:** The form was built before the server action grew the `verified`/`admin` fields (or vice versa). The two halves were never reconciled.
- **Recommended fix:** Two changes, both required:
  1. Add `verified` and `admin` toggles to the form (`<Switch name="verified" checked={user.verified} />` and similar for `admin`), with hidden inputs that post `'true'`/`'false'` strings (Switch does not submit a value when off by default).
  2. Change the server to only update fields that are actually present, or use `superValidate` with a Zod schema (`adminUpdateSchema`) that makes `verified`/`admin` optional and only writes them when provided. Safer pattern:
     ```ts
     const body: Record<string, unknown> = { name, email };
     if (formData.has('verified')) body.verified = formData.get('verified') === 'true';
     if (formData.has('admin')) body.admin = formData.get('admin') === 'true';
     ```
- **Verification:** Add a Vitest server test: create a user with `admin: true, verified: true`, POST the update action with only `name` and `email`, assert the user's `admin` and `verified` are still `true`.

#### P-2. Page image upload is silently broken (base64 string treated as `File`)

- **Severity:** CRITICAL
- **File(s):** `src/lib/components/admin/page-editor.svelte:249-254` (form) + `src/routes/admin/pages/[id]/+page.server.ts:41-63` and `src/routes/admin/pages/new/+page.server.ts:30-52` (server)
- **Description:** `page-editor.svelte` uses `FileDropZone.Root` with `onUpload={handleImageSelect}`. `handleImageSelect` (lines 118-129) sets `imageFile` (a local state variable that is **never bound to a form field**) and sets `imagePreview` to a base64 data URL. The form contains only:
  ```svelte
  <input name="image" type="hidden" value={imagePreview} />
  ```
  So the server receives `image` as a **string** (the base64 data URL, or the existing image URL on edit). But the server casts:
  ```ts
  const imageFile = form.get('image') as File | null;
  if (imageFile?.size && imageFile.size > 0) { body.image = imageFile; }
  ```
  Strings do not have `.size` (they have `.length`), so `imageFile?.size` is `undefined`, the `if` is falsy, and `body.image` is never set. **The image is silently dropped on every page save.**
- **Why it matters:** The image upload feature is completely non-functional. Admins will save pages with images, see no error, and the images will not be persisted. This was presumably never tested end-to-end.
- **Affected code path:** Admin selects image → `handleImageSelect` → `imagePreview` = base64 → hidden input value = base64 → form POST → server `form.get('image')` returns base64 string → cast to `File` → `.size` is `undefined` → image not written to PocketBase.
- **Root cause:** The form was designed for a real `<input type="file" name="image">` flow but the FileDropZone component does not render one — it uses a callback. The `imageFile` state was intended to be appended to `FormData` manually but never is.
- **Recommended fix:** Two options:
  1. **Use a real file input.** Add `<input type="file" name="image" accept="image/*" bind:files={imageFiles} />` (hidden, triggered by the FileDropZone button). Then `form.get('image')` returns a `File` and the server cast is correct.
  2. **Send the base64 string and handle it server-side.** Change the server to detect strings and decode:
     ```ts
     const imageRaw = form.get('image');
     if (typeof imageRaw === 'string' && imageRaw.startsWith('data:image/')) {
       const base64 = imageRaw.split(',')[1];
       const buffer = Buffer.from(base64, 'base64');
       body.image = new File([buffer], 'upload.png', { type: 'image/png' });
     }
     ```
  Option 1 is strongly preferred — base64 in form data inflates request size by ~33% and the FileDropZone already has the File object.
- **Verification:** `VERIFICATION: requires env` — Playwright spec: log in as admin, create a page, upload an image, save, navigate to `/[slug]`, assert the `<img>` `src` is a real PocketBase file URL (not a data: URL).

#### P-3. `convertBooleans` corrupts legitimate numeric `0`/`1` fields

- **Severity:** HIGH
- **File(s):** `src/lib/server/api.ts:55-77`
- **Description:** `convertBooleans` recursively walks a response and rewrites every `1` to `true` and every `0` to `false`. This was presumably added because PocketBase serialises boolean fields as `0`/`1` in some contexts. But the function is not field-aware — it rewrites **any** `1` or `0` value, including count fields, `sort` indices, `level` fields, etc. Any PocketBase collection with a numeric field whose value happens to be `0` or `1` will have that field corrupted to `false`/`true` in the SSR data.
- **Why it matters:** Silent data corruption. If a `congregations` record has a `denominationId` of `1`, the client receives `denominationId: true`. The PocketBase typegen types say the field is `number`, the runtime value is `boolean`, and TypeScript cannot catch it because the cast happens inside `cleanResponse`. Downstream code that does `record.denominationId + 1` produces `"true1"`.
- **Affected code path:** Any `getList`/`getOne`/`getFullList` response that goes through `cleanResponse` → `convertBooleans` → numeric 0/1 fields become booleans.
- **Root cause:** PocketBase 0.27.x returns booleans as `true`/`false` in JSON responses by default (the `0`/`1` serialisation is a SQLite-storage detail that does not leak into the REST API). The function is solving a problem that does not exist and creating a new one. The AGENTS.md does not mention a need for it.
- **Recommended fix:** Delete `convertBooleans` and remove the call in `cleanResponse` (line 52). If a specific PocketBase view or edge case does return `0`/`1` for booleans, fix that specific field with a typed transformer. Run the test suite after deletion — if anything breaks, it was relying on the corruption.
- **Verification:** `VERIFICATION: requires env` — Vitest: assert `cleanResponse({ count: 0, active: true, id: 'x' })` returns `count: 0` (not `false`).

#### P-4. Translation save/delete uses sequential N+1 PocketBase calls with no transaction

- **Severity:** HIGH
- **File(s):** `src/routes/admin/translations/+page.server.ts:86-101` (`save`), `115-128` (`delete`)
- **Description:** The `save` action loops over `entries` and `await`s `client.collection('translations').update` or `.create` for each one, sequentially. The `delete` action does the same. There is no batching, no `Promise.all`, and no PocketBase transaction. The action returns `{ created, updated, errors }` but partial failure leaves the database in an inconsistent state (some entries updated, some not).
- **Why it matters:** For a key with 11 locales, that is 11 sequential PocketBase round-trips (plus retries via `withRetry`, which can multiply). If the network hiccups on entry 6, entries 1-5 are saved and 6-11 are not, and the admin sees "5 updated, 6 errors" with no way to know which is which without re-opening the key. The admin then re-saves, and entries 1-5 are saved again (idempotent for `update`, but wasteful).
- **Affected code path:** Admin edits a translation key with 11 locales → submits → 11 sequential PB writes → if any fails, partial state.
- **Root cause:** Sequential `for…of` with `await` is the obvious pattern but wrong for independent operations. PocketBase does not expose multi-statement transactions over the REST API, but `Promise.all` would at least parallelise and the action could roll back created records on failure.
- **Recommended fix:** Use `Promise.allSettled` to parallelise, then report per-entry results. If any `create` fails, delete the newly-created records to roll back. Better: add a `batch` helper that calls PocketBase's `/api/batch` endpoint (PocketBase 0.20+ supports batch create/update/delete up to 500 operations).
  ```ts
  const results = await Promise.allSettled(entries.map((e) =>
    e.id ? client.collection('translations').update(e.id, { value: e.value })
         : client.collection('translations').create({ key, locale: e.locale, value: e.value })
  ));
  const created: string[] = [];
  const errors: number[] = [];
  results.forEach((r, i) => {
    if (r.status === 'fulfilled' && !entries[i].id) created.push(r.value.id);
    if (r.status === 'rejected') errors.push(i);
  });
  // Roll back creates if any failed
  if (errors.length > 0 && created.length > 0) {
    await Promise.allSettled(created.map((id) => client.collection('translations').delete(id)));
    return fail(500, { error: 'Save failed, rolled back', errors });
  }
  ```
- **Verification:** Vitest with mocked PB: assert parallel calls, assert rollback on partial failure.

#### P-5. Auth refresh cookie pattern stores a full cookie string as the cookie value

- **Severity:** MEDIUM
- **File(s):** `src/hooks.server.ts:148`
- **Description:** `event.cookies.set('auth', requestApi.authStore.exportToCookie(), event.locals.cookieOpts)` passes the return value of `exportToCookie()` as the cookie **value**. In PocketBase 0.27.x, `exportToCookie()` returns a string of the form `pb_auth=eyJ…; Path=/; Expires=…; HttpOnly; SameSite=Strict` — a full Set-Cookie value. SvelteKit's `cookies.set(name, value, opts)` expects `value` to be the raw cookie value (just the JWT), not a full cookie string. The resulting `Set-Cookie: auth=pb_auth%3DeyJ…%3B%20Path%3D…` works because both `loadFromCookie` (line 113) and `loadUser` (api.ts:158 `cookie.parse(auth)`) parse the value as a cookie header string, but it doubles the cookie size (the `pb_auth=` prefix, the `Path`/`Expires`/`HttpOnly`/`SameSite` attributes are all stored as value) and risks exceeding the 4 KB cookie limit for large JWTs.
- **Why it matters:** Latent cookie-overflow failure. If the auth token grows (e.g. PocketBase adds more claims, or the record has more fields), the cookie silently truncates and the user is logged out on every request. The pattern is also confusing to maintain — a future contributor reading `cookies.set('auth', exportToCookie(), …)` will reasonably assume `exportToCookie` returns a value, not a header.
- **Recommended fix:** Use `exportToCookie({ httpOnly: true, sameSite: 'strict', secure: !dev })` to get a `Cookie` object (PocketBase 0.27 supports this), then set the cookie from its `.value` field. Or parse the exported string with `cookie.parse()` and set only the value:
  ```ts
  const exported = requestApi.authStore.exportToCookie();
  const parsed = cookie.parse(exported);
  event.cookies.set('auth', parsed.pb_auth ?? '', event.locals.cookieOpts);
  ```
- **Verification:** `VERIFICATION: requires env` — E2E: log in, inspect the `Set-Cookie: auth=…` header, assert the value is just the JWT (starts with `eyJ`), not `pb_auth%3DeyJ`.

#### P-6. `/logout` cookie clearing uses `maxAge: 1 day` instead of `maxAge: 0`

- **Severity:** LOW
- **File(s):** `src/hooks.server.ts:125-128`
- **Description:** On every `/logout` request, the hook sets `auth` and `session` cookies to empty string with `event.locals.cookieOpts` which has `maxAge: 60 * 60 * 24` (1 day). An empty cookie with a 1-day max-age is not deleted — it persists as an empty string. Browsers will send `auth=` on subsequent requests. `loadFromCookie('')` is a no-op (line 113 `?? ''` handles it), so functionally the user is logged out, but the empty cookie lingers.
- **Recommended fix:** Spread `cookieOpts` and override `maxAge: 0`:
  ```ts
  event.cookies.set('auth', '', { ...event.locals.cookieOpts, maxAge: 0 });
  ```
- **Verification:** Inspect `Set-Cookie` headers on `/logout` response; assert `Max-Age=0` or `Expires=Thu, 01 Jan 1970`.

---

### Type Correctness and Flow

#### T-1. Systemic `as unknown as Record<string, unknown>` casts bypass PocketBase typegen

- **Severity:** HIGH
- **File(s):** Throughout the admin layer:
  - `src/routes/admin/+page.server.ts:51, 70, 76` (congregation records)
  - `src/routes/admin/congregations/+page.server.ts:5-8, 17-18, 50-53` (`mapCong` and call sites)
  - `src/routes/admin/users/+page.server.ts:28-29` (user expansion)
  - `src/routes/admin/users/[id]/+page.server.ts:12, 19-20, 41` (user record and available congregations)
  - `src/routes/admin/users/export/+server.ts:34-39` (CSV row extraction)
  - `src/routes/admin/pages/+page.server.ts:10-18` (page list mapping, 9 casts in 8 lines)
  - `src/routes/admin/pages/[id]/+page.server.ts:13, 21` (page record)
  - `src/routes/admin/translations/+page.server.ts:31, 38, 121` (translation records)
  - `src/routes/api/admin/congregations/[id]/delete/+server.ts:16-18` (owner expansion)
  - `src/routes/api/admin/congregations/[id]/toggle/+server.ts:18-20` (owner expansion)
  - `src/routes/[slug]/+page.server.ts:18, 39-40` (page and variant records)
  - `src/lib/components/admin/page-editor.svelte:56-61, 79` (page prop access)
  - `src/lib/components/users/user-list.svelte` (implicit via `User` interface)
- **Description:** The repo ships a generated `src/lib/pocketbase.d.ts` with `TypedPocketBase`, `CongregationsRecord`, `UsersRecord`, `PagesRecord`, `TranslationsRecord`, etc. The admin code ignores these types entirely. Every PocketBase response is cast through `as unknown as Record<string, unknown>` and then individual fields are cast back with `as string`, `as boolean`, etc. This is the moral equivalent of `any` — it disables type checking for the entire admin layer. AGENTS.md is explicit: "Prefer `unknown` over `any`", "Use meaningful variable names", "noImplicitAny is now enabled". The `TypedPocketBase` instance is created in `src/lib/server/api.ts:20-24` and exported, so the typed SDK is available — it is just not used.
- **Why it matters:** Three concrete consequences:
  1. **Schema drift is invisible.** If a PocketBase field is renamed (e.g. `visible` → `published`), TypeScript will not flag any of these casts. The code will silently read `undefined` and produce `visible: undefined as boolean`.
  2. **Null/undefined is erased.** `c.name as string` returns type `string` even when `c.name` is `undefined`. The `?? ''` fallbacks elsewhere suggest the author knows the fields can be missing, but the cast hides that from the compiler.
  3. **The repo's own zero-`any` policy is violated in spirit.** `as unknown as Record<string, unknown>` is `any` with extra steps; it just takes two casts instead of one.
- **Affected code path:** Every admin page load and action.
- **Root cause:** The PocketBase typegen output (`pocketbase.d.ts`) was regenerated to include the new `pages`, `pageVariants`, `translations` collections (commit `6256843`), but the admin code was written against the untyped `Record<string, unknown>` pattern and never migrated.
- **Recommended fix:** This is a large refactor but it is the single highest-leverage change for long-term maintainability. For each admin handler:
  1. Use the typed collections: `client.collection('congregations').getOne(id)` returns `CongregationsRecord`, not `Record<string, unknown>`.
  2. For expansions, extend the type: `client.collection('congregations').getOne<CongregationsRecord & { expand: { owner: UsersRecord; city: CitiesRecord } }>(id, { expand: 'owner,city' })`.
  3. Delete the `as unknown as Record<string, unknown>` casts. Let TypeScript infer or annotate explicitly.
  4. For the `pages.map((p: unknown) => …)` pattern at `pages/+page.server.ts:10`, use `pages.map((p) => ({ id: p.id, title: p.title, … }))` directly — `pages` is already `PagesRecord[]`.
- **Verification:** `pnpm svelte-check` after migration should produce zero errors. Add a CI check that greps for `as unknown as Record<string, unknown>` and fails if any are introduced.

#### T-2. Unsafe `form.get(…) as string` casts throughout admin actions

- **Severity:** MEDIUM
- **File(s):**
  - `src/routes/admin/users/[id]/+page.server.ts:56-59, 111`
  - `src/routes/admin/pages/[id]/+page.server.ts:34-41`
  - `src/routes/admin/pages/new/+page.server.ts:23-30`
  - `src/routes/admin/translations/+page.server.ts:70-71, 109, 136-137, 189`
- **Description:** `formData.get(name)` returns `FormDataEntryValue | null` (`string | File | null`). The admin actions cast it directly: `const title = form.get('title') as string;`. If the field is missing (malformed POST, or a different form shape), `title` is `null` cast to `string` — a type lie. The subsequent `if (!(title && slug))` check at line 43/61 happens to catch `null` because `null && null` is falsy, but if only one field is missing, the other is used as `null`-as-`string`.
- **Why it matters:** For fields like `congregationId` (line 111) used directly in a PocketBase `update`, passing `null` (cast as `string`) could set `congregation: null` unintentionally if the check at line 113 were ever weakened. The pattern is fragile.
- **Recommended fix:** Use `superValidate` with Zod schemas for all admin forms (the repo already uses this pattern in `/account/+page.server.ts:35` and `schemas/`). For actions that must read raw `formData`, coerce explicitly:
  ```ts
  const title = String(form.get('title') ?? '');
  const imageFile = form.get('image');
  if (imageFile instanceof File) { /* … */ }
  ```
- **Verification:** `pnpm svelte-check` should pass with `as string` removed.

#### T-3. `event.locals.validate` uses double `as unknown as` casts

- **Severity:** MEDIUM
- **File(s):** `src/hooks.server.ts:93-102`
- **Description:** The `validate` helper casts `superValidate`'s return through `as unknown as SuperValidated<output<S>>` twice (lines 99, 101). The generic plumbing is fragile — `output<S>` from `zod/v4/core` is an internal type and the cast hides any mismatch between the schema and the superforms adapter.
- **Recommended fix:** If the types do not line up, the right fix is to fix the adapter typing or use `z.infer<S>` instead of `output<S>`. If the cast is truly necessary, isolate it behind a single typed function and document why.
- **Verification:** `pnpm svelte-check` with the cast removed; if it fails, the error message will show what the real type mismatch is.

#### T-4. `cleanResponse` claims to return `T` but mutates the structure

- **Severity:** MEDIUM
- **File(s):** `src/lib/server/api.ts:47-53`
- **Description:** `cleanResponse<T extends Record<string, unknown>>(response: T, keepDate = false): T` claims to return `T`, but it removes fields (`collectionId`, `collectionName`, `updated`, optionally `created`) and runs `convertBooleans` which changes value types (see P-3). The returned object is not a `T` — it is a partial, type-altered subset. TypeScript cannot catch downstream access to removed fields.
- **Recommended fix:** Change the return type to `Omit<T, 'collectionId' | 'collectionName' | 'updated' | 'created'>` (or a wider type), and remove `convertBooleans` per P-3. If a "clean" response is genuinely needed, define an explicit `CleanedRecord` interface and return that.
- **Verification:** `pnpm svelte-check` will flag any downstream code that accessed `collectionId` etc.

---

### Performance Issues

#### F-1. Dashboard load fetches all congregations to compute geographic counts

- **Severity:** HIGH
- **File(s):** `src/routes/admin/+page.server.ts:34-60`
- **Description:** The dashboard load function calls `client.collection('congregations').getFullList({ requestKey: 'dash-cong-all' })` (line 36) to load **every** congregation into memory, then iterates to compute `countryCounts` and `stateCounts`. For a directory with thousands of congregations, this is a multi-MB JSON payload parsed into Node memory on every dashboard load, plus the `getFullList` pagination overhead (PocketBase paginates internally and `getFullList` loops until done). The geographic stats are computed in JS instead of in PocketBase.
- **Why it matters:** Dashboard load time grows linearly with congregation count. At 10k congregations, this is seconds of PB→Node transfer plus a hot loop, on every admin page open. The `invalidateAll()` in `analytics-section.svelte:48-53` re-runs this every 2 minutes.
- **Recommended fix:** Use PocketBase's `aggregate` API (0.20+) or a SQL view. The schema already has `countries` and `states` collections — add a `congregation_counts` view that groups by `country` and `state`, or use the PocketBase `/api/collections/congregations/aggregate` endpoint with `groupBy: 'country'`. Cache the result with the existing `$lib/server/cache.ts` (`clearCongregationCache` is already called from `/api/admin/cache/clear`). The `Promise.all` at lines 8-16 and 18-22 is already parallel; the sequential `await` at line 36 (dependent on `congCount + pendingCount > 0`) can be folded into the first batch.
- **Verification:** `VERIFICATION: requires env` — load test with 1k, 10k congregations; assert dashboard load < 500ms p95.

#### F-2. `invalidateAll()` every 2 minutes re-runs the entire dashboard load

- **Severity:** MEDIUM
- **File(s):** `src/lib/components/admin/analytics-section.svelte:48-53`
- **Description:** The `$effect` sets a 2-minute `setInterval` that calls `invalidateAll()`, which re-runs every `load` function on the current page — including the expensive `admin/+page.server.ts` load (see F-1) and the three PostHog `getWeeklyDigest` calls. This happens even when the admin is idle on the dashboard and even when the browser tab is in the background (setInterval does not pause in background tabs in most browsers, though it is throttled).
- **Why it matters:** Constant background load on PocketBase and PostHog. If multiple admins have the dashboard open, the aggregate load is N × (PB calls + PostHog calls) every 2 minutes.
- **Recommended fix:** Use `invalidate('dashboard:stats')` with a specific key instead of `invalidateAll()`, so only the dashboard load re-runs. Pause the interval when `document.visibilityState === 'hidden'` (Svelte 5 has `#if browser` and the Page Visibility API). Consider switching from `invalidateAll` to a manual `fetch` to a `/api/admin/dashboard` endpoint that returns just the digest.
- **Verification:** Playwright: open dashboard, background the tab, assert no PB calls for 5 minutes.

#### F-3. `getFullList` used without pagination in multiple admin pages

- **Severity:** MEDIUM
- **File(s):**
  - `src/routes/admin/+page.server.ts:27, 29, 36` (countries, states, all congregations)
  - `src/routes/admin/congregations/+page.server.ts:30, 38` (active + pending congregations — two full lists)
  - `src/routes/admin/pages/+page.server.ts:7` (all pages, no limit)
  - `src/routes/admin/users/export/+server.ts:25` (all users with deep expansion — see S-7)
- **Description:** `getFullList` paginates internally and concatenates all pages into one array. For collections that grow without bound (congregations, users, pages, translations), this is unbounded memory. The admin congregations page (line 28-45) loads `active` and `pending` as two separate `getFullList` calls — both unbounded.
- **Recommended fix:** For list pages, use `getList(page, perPage, …)` with pagination controls (the `users` list already does this at `users/+page.server.ts:16-23`). For the dashboard, use aggregate queries (F-1). For the CSV export, stream the response (chunk-by-chunk) instead of building the whole CSV in memory.
- **Verification:** `VERIFICATION: requires env` — load test with 50k users; assert export endpoint does not OOM.

#### F-4. `requestKey` includes user input, causing PocketBase dedup cache bloat

- **Severity:** LOW
- **File(s):** `src/routes/admin/translations/+page.server.ts:25`
- **Description:** `requestKey: \`admin-translations-${page}-${search.slice(0, 20)}\`` includes the first 20 chars of the search string. PocketBase uses `requestKey` for request deduplication — every distinct key is stored in an in-memory map until the response settles. A user typing in the search box generates a new key per keystroke (debounced by 300ms in the client, but the server still sees many distinct keys). Over a session, this can accumulate hundreds of entries.
- **Recommended fix:** Drop `search` from the `requestKey` — `admin-translations-${page}` is sufficient for dedup. Or remove `requestKey` entirely (PocketBase falls back to the URL).
- **Verification:** Inspect PocketBase memory after a search session; assert the dedup map is bounded.

---

### API Conformity and Consistency

#### A-1. Inconsistent auth-check response: `error(401)` vs `redirect(303, '/')`

- **Severity:** MEDIUM
- **File(s):**
  - `src/routes/api/admin/congregations/[id]/delete/+server.ts:9-11` — `throw error(401, 'Unauthorized')`
  - `src/routes/api/admin/congregations/[id]/toggle/+server.ts:9-11` — `throw error(401, 'Unauthorized')`
  - `src/routes/api/admin/cache/clear/+server.ts:7-9` — `throw redirect(303, '/')`
  - `src/routes/admin/+layout.server.ts:8-10` — `throw redirect(303, '/')` (correct for a page load)
  - `src/routes/admin/users/[id]/+page.server.ts:8, 51, 75, 89, 106, 127` — `throw redirect(303, '/')` (wrong for actions — see S-1)
- **Description:** API endpoints (`+server.ts`) return 401 JSON on auth failure, which is correct for `fetch` callers. But `cache/clear` redirects, and the admin page actions redirect instead of returning 401. A `fetch` POST to `?/save` that gets a 303 redirect will not follow it (browsers do not auto-follow 303 on `fetch` POST without `redirect: 'follow'`, and even then the response is HTML, not JSON). The client-side `enhance` handler receives a redirect result type, which most of the handlers in this branch do not handle (they check `result.type === 'success'`).
- **Recommended fix:** Standardise: `+server.ts` endpoints use `error(401, …)` (JSON). `+page.server.ts` actions use `error(401, …)` for unauthenticated, `fail(400, …)` for validation, `redirect(303, …)` for success-redirects. Layout/page `load` functions use `redirect(303, …)` for unauthenticated (correct — the browser follows it).
- **Verification:** Playwright: POST to each admin action with no cookie, assert 401 JSON (not 303).

#### A-2. Inconsistent PocketBase filter patterns (`pb.filter()` vs string literals)

- **Severity:** MEDIUM
- **File(s):**
  - String literals (no `pb.filter`):
    - `src/routes/admin/+page.server.ts:10, 14` — `filter: 'visible=true'`, `filter: 'visible=false'`
    - `src/routes/admin/congregations/+page.server.ts:31, 39` — same
    - `src/routes/sitemap.xml/+server.ts:13` — `filter: 'visible=true'`
    - `src/routes/admin/users/[id]/+page.server.ts:25` — `filter: 'owner = null'`
  - Parameterised (`pb.filter`):
    - `src/routes/admin/translations/+page.server.ts:16, 117` — `client.filter('key ~ {:search} …', { search })`
    - `src/routes/admin/users/+page.server.ts:13` — `client.filter('email ~ {:search} …', { search })`
    - `src/routes/[slug]/+page.server.ts:14, 23, 31` — `api.filter('slug={:slug}', { slug })` (but line 31 mixes parameterised and literal: `'page={:pageId} && language="en"'`)
- **Description:** AGENTS.md is explicit: "use `pb.filter(expr, params)` instead of string interpolation for all queries". The admin layer follows this for user-influenced filters but not for static filters like `visible=true`. While static literals are not injectable, the inconsistency is a maintenance hazard — a future edit that interpolates into a literal-pattern filter will create an injection. The mixed pattern at `[slug]/+page.server.ts:31` is particularly confusing.
- **Recommended fix:** Use `client.filter('visible = {:visible}', { visible: true })` everywhere, even for static values. For `[slug]:31`, change to `api.filter('page={:pageId} && language={:lang}', { pageId: page.id, lang: 'en' })`.
- **Verification:** Grep for `filter: '` (single-quoted literal) in `src/routes/**` should return zero matches.

#### A-3. Sitemap includes unpublished pages and hardcodes origin

- **Severity:** MEDIUM
- **File(s):** `src/routes/sitemap.xml/+server.ts:27-32, 38`
- **Description:** The sitemap fetches all pages with `fields: 'slug'` and no `filter` for `published`/`visible`. Every draft page is included in the sitemap and crawlable. The origin is hardcoded to `'https://opencommunities.info'` — staging/preview environments will advertise production URLs to search engines.
- **Recommended fix:** Add `filter: client.filter('published = {:published}', { published: true })` (assuming a `published` boolean on `pages`; if not, add one). Use `env.PUBLIC_ORIGIN` or `event.url.origin` for the sitemap origin.
- **Verification:** Inspect sitemap output on staging; assert origin matches staging URL and no draft slugs appear.

#### A-4. `redeploy` action constructs Coolify URL with template literal instead of `URLSearchParams`

- **Severity:** LOW
- **File(s):** `src/routes/admin/translations/+page.server.ts:163`
- **Description:** `const url = \`${baseUrl}/api/v1/deploy?uuid=${coolifyAppUuid}&force=true\`;` — `coolifyAppUuid` is from env and presumably safe, but template-literal URL construction is fragile. If `coolifyUrl` (line 162) contains a trailing path or query, the concatenation breaks.
- **Recommended fix:** Use `new URL('/api/v1/deploy', baseUrl)` and `url.searchParams.set('uuid', coolifyAppUuid); url.searchParams.set('force', 'true')`.
- **Verification:** Unit-test with `coolifyUrl = 'https://coolify.example.com/'` (trailing slash) and `https://coolify.example.com/path?x=1`; assert the resulting URL is correct.

---

### Documentation Consistency

#### D-1. AGENTS.md contradicts actual code on auth cookie security

- **Severity:** MEDIUM
- **File(s):** `AGENTS.md:302-307` vs `src/hooks.server.ts:104-110`
- **Description:** AGENTS.md says: "Auth cookies are `httpOnly: false` and `secure` is commented out (known issue)" and "SMTP has `rejectUnauthorized: false` (known issue — needed for local Mailpit)". The actual code at `hooks.server.ts:104-110` sets `httpOnly: true, secure: !dev, sameSite: 'strict'` — the httpOnly issue is fixed. SMTP at `mail.ts:153` has `tls: { rejectUnauthorized: true }` — also fixed. The docs describe a stale state and will mislead contributors.
- **Recommended fix:** Update AGENTS.md "Security Considerations" to reflect the current state. Remove the "known issue" lines for httpOnly and SMTP rejectUnauthorized. Add a note that the `authRefresh` cooldown (line 34) addresses the "Auth refresh fails on every request" issue.
- **Verification:** Diff AGENTS.md against `hooks.server.ts` and `mail.ts`; no contradictions.

#### D-2. AGENTS.md PocketBase version mismatch

- **Severity:** LOW
- **File(s):** `AGENTS.md:10` says "PocketBase 0.29.x"; `package.json:100` declares `"pocketbase": "^0.27.0"`; installed version is `0.27.0`.
- **Description:** The docs claim 0.29.x but the SDK is 0.27.x. The 0.27→0.29 jump added `autoCancellation` defaults, batch endpoints, and schema changes. Contributors may use 0.29-only APIs that fail at runtime.
- **Recommended fix:** Either upgrade `pocketbase` to `^0.29.0` (and re-run `pnpm build:types` against a 0.29 PB instance) or update AGENTS.md to "PocketBase 0.27.x".
- **Verification:** `cat node_modules/pocketbase/package.json | grep version` matches AGENTS.md.

#### D-3. New admin routes and Coolify integration not documented in README

- **Severity:** MEDIUM
- **File(s):** `README.md` (not modified in this branch), `AGENTS.md` architecture diagram (does not mention `/admin/**` routes)
- **Description:** The branch adds `/admin/congregations`, `/admin/pages`, `/admin/pages/new`, `/admin/pages/[id]`, `/admin/translations`, `/admin/users`, `/admin/users/[id]`, `/admin/users/export`, `/api/admin/cache/clear`, `/api/admin/congregations/[id]/{toggle,delete}`, `/account`, `/sitemap.xml`, and the Coolify redeploy integration. None of these appear in the AGENTS.md architecture diagram or route list. The `COOLIFY_URL` / `COOLIFY_TOKEN` / `COOLIFY_APP_UUID` env vars are not listed in the required-env section.
- **Recommended fix:** Update AGENTS.md architecture section to include the new routes. Add `COOLIFY_*` and `POSTHOG_CLI_API_KEY` / `POSTHOG_CLI_PROJECT_ID` / `POSTHOG_CLI_HOST` to the required env vars list. Document the redeploy flow and the translation build-time fetch (`scripts/fetch-translations.mjs`).
- **Verification:** Reviewer reads AGENTS.md and can answer "what env vars does the admin layer need?" without reading code.

#### D-4. Missing JSDoc on exported server functions (`getWeeklyDigest`, `withRetry`, `loadUser`, etc.)

- **Severity:** LOW
- **File(s):** `src/lib/server/posthog-api.ts:63, 87, 119, 147, 174`, `src/lib/server/api.ts:122, 152, 182`
- **Description:** `getWeeklyDigest` has a one-line comment but no `@param`/`@returns` JSDoc. `_queryTrends` (line 119) and `_getInsight` (line 147) have minimal comments. `withRetry` has good documentation (lines 117-121). The inconsistency makes the public API harder to consume.
- **Recommended fix:** Add JSDoc to all exported functions in `$lib/server/**`. For the `_`-prefixed functions, either document them as internal or delete them if unused (see L-2).

---

### Best Practices

#### B-1. Missing confirmation dialogs for destructive admin actions

- **Severity:** MEDIUM
- **File(s):** `src/routes/admin/users/[id]/+page.svelte:149-152` (delete account), `src/lib/components/account/danger-zone.svelte` (delete account — need to verify)
- **Description:** The admin user-edit page has a "Delete Account" button in a plain form with no confirmation. Clicking it deletes the user immediately. The translations page (correctly) uses `AlertDialog` for delete confirmation (lines 403-438); the user-edit page does not. An admin misclick destroys an account.
- **Recommended fix:** Wrap the delete form in an `AlertDialog` like the translations page does.
- **Verification:** Playwright: click delete, assert a dialog appears, cancel, assert user still exists.

#### B-2. `JSON.parse` of form-submitted JSON without schema validation

- **Severity:** MEDIUM
- **File(s):**
  - `src/routes/admin/pages/[id]/+page.server.ts:76` — `JSON.parse(variantsJson)` cast to `Array<{…}>`
  - `src/routes/admin/pages/new/+page.server.ts:64` — same
  - `src/routes/admin/translations/+page.server.ts:79` — `JSON.parse(entriesJson)` cast to `Array<{…}>`
- **Description:** The page editor submits a hidden `variants` field containing a JSON string built client-side. The server `JSON.parse`s it and casts to a typed array. If the client sends malformed or extra fields, the cast lies. A malicious admin (or an admin with a hijacked session — see S-3) could send `[{ "language": "en", "title": "x", "$unknown": "y" }]` and the extra field would be passed to PocketBase if the spread/copy logic ever changes.
- **Recommended fix:** Define Zod schemas for `variants` and `entries` and `parse` them. This also gives proper error messages instead of "Save failed".
  ```ts
  const variantSchema = z.object({ id: z.string().optional(), language: z.string(), title: z.string(), … });
  const variants = z.array(variantSchema).parse(JSON.parse(variantsJson));
  ```
- **Verification:** Vitest: POST with malformed JSON, assert 400 with a specific error.

#### B-3. Pervasive `biome-ignore` comments indicate rule mismatch

- **Severity:** LOW
- **File(s):** Throughout `src/routes/admin/**` and `src/lib/components/admin/**`
  - `lint/suspicious/useAwait` (SvelteKit async signatures) — every `load` and action
  - `lint/performance/noNamespaceImport` (shadcn namespace pattern) — every component using `* as Card`
  - `lint/performance/useTopLevelRegex` (inline regex) — slug validation
  - `lint/complexity/noExcessiveCognitiveComplexity` — page save action
  - `lint/suspicious/noUnassignedVariables` — `bind:this` variables
- **Description:** The branch adds dozens of `biome-ignore` comments. Some are legitimate (SvelteKit's `useAwait` rule conflicts with required async signatures), but the volume suggests the Biome config should be updated rather than each site suppressed. Commit `c0bbb01` already disabled several rules (`noNestedTernary`, `noExportedImports`, `useSortedClasses`, `noParameterProperties`, `useFilenamingConvention`, `noBarrelFile`) — the remaining suppressions should be evaluated for the same treatment.
- **Recommended fix:** Audit the `biome-ignore` comments. For rules suppressed more than 5 times, consider disabling the rule in `biome.json`. For one-off suppressions, keep them but add a comment explaining why.
- **Verification:** `rg "biome-ignore" src/ | wc -l` should decrease; the remaining suppressions should each have a justifying comment.

#### B-4. Account actions do not invalidate the session after `deleteAccount`

- **Severity:** MEDIUM
- **File(s):** `src/routes/account/+page.server.ts:72-78`
- **Description:** `deleteAccount` calls `client.collection('users').delete(id)` and `client.authStore.clear()`, but it does not clear the `auth` and `session` cookies. The next request will `loadFromCookie` the (now-deleted) token, fail `authRefresh` (line 142), and clear the store in the catch (line 153), but the user will see one more authenticated render before the cookie is cleared. Worse, if the user has multiple tabs, the other tabs remain authenticated until their next request.
- **Recommended fix:** In `deleteAccount`, also `event.cookies.set('auth', '', { …cookieOpts, maxAge: 0 })` and `event.cookies.set('session', '', { …cookieOpts, maxAge: 0 })`. Return a `redirect(303, '/')` so the browser navigates away.
- **Verification:** Playwright: delete account, assert cookies are gone and redirect to `/`.

#### B-5. `/admin/+layout.svelte` is empty — no admin nav, no logout

- **Severity:** LOW
- **File(s):** `src/routes/admin/+layout.svelte:1-8`
- **Description:** The admin layout is a single `<div>` wrapping `{@render children?.()}`. There is no admin navigation (Dashboard / Congregations / Users / Pages / Translations), no breadcrumb, no "back to site" link, no logout button. Each admin page re-implements its own header. The screenshots (`admin-dashboard.png`, `admin-login.png`) in the repo root suggest a redesign was planned (`admin-redesign-plan.md`) but not implemented in this branch.
- **Recommended fix:** Add a shared admin shell with nav links and a logout button. This is a UX issue, not a blocker.
- **Verification:** Visual review against `admin-redesign-plan.md`.

---

### Code Style and Consistency

#### C-1. `[slug]/+page.server.ts` load function missing `PageServerLoad` type annotation

- **Severity:** LOW
- **File(s):** `src/routes/[slug]/+page.server.ts:8`
- **Description:** `export async function load({ cookies, fetch, locals, params }) {` — no `: PageServerLoad` annotation. Every other load function in the branch uses `export const load: PageServerLoad = async ({ … }) => {`. The untyped version loses SvelteKit's typed `params`, `locals`, etc.
- **Recommended fix:** `export const load: PageServerLoad = async ({ cookies, fetch, locals, params }) => { … }`.
- **Verification:** `pnpm svelte-check`.

#### C-2. Mixed `for…of` and `.map`/`.filter` patterns within the same file

- **Severity:** LOW
- **File(s):** `src/routes/admin/+page.server.ts:45-60` (for…of), `src/routes/admin/translations/+page.server.ts:31-33, 38-48` (for…of), vs `src/routes/admin/+page.server.ts:62-84` (`.map`, `.filter`, `.sort`, `.slice`)
- **Description:** AGENTS.md says "Prefer `for...of` loops over `.forEach()` and indexed `for` loops". The admin layer mixes `for…of` (for side effects) and `.map`/`.filter` (for transformations) inconsistently. The `for…of` in `admin/+page.server.ts:45-50` builds `countryMap` and `stateCountryMap` — these could be `Object.fromEntries(allCountries.map(c => [c.id, c.name]))`.
- **Recommended fix:** Consistency pass: use `.map`/`.filter`/`.reduce` for transformations, `for…of` only for side effects. Not a blocker.
- **Verification:** Code review.

#### C-3. Magic strings for `requestKey`, locale codes, and collection names

- **Severity:** LOW
- **File(s):** Throughout — `requestKey: 'dash-cong'`, `'admin-cong-active'`, `'admin-pages'`, etc.; locale codes `'en', 'es', 'fr', 'he', 'de', 'hu', 'nl', 'pl', 'pt', 'ru', 'uk'` repeated in `page-editor.svelte:17-29`, `schemas/user.ts:36`, `account/+page.server.ts:20`
- **Description:** Locale codes are duplicated in at least three places. Collection names (`'congregations'`, `'users'`, `'pages'`, `'pageVariants'`, `'translations'`) are string literals throughout. If a collection is renamed, every literal must be found and updated.
- **Recommended fix:** Extract a `const LOCALES = ['en', …] as const` and `const COLLECTIONS = { congregations: 'congregations', … } as const` in `$lib/constants.ts`. Use these everywhere.
- **Verification:** Grep for literal locale arrays and collection-name strings; should be zero outside the constants file.

---

### Linting and Code Quality

#### L-1. Six `noSkippedTests` lint errors block CI

- **Severity:** CRITICAL (per skill rule: "A single failed check is a CRITICAL finding")
- **File(s):**
  - `src/lib/components/global/combobox.test.ts:7:10`
  - `src/lib/components/global/menu.loggedin.test.ts:7:10`
  - `src/test/svg-diagnostics.test.ts` (4 occurrences)
- **Description:** Commit `dbaf2a1` ("fix: skip tests affected by @testing-library/svelte Svelte 5 incompatibility, mock PocketBase in test setup") added `describe.skip` but did not add the `biome-ignore lint/suspicious/noSkippedTests: …` suppression comments that the rule requires. `pnpm run check` fails with 6 errors.
- **Recommended fix:** Add the suppression comment above each `describe.skip`:
  ```ts
  // biome-ignore lint/suspicious/noSkippedTests: @testing-library/svelte × Svelte 5 incompatibility — see AGENTS.md
  describe.skip('Combobox', () => { … })
  ```
  Or, better, move the skipped tests into a separate `*.skip.test.ts` file and exclude that pattern from the lint config.
- **Verification:** `pnpm run check` exits 0.

#### L-2. Dead code: `_queryTrends`, `_getInsight`, `_listInsights` exported but unused

- **Severity:** LOW
- **File(s):** `src/lib/server/posthog-api.ts:119-202`
- **Description:** The three `_`-prefixed functions are exported (via the `export` keyword on `queryTrends`? — actually `_queryTrends` is not exported, but `_getInsight` and `_listInsights` are). A grep for callers returns zero matches outside the file. Commit `a0ff28b` ("feat: add getInsight + listInsights functions to posthog-api") added them, but they were never wired up. They carry the SQL-injection-shaped code (S-5) and add maintenance burden.
- **Recommended fix:** Delete the three functions. If they are needed later, restore from git history. This also resolves S-5.
- **Verification:** `rg "_queryTrends|_getInsight|_listInsights" src/` returns zero matches after deletion.

---

### Testing Coverage

#### T-5. No tests for any new admin functionality

- **Severity:** HIGH
- **File(s):** `src/test/server/**` — no test files for `admin/+page.server.ts`, `admin/users/+page.server.ts`, `admin/users/[id]/+page.server.ts`, `admin/users/export/+server.ts`, `admin/congregations/+page.server.ts`, `admin/pages/+page.server.ts`, `admin/pages/[id]/+page.server.ts`, `admin/pages/new/+page.server.ts`, `admin/translations/+page.server.ts`, `api/admin/cache/clear/+server.ts`, `api/admin/congregations/[id]/delete/+server.ts`, `api/admin/congregations/[id]/toggle/+server.ts`, `sitemap.xml/+server.ts`, `account/+page.server.ts`, `lib/server/posthog-api.ts`
- **Description:** The branch adds ~2,000 lines of server-side logic with zero unit tests. The existing test suite covers the public-facing routes (`login`, `contact`, `add`, `edit`, `slug`, `sitemap`) but nothing in `admin/**` or `api/admin/**`. The bugs found in this review (S-1, S-2, P-1, P-2, P-4) would all have been caught by basic action tests.
- **Why it matters:** The admin layer has the highest privilege in the system. Untested admin code is the highest-risk surface for regressions and security holes.
- **Recommended fix:** Add server tests for every admin action, covering at minimum:
  - Unauthenticated POST returns 401 (would catch S-1, S-2)
  - Non-admin POST returns 401/403
  - Happy-path action succeeds and produces the expected PocketBase calls
  - Validation failures return 400 with specific errors
  - For `users/[id]` update: posting only `name`/`email` does not change `admin`/`verified` (would catch P-1)
  - For `pages/[id]` and `pages/new` save: image upload works end-to-end (would catch P-2)
  - For `translations` save: parallel calls + rollback on failure (would catch P-4)
  - For `users/export`: CSV injection mitigation (would catch S-4)
- **Verification:** Coverage report shows `src/routes/admin/**` and `src/routes/api/admin/**` at ≥80% line coverage.

#### T-6. E2E admin spec is thin

- **Severity:** MEDIUM
- **File(s):** `e2e/tests/admin.spec.js`
- **Description:** The E2E admin spec (not read in detail for this review, but per the commit log it was updated in commits `fb2310d`, `0c467db`, `dda868c`) covers login and basic admin routes but does not exercise the new translations CRUD, page editor, user edit, CSV export, or redeploy flow.
- **Recommended fix:** Add E2E specs for each admin CRUD flow. The redeploy flow should be mocked (do not actually trigger Coolify in E2E).
- **Verification:** `pnpm test:e2e` passes and exercises every admin route.

---

### Library and API Documentation Verification (Phase 3)

| Library / API | Version | Usage verified against docs? | Notes |
|---|---|---|---|
| `pocketbase` (JS SDK) | 0.27.0 | Partial | `getOne`, `getList`, `getFullList`, `update`, `delete`, `create`, `authRefresh`, `authStore.loadFromCookie/exportToCookie` all match 0.27 docs. `requestPasswordReset(email, { fetch })` at `users/[id]/+page.server.ts:133` — the second argument is `{ requestKey?, fetch? }` in 0.27, so passing `{ fetch }` is correct. `getFullList` without `batchSize` defaults to 500 — fine. AGENTS.md claims 0.29.x — see D-2. |
| `sveltekit-superforms` | 2.30.1 | Yes | `superValidate(request, zod4(schema))` matches v2 docs. `setError(form, '', msg)` at `account/+page.server.ts:59` is the correct v2 API for form-level errors. |
| `zod` | 4.4.3 | Yes | `z.email()`, `z.enum(…)`, `superRefine`, `z.ZodIssueCode.custom` all match Zod 4. The `import * as z from 'zod'` + `z.ZodIssueCode` pattern is correct for v4 (v3 used `z.ZodIssueCode` from the main export). |
| `isomorphic-dompurify` | 3.18.0 | Yes | `DOMPurify.sanitize(html, { ALLOWED_TAGS, ALLOWED_ATTR })` matches docs. Used correctly in `[slug]/+page.svelte:61` and `mail.ts:100`. |
| `marked` | 18.0.5 | Yes | `marked.parseInline(bodyText)` at `mail.ts:99` matches v18 docs. |
| `nodemailer` | 9.0.1 | Yes | `createTransport`, `sendMail`, `verify` all match v9. The `SMTPTransport.Options` typing at `mail.ts:149` is correct. |
| `pell` | 1.0.6 | Yes | `pell.init({ element, actions, onChange, defaultParagraphSeparator, styleWithCSS })` matches the pell README. The `actions` array uses string action names (valid). |
| `super-sitemap` | 1.0.12 | Partial | `sitemapResponse({ origin, excludeRoutePatterns, paramValues, additionalPaths, defaultChangefreq, defaultPriority, sort })` — the `paramValues` shape (`{ '/[slug]': [['slug1'], ['slug2']] }`) and `additionalPaths` (array of strings) match the README. `sort: 'alpha'` is documented. |
| `@tanstack/table-core` | 8.21.3 | Yes | `ColumnDef`, `getCoreRowModel`, `createSvelteTable` (from the shadcn wrapper) all match v8. The `createRawSnippet` + `renderSnippet` pattern is Svelte 5 / shadcn-svelte specific. |
| `sveltekit-helmet` | 2.1.0 | Yes | `helmet({ contentSecurityPolicy, … })` with `reportOnly` matches docs. The CSP directive object shape matches. |
| `radashi` | 12.9.1 | Yes | `assign`, `omit`, `isArray`, `isEmpty`, `isFunction` all exist in radashi 12. |
| `tslog` | 4.10.2 | Yes | `logger.getSubLogger({ name })`, `log.warn/info/error/debug` match v4. |
| `cookie` | 0.7.0 | Yes | `cookie.parse(str)` matches 0.7. Note: 0.7.x is the last version before the CVE-2025-7339 cookie-injection fix in 1.0.0; consider upgrading. |

**No hallucinated APIs detected.** All library calls match the documented signatures for the installed versions. The one concern is the `cookie` package version (0.7.0) which has a known CVE; the repo upgraded from an older version (commit `67902ae`) but stopped short of 1.0.0.

---

## Remediation Plan

The plan is ordered by dependency: security blockers first, then correctness blockers, then the HIGH issues that should not ship, then the MEDIUM/LOW cleanup. Each step lists the files to touch, the tests to add, and the rollback considerations.

### Step 1: Fix the five CRITICAL security and correctness blockers

- **Rationale:** These are merge blockers. S-1, S-2, S-3 are exploitable by unauthenticated or low-privilege users. P-1 silently corrupts admin/verified flags on every user edit. P-2 silently drops every uploaded image. None can ship to production.
- **Implementation:**
  1. **S-1** — Add `if (!client?.authStore?.record?.admin) throw error(401, 'Unauthorized');` to every action in `src/routes/admin/translations/+page.server.ts` (save, delete, add, redeploy, status). Use `error(401)` not `redirect(303)` because these are `fetch` POSTs.
  2. **S-2** — Add the same guard to `unlink` and `deleteAccount` in `src/routes/account/+page.server.ts:64, 72`. Also clear the `auth`/`session` cookies with `maxAge: 0` in `deleteAccount` (addresses B-4).
  3. **S-3** — Replace the `createRawSnippet` + template-literal pattern in `src/lib/components/users/user-list.svelte:55-122` with `renderSnippet` from `$lib/components/ui/data-table/render-helpers.ts` using normal Svelte markup (auto-escaped). If `renderSnippet` cannot be used, add an `escapeHtml` helper and apply it to every interpolated value.
  4. **P-1** — In `src/routes/admin/users/[id]/+page.svelte:66-83`, add `verified` and `admin` toggles (Switch components with hidden inputs posting `'true'`/`'false'`). In `src/routes/admin/users/[id]/+page.server.ts:48-71`, only write `verified`/`admin` when the fields are present in the form data, or migrate the action to `superValidate` with a Zod schema where `verified`/`admin` are optional.
  5. **P-2** — In `src/lib/components/admin/page-editor.svelte`, add a real `<input type="file" name="image" bind:files={imageFiles} />` (hidden, triggered by FileDropZone) so the server receives a `File`. Remove the base64 hidden input. Alternatively, change the server to detect base64 strings and decode them — but the file-input fix is cleaner.
- **Tests:**
  - Server test: unauthenticated POST to each admin action returns 401 (S-1, S-2).
  - Server test: posting only `name`/`email` to `users/[id]` update does not change `admin`/`verified` (P-1).
  - Browser test: `user-list.svelte` with a user whose name is `<img src=x onerror=…>` does not execute the handler (S-3).
  - E2E: admin creates a page with an image, navigates to the page, image renders (P-2).
- **Docs:** Update AGENTS.md "Security Considerations" to note that admin actions require explicit auth checks (layout does not protect actions).
- **Rollback:** Each fix is independent and can be reverted individually. The S-1/S-2 fixes are pure additions (guards at the top of functions). The S-3 fix touches one component. The P-1 fix touches one form + one action. The P-2 fix touches one component + two actions.

### Step 2: Fix the HIGH security issues (S-4 through S-9)

- **Rationale:** These are not blockers individually but together they represent a weak security posture. S-4 (CSV injection) and S-6 (silent email failure) affect user-facing behavior. S-5 is latent but in exported code. S-7/S-8/S-9 are defense-in-depth.
- **Implementation:**
  1. **S-4** — Update `csvEscape` in `src/routes/admin/users/export/+server.ts:5-16` to prefix formula characters with `'` per OWASP.
  2. **S-5** — Delete `_queryTrends`, `_getInsight`, `_listInsights` from `src/lib/server/posthog-api.ts:119-202` (they are unused — L-2). This also resolves L-2.
  3. **S-6** — Change `transactionalMail` and `adminMail` in `src/lib/server/mail.ts` to return `{ ok: true } | { ok: false; error: string }`. Update callers in `api/admin/congregations/[id]/toggle/+server.ts` and `delete/+server.ts` to check the return and surface failures.
  4. **S-7** — Add an in-memory rate limiter (reuse the `Map<sessionKey, timestamp>` pattern from `hooks.server.ts:33-43`) for `/admin/users/export` (1/min), `/admin/translations?/redeploy` (1/5min), and `/api/admin/congregations/[id]/delete` (10/min).
  5. **S-8** — Add `event.locals.capture('admin_action', { action, target, adminId })` to every admin action. For destructive actions, also write to a new `audit_log` PocketBase collection.
  6. **S-9** — In `src/routes/admin/users/[id]/+page.server.ts` `update` action, before setting `admin: false`, count active admins and refuse if target is the last admin. Refuse self-demotion.
- **Tests:**
  - `csvEscape('=cmd')` returns `"'=cmd"`.
  - `transactionalMail` with mocked failing transport returns `{ ok: false, … }`; the toggle endpoint surfaces it.
  - Rate limiter: second call within window returns 429.
  - Last-admin demotion returns 400.
- **Docs:** Document the audit log collection in AGENTS.md.
- **Rollback:** The mail.ts change is the riskiest (callers must be updated in lockstep). Land it in a single commit with all callers updated.

### Step 3: Fix the HIGH correctness and performance issues (P-3, P-4, F-1, T-1)

- **Rationale:** P-3 (`convertBooleans` corruption) and P-4 (N+1 translations) cause silent data issues. F-1 (dashboard full-scan) causes scaling failure. T-1 (type-safety regression) is the largest maintainability debt and enables the other bugs.
- **Implementation:**
  1. **P-3** — Delete `convertBooleans` and its call in `cleanResponse` (`src/lib/server/api.ts:52, 55-77`). Run the test suite; fix any test that relied on the corruption.
  2. **P-4** — Refactor `save` and `delete` in `src/routes/admin/translations/+page.server.ts:86-128` to use `Promise.allSettled` with rollback of created records on partial failure.
  3. **F-1** — Replace the `getFullList` + JS counting in `src/routes/admin/+page.server.ts:34-60` with a PocketBase aggregate query or a SQL view. Cache the result with `$lib/server/cache.ts`.
  4. **T-1** — Migrate the admin handlers off `as unknown as Record<string, unknown>` casts to use the generated `TypedPocketBase` collection types. This is a large change; do it file-by-file in separate commits (congregations first, then users, then pages, then translations, then the API endpoints). Each migration should produce zero `svelte-check` errors and no behavior change.
- **Tests:**
  - `cleanResponse` no longer converts `0`/`1` to booleans.
  - Translations save with 11 entries makes 11 parallel PB calls (mock assertions), rolls back on partial failure.
  - Dashboard load with 10k congregations completes < 500ms.
  - After T-1 migration, `svelte-check` is clean.
- **Docs:** Note the `TypedPocketBase` usage pattern in AGENTS.md.
- **Rollback:** T-1 is the riskiest (large diff). Do it in PR-sized chunks per file. P-3 and P-4 are small and safe. F-1 requires a PB schema migration (the view) which needs a deploy.

### Step 4: Fix the lint failure and dead code (L-1, L-2)

- **Rationale:** CI is red. This is a blocker per the skill rules.
- **Implementation:**
  1. **L-1** — Add `biome-ignore lint/suspicious/noSkippedTests: …` comments to the 6 skipped-test sites, or move them to `*.skip.test.ts` files excluded from lint.
  2. **L-2** — Delete `_queryTrends`, `_getInsight`, `_listInsights` (already in Step 2 for S-5).
- **Tests:** `pnpm run check` exits 0.
- **Rollback:** Trivial.

### Step 5: Add tests for the admin layer (T-5, T-6)

- **Rationale:** The admin layer has zero tests. Every bug in this review would have been caught by basic action tests. This is the highest-leverage change for preventing regressions.
- **Implementation:** Add `src/test/server/admin/*.test.ts` files for each admin page server and API endpoint. Cover: unauthenticated, non-admin, happy path, validation failure, edge cases (last admin, partial failure, etc.). Add E2E specs in `e2e/tests/admin.spec.js` for the translations CRUD, page editor, user edit, and CSV export flows.
- **Tests:** The tests are the deliverable.
- **Rollback:** N/A.

### Step 6: Fix MEDIUM issues (A-1, A-2, A-3, B-1, B-2, B-3, B-4, F-2, F-3, P-5, P-6, S-10, D-3)

- **Rationale:** These are quality issues that should not linger but are not blockers.
- **Implementation:** Batch into themed commits:
  1. **Auth-response consistency (A-1)** — Change all admin actions from `redirect(303, '/')` to `error(401, …)` for unauthenticated requests.
  2. **Filter consistency (A-2)** — Replace all string-literal filters with `client.filter(…)`.
  3. **Sitemap (A-3)** — Add `published` filter; use `event.url.origin`.
  4. **Confirmation dialogs (B-1)** — Wrap `users/[id]` delete in AlertDialog.
  5. **JSON schema validation (B-2)** — Add Zod schemas for `variants` and `entries`.
  6. **biome-ignore audit (B-3)** — Disable or document each suppression.
  7. **Cookie clearing (P-6)** — `maxAge: 0` on logout.
  8. **invalidateAll (F-2)** — Use targeted `invalidate(…)`.
  9. **Pagination (F-3)** — Add pagination to admin congregations and pages lists.
  10. **Docs (D-3)** — Update AGENTS.md architecture and env vars.
- **Tests:** Each commit adds or updates tests as appropriate.
- **Rollback:** Per-commit.

### Step 7: Fix LOW issues (C-1, C-2, C-3, D-2, D-4, F-4)

- **Rationale:** Cleanup; do last to avoid merge conflicts with the higher-priority changes.
- **Implementation:** Type annotations, constant extraction, doc updates.
- **Rollback:** Per-commit.

---

## Verification Checklist

- [ ] `pnpm run check` passes with zero errors (after L-1 fix)
- [ ] `pnpm svelte-check` passes with zero errors (after T-1 migration; requires `pnpm build` first for paraglide)
- [ ] `pnpm test:unit` passes (after T-5 adds admin tests; requires Dockerised PB)
- [ ] `pnpm test:e2e` passes (after T-6 adds admin E2E specs)
- [ ] No `as unknown as Record<string, unknown>` casts in `src/routes/admin/**` (after T-1)
- [ ] No `describe.skip` without a `biome-ignore` suppression (after L-1)
- [ ] Every admin action has an explicit `if (!client?.authStore?.record?.admin) throw error(401, …)` guard (after S-1, S-2)
- [ ] `user-list.svelte` does not use `createRawSnippet` with unescaped interpolation (after S-3)
- [ ] `users/[id]` update action does not write `admin`/`verified` to `false` when fields are absent (after P-1)
- [ ] Page image upload persists the image to PocketBase (after P-2)
- [ ] `csvEscape` prefixes `=`, `+`, `-`, `@` with `'` (after S-4)
- [ ] `transactionalMail` returns a result the caller can check (after S-6)
- [ ] `convertBooleans` is deleted (after P-3)
- [ ] Translations save uses `Promise.allSettled` with rollback (after P-4)
- [ ] Dashboard load does not call `getFullList` on congregations (after F-1)
- [ ] AGENTS.md matches the code (after D-1, D-2, D-3)
- [ ] Security review: no unauthenticated admin actions, no XSS in admin components, no CSV injection, rate limits on export/redeploy
- [ ] API contracts: all admin actions return 401 JSON (not 303 redirect) when unauthenticated
- [ ] Documentation: AGENTS.md architecture section includes all new routes and env vars

---

## Final Recommendation

**BLOCK UNTIL FIXED**

The branch delivers a substantial and useful admin backend, but it has **five CRITICAL defects** that cause security breach (S-1, S-2, S-3), silent data corruption (P-1), and broken core functionality (P-2). It also has a red CI (L-1), zero test coverage for the new admin layer (T-5), and a systemic type-safety regression (T-1) that violates the repo's own zero-`any` policy.

The remediation plan above is ordered so that Step 1 (the five blockers + the lint fix) can land as a single focused PR that unblocks merge. Steps 2-7 can follow as a fast-tracked sequence of smaller PRs. The largest single change is the T-1 type-safety migration (Step 3), which should be done file-by-file to keep diffs reviewable.

Until Step 1 is merged, this branch must not be deployed to production. The S-1 (unauthenticated Coolify redeploy) and S-3 (stored XSS in admin user list) issues are remotely exploitable by any unauthenticated or low-privilege attacker.

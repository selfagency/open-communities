# Fallow Code Health Remediations Plan

**Date:** 2026-06-30  
**Project:** OpenCommunities  
**Baseline:** fallow.json analysis

---

## Executive Summary

* **Critical CRAP:** 7 functions. All `coverage_tier: none`. Fastest fix = test, not refactor.
* **High Complexity:** 18 functions with coverage. Extract guards + lookup tables.
* **Duplication:** 22 clone groups, 10.4% dup. Mostly test boilerplate + Svelte form snippets.
* **Quick Wins:** Add fallow.json ignore for config files, extract form validation helpers, split bootstrap script.

---

## TIER 1 — Critical CRAP (Untested + Complex)

CRAP = CC² · (1−cov)³ + CC. Zero coverage → score explodes. Fastest fix = test, not refactor.

| File | Function | CC/Cog | CRAP | Strategy |
|---|---|---|---|---|
| `docker/scripts/bootstrap.mjs` | `createCapKeys` | 22/34 | 506 | Refactor + test (pure cores) |
| `src/hooks.client.ts` | `handleError` | 14/8 | 210 | Test only (branchy, not tangled) |
| `src/routes/account/+page.server.ts` | `load` | 13/6 | 182 | Test only (auth guard matrix) |
| `src/routes/admin/pages/[id]/+page.server.ts` | `save` | 25/24 | 160 | Refactor + test (extract helpers) |
| `src/routes/admin/pages/new/+page.server.ts` | `save` | 20/18 | 106 | Refactor + test (extract helpers) |
| `src/routes/admin/users/[id]/+page.svelte` | `<template>` | 10/14 | 110 | Extract child components + test |
| `vite.config.ts` | `default` | 10/6 | 110 | Ignore (config files exempt) |

---

## 1a. `src/hooks.client.ts` — `handleError` (CRAP 210)

**Issue:** CC 14 but cog only 8 → branchy, not tangled. Zero coverage kills CRAP score. Fix with tests, no refactor needed.

**Test Plan:**
- Test generic Error handling branch
- Test 404 status guard
- Test non-Error throwable swallow
- Test all status code arms (redirect vs error vs ignore)

**Implementation:**

```ts
// src/hooks.client.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('$lib/posthog', () => ({
  captureException: vi.fn(),
  posthog: { capture: vi.fn() }
}));

describe('handleError (client)', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns shaped error for generic Error', async () => {
    const { handleError } = await import('./hooks.client');
    const r = handleError({
      error: new Error('boom'),
      event: { url: new URL('http://x/'), route: { id: '/' } },
      status: 500,
      message: 'Internal Error'
    } as never);
    expect(r).toMatchObject({ message: expect.any(String) });
  });

  it('handles 404 status branch', async () => {
    const { handleError } = await import('./hooks.client');
    const r = handleError({
      error: new Error('nf'),
      event: { url: new URL('http://x/missing'), route: { id: null } },
      status: 404,
      message: 'Not Found'
    } as never);
    expect(r).toBeDefined();
  });

  it('swallows non-Error throwable', async () => {
    const { handleError } = await import('./hooks.client');
    expect(() => 
      handleError({ error: 'str', event: {}, status: 500, message: '' } as never)
    ).not.toThrow();
  });

  // Add branch for each status code arm in the actual file
});
```

**Note:** Read the actual `handleError` function to enumerate all status/branch paths before finalizing tests.

---

## 1b. `src/routes/account/+page.server.ts` — `load` (CRAP 182)

**Issue:** CC 13 / cog 6 = shallow guards (auth checks). Zero coverage. Fix with test matrix.

**Test Plan:**
- Redirect when no auth user
- Return user + congregations when authenticated
- Handle PocketBase rejection gracefully
- Test each guard branch

**Implementation:**

```ts
// src/routes/account/+page.server.test.ts
import { describe, it, expect } from 'vitest';
import * as mod from './+page.server';

// Use helper factories (see Tier 3a)
import { makeEvent } from '$test/helpers/factories';

function unauthApi() {
  // Return PocketBase client mock with no user
  return { authStore: { model: null } };
}

function authApi(userId: string) {
  // Return PocketBase client mock with authenticated user
  return { authStore: { model: { id: userId } } };
}

describe('account/+page.server.ts load', () => {
  it('redirects when no auth user', async () => {
    const event = makeEvent({ locals: { api: unauthApi() } });
    await expect(mod.load(event as never)).rejects.toMatchObject({ status: 302 });
  });

  it('returns user + congregations when authed', async () => {
    const event = makeEvent({ locals: { api: authApi('user123') } });
    const data = await mod.load(event as never);
    expect(data).toHaveProperty('user');
    expect(data).toHaveProperty('congregations');
  });

  it('handles pb getList rejection (network error)', async () => {
    const mockApi = authApi('user123');
    mockApi.collection = () => ({
      getFullList: () => Promise.reject(new Error('network'))
    });
    const event = makeEvent({ locals: { api: mockApi } });
    await expect(mod.load(event as never)).rejects.toBeDefined();
  });

  it('handles user without congregation permission', async () => {
    const event = makeEvent({ locals: { api: authApi('user123') } });
    // Mock response that returns empty list
    const data = await mod.load(event as never);
    expect(data.congregations).toEqual([]);
  });
});
```

---

## 1c. `src/routes/admin/pages/[id]/+page.server.ts` + `new/+page.server.ts` — `save` (CRAP 160 + 106)

**Issue:** CC 25/20, cog 24/18. Both files duplicate validation + error mapping. Refactor into shared module, then test.

**Strategy:**
1. Extract pure validation + error mapping functions to `_shared.ts`
2. Collapse both actions to thin orchestration
3. Test helpers exhaustively (no MSW needed)

**Implementation:**

```ts
// src/routes/admin/pages/_shared.ts (NEW)
import { fail } from '@sveltejs/kit';

export interface ParsedPage {
  title: string;
  slug: string;
  content: string;
  locale: string;
  published: boolean;
}

/**
 * Pure validation: parse FormData → ParsedPage.
 * Throws nothing, returns discriminated result.
 * Unit-testable without SvelteKit context.
 */
export function parsePageForm(fd: FormData):
  | { ok: true; data: ParsedPage }
  | { ok: false; error: string; field?: string } {
  
  const title = (fd.get('title') ?? '').toString().trim();
  if (!title) return { ok: false, error: 'title_required', field: 'title' };

  const slug = (fd.get('slug') ?? '').toString().trim();
  if (!/^[a-z0-9-]+$/.test(slug)) {
    return { ok: false, error: 'slug_invalid', field: 'slug' };
  }

  // Add schema validation if pageSchema exists
  // const parsed = pageSchema.safeParse(Object.fromEntries(fd));
  // if (!parsed.success) {
  //   return { 
  //     ok: false, 
  //     error: 'validation', 
  //     field: parsed.error.issues[0]?.path[0]?.toString() 
  //   };
  // }

  return {
    ok: true,
    data: {
      title,
      slug,
      content: (fd.get('content') ?? '').toString(),
      locale: (fd.get('locale') ?? 'en').toString(),
      published: fd.get('published') === 'on'
    }
  };
}

/**
 * Pure error mapping: PocketBase ClientResponseError → SvelteKit fail payload.
 * Extracts field errors and maps HTTP status correctly.
 */
export function pbErrorToFail(e: unknown): ReturnType<typeof fail> {
  const status = (e as { status?: number })?.status ?? 500;
  const data = (e as { data?: { data?: Record<string, { message: string }> } })?.data?.data ?? {};
  const field = Object.keys(data)[0];

  return fail(status === 0 ? 502 : status, {
    error: field ? data[field].message : 'save_failed',
    field
  });
}
```

```ts
// src/routes/admin/pages/_shared.test.ts (NEW)
import { describe, it, expect } from 'vitest';
import { parsePageForm, pbErrorToFail } from './_shared';

// Helper: build FormData from object
const formData = (o: Record<string, string>) => {
  const f = new FormData();
  for (const [k, v] of Object.entries(o)) f.set(k, v);
  return f;
};

describe('parsePageForm', () => {
  it('rejects empty title', () => {
    const r = parsePageForm(formData({ slug: 'x', content: 'c' }));
    expect(r).toMatchObject({ ok: false, field: 'title', error: 'title_required' });
  });

  it('rejects invalid slug (uppercase, spaces, special chars)', () => {
    const r = parsePageForm(formData({ title: 'T', slug: 'Bad Slug!', content: 'c' }));
    expect(r).toMatchObject({ ok: false, field: 'slug', error: 'slug_invalid' });
  });

  it('accepts valid page, defaults locale to "en" and published to false', () => {
    const r = parsePageForm(formData({
      title: 'My Page',
      slug: 'my-page',
      content: 'Page content'
    }));
    expect(r).toMatchObject({
      ok: true,
      data: {
        title: 'My Page',
        slug: 'my-page',
        locale: 'en',
        published: false
      }
    });
  });

  it('published "on" → true', () => {
    const r = parsePageForm(formData({
      title: 'T',
      slug: 'good',
      content: 'c',
      published: 'on'
    }));
    expect(r.ok && r.data.published).toBe(true);
  });

  it('trims title and slug whitespace', () => {
    const r = parsePageForm(formData({
      title: '  Trimmed  ',
      slug: '  trimmed-slug  ',
      content: 'c'
    }));
    expect(r.ok && r.data.title).toBe('Trimmed');
    expect(r.ok && r.data.slug).toBe('trimmed-slug');
  });
});

describe('pbErrorToFail', () => {
  it('maps PocketBase 400 field error → fail with field', () => {
    const e = {
      status: 400,
      data: { data: { slug: { message: 'slug already in use' } } }
    };
    const r = pbErrorToFail(e);
    expect(r.status).toBe(400);
    expect(r.data).toMatchObject({
      error: 'slug already in use',
      field: 'slug'
    });
  });

  it('maps PocketBase status 0 (network error) → 502', () => {
    const e = { status: 0 };
    const r = pbErrorToFail(e);
    expect(r.status).toBe(502);
  });

  it('defaults unknown error → 500 with generic message', () => {
    const r = pbErrorToFail(new Error('unknown'));
    expect(r.status).toBe(500);
    expect(r.data).toMatchObject({ error: 'save_failed' });
  });

  it('handles missing field errors gracefully', () => {
    const e = { status: 500, data: { data: {} } };
    const r = pbErrorToFail(e);
    expect(r.status).toBe(500);
    expect(r.data.error).toBe('save_failed');
  });
});
```

```ts
// src/routes/admin/pages/[id]/+page.server.ts (REFACTORED)
import type { PageServerLoad, Actions } from './$types';
import { redirect } from '@sveltejs/kit';
import { parsePageForm, pbErrorToFail } from '../_shared';

export const load: PageServerLoad = async (event) => {
  // Guard: require auth
  if (!event.locals.user) throw redirect(302, '/login');

  // Guard: require admin role
  if (event.locals.user.role !== 'admin') throw redirect(302, '/');

  const page = await event.locals.api.collection('pages').getOne(event.params.id);
  return { page };
};

export const actions: Actions = {
  async save(event) {
    if (!event.locals.user) throw redirect(302, '/login');

    const fd = await event.request.formData();
    const parsed = parsePageForm(fd);

    // Return validation errors early
    if (!parsed.ok) {
      return { ok: false, error: parsed.error, field: parsed.field };
    }

    try {
      const updated = await event.locals.api
        .collection('pages')
        .update(event.params.id, parsed.data);
      return { ok: true, id: updated.id };
    } catch (e) {
      event.locals.captureException?.(e);
      return pbErrorToFail(e);
    }
  }
};
```

```ts
// src/routes/admin/pages/new/+page.server.ts (REFACTORED)
import type { PageServerLoad, Actions } from './$types';
import { redirect } from '@sveltejs/kit';
import { parsePageForm, pbErrorToFail } from '../_shared';

export const load: PageServerLoad = async (event) => {
  if (!event.locals.user) throw redirect(302, '/login');
  if (event.locals.user.role !== 'admin') throw redirect(302, '/');
  return {};
};

export const actions: Actions = {
  async save(event) {
    if (!event.locals.user) throw redirect(302, '/login');

    const fd = await event.request.formData();
    const parsed = parsePageForm(fd);

    if (!parsed.ok) {
      return { ok: false, error: parsed.error, field: parsed.field };
    }

    try {
      const created = await event.locals.api
        .collection('pages')
        .create(parsed.data);
      return { ok: true, id: created.id };
    } catch (e) {
      event.locals.captureException?.(e);
      return pbErrorToFail(e);
    }
  }
};
```

**Impact:**
- Kills 2 critical CRAP scores (160 + 106)
- Eliminates validation + error handling duplication
- `_shared.ts` + tests: 50 LOC test, pure + fast
- Both actions drop from CC 25/20 → CC 6/3

---

## 1d. `docker/scripts/bootstrap.mjs` — `createCapKeys` (CRAP 506)

**Issue:** CC 22 / cog 34 / 60+ LOC. Real tangle. Untested infra script. Split into pure steps.

**⚠️ WARNING:** This function touches secret rotation. Refactor is behavior-preserving but **verify diff manually before merge** and test only creation/rotation logic (not deletion in test).

**Strategy:**
1. Extract pure planning (config → desired cap-keys)
2. Extract pure diffing (existing vs desired)
3. Keep orchestration thin (no business logic in it)

**Implementation:**

```js
// docker/scripts/lib/capKeys.mjs (NEW)
/**
 * Pure: derive desired cap-key set from config.
 * No I/O, no side effects. Unit-testable.
 */
export function planCapKeys(config) {
  const out = [];
  
  for (const svc of config.services ?? []) {
    if (!svc.capabilities?.length) continue;
    
    for (const cap of svc.capabilities) {
      out.push({
        name: `${svc.name}:${cap}`,
        scope: svc.scope ?? 'default',
        rotate: Boolean(svc.rotate)
      });
    }
  }
  
  // Stable sort for reproducible output
  return out.sort((a, b) => a.name.localeCompare(b.name));
}

/**
 * Pure: diff existing vs desired → {create, rotate, prune}.
 * Returns discriminated buckets, no I/O.
 */
export function diffCapKeys(existing, desired) {
  const have = new Map(existing.map((k) => [k.name, k]));
  const want = new Map(desired.map((k) => [k.name, k]));

  const create = desired.filter((k) => !have.has(k.name));
  const rotate = desired.filter((k) => {
    const found = have.get(k.name);
    return found && k.rotate;
  });
  const prune = existing.filter((k) => !want.has(k.name));

  return { create, rotate, prune };
}
```

```js
// docker/scripts/lib/capKeys.test.mjs (NEW)
import { describe, it, expect } from 'vitest';
import { planCapKeys, diffCapKeys } from './capKeys.mjs';

describe('planCapKeys', () => {
  it('flattens service × capability, sorted by name', () => {
    const r = planCapKeys({
      services: [
        { name: 'b', capabilities: ['x'] },
        { name: 'a', capabilities: ['y', 'z'], scope: 's' }
      ]
    });
    expect(r.map(k => k.name)).toEqual(['a:y', 'a:z', 'b:x']);
    expect(r[0].scope).toBe('s');
    expect(r[1].scope).toBe('s');
  });

  it('skips services with no capabilities', () => {
    const r = planCapKeys({ services: [{ name: 'a' }] });
    expect(r).toEqual([]);
  });

  it('defaults scope to "default"', () => {
    const r = planCapKeys({ services: [{ name: 'a', capabilities: ['x'] }] });
    expect(r[0].scope).toBe('default');
  });

  it('rotate flag → boolean', () => {
    const r = planCapKeys({
      services: [{ name: 'a', capabilities: ['x'], rotate: 'any-truthy' }]
    });
    expect(r[0].rotate).toBe(true);
  });

  it('empty config → []', () => {
    expect(planCapKeys({})).toEqual([]);
    expect(planCapKeys({ services: [] })).toEqual([]);
  });
});

describe('diffCapKeys', () => {
  const want = [
    { name: 'a:x', rotate: true },
    { name: 'b:y', rotate: false }
  ];

  it('create = all desired when nothing exists', () => {
    const r = diffCapKeys([], want);
    expect(r.create).toHaveLength(2);
    expect(r.rotate).toHaveLength(0);
    expect(r.prune).toHaveLength(0);
  });

  it('rotate only when flagged AND exists', () => {
    const existing = [
      { name: 'a:x', id: '1' },
      { name: 'b:y', id: '2' }
    ];
    const r = diffCapKeys(existing, want);
    expect(r.rotate.map(k => k.name)).toEqual(['a:x']);
  });

  it('prune = orphaned existing keys', () => {
    const existing = [
      { name: 'old:key', id: '99' },
      { name: 'a:x', id: '1' }
    ];
    const r = diffCapKeys(existing, want);
    expect(r.prune.map(k => k.name)).toEqual(['old:key']);
  });

  it('no rotate when flag false', () => {
    const existing = [
      { name: 'a:x', id: '1' },
      { name: 'b:y', id: '2' }
    ];
    const want_norotate = [
      { name: 'a:x', rotate: false },
      { name: 'b:y', rotate: false }
    ];
    const r = diffCapKeys(existing, want_norotate);
    expect(r.rotate).toHaveLength(0);
  });

  it('handles duplicates in desired (should not happen, but safe)', () => {
    const r = diffCapKeys([], [
      { name: 'a:x', rotate: false },
      { name: 'a:x', rotate: true }
    ]);
    // Map dedup keeps last, so second (rotate: true) wins
    expect(r.create.filter(k => k.name === 'a:x')).toHaveLength(1);
  });
});
```

```js
// docker/scripts/bootstrap.mjs (REFACTORED — relevant section)
import { planCapKeys, diffCapKeys } from './lib/capKeys.mjs';

/**
 * Thin orchestration. All logic is in planCapKeys + diffCapKeys.
 * This function coordinates I/O only.
 */
export async function createCapKeys(pb, config, log = console) {
  const desired = planCapKeys(config);
  const existing = await pb.collection('cap_keys').getFullList();
  const { create, rotate, prune } = diffCapKeys(existing, desired);

  // Create new keys
  for (const k of create) {
    await pb.collection('cap_keys').create({
      name: k.name,
      scope: k.scope,
      secret: generateSecret()
    });
  }

  // Rotate existing keys (generate new secret)
  for (const k of rotate) {
    const existing_id = existing.find(e => e.name === k.name)?.id;
    if (existing_id) {
      await pb.collection('cap_keys').update(existing_id, {
        secret: generateSecret()
      });
    }
  }

  // Prune orphaned keys
  for (const k of prune) {
    await pb.collection('cap_keys').delete(k.id);
  }

  log.info(
    `cap-keys: created=${create.length} rotated=${rotate.length} pruned=${prune.length}`
  );

  return {
    created: create.length,
    rotated: rotate.length,
    pruned: prune.length
  };
}
```

**Manual Verification Checklist Before Merge:**
- [ ] Run `npm run docker:bootstrap -- --dry-run` and compare with previous output
- [ ] Verify cap-key names match `svc:cap` format
- [ ] Verify rotation generates new secret (check PocketBase after test)
- [ ] Verify orphaned keys are deleted only when not in new config
- [ ] Test with at least 2 config iterations to catch diff edge cases

---

## 1e. `src/routes/admin/users/[id]/+page.svelte` — Template (CRAP 110)

**Issue:** Cog 14 in markup = nested `{#if}{:else}{#each}`. Extract leaf components, test with `@testing-library/svelte`.

**Strategy:**
1. Extract repeated role badge rendering → `UserRoleBadges.svelte`
2. Extract permission check guards → `UserPermissionGuard.svelte`
3. Parent loses nesting, cog drops. Test leaves independently.

**Implementation:**

```svelte
<!-- src/routes/admin/users/[id]/UserRoleBadges.svelte (NEW) -->
<script lang="ts">
  interface Props {
    roles: string[];
  }

  let { roles }: Props = $props();
</script>

<div class="space-x-2">
  {#each roles as role (role)}
    <span class="badge badge--{role.toLowerCase()}" data-role={role}>
      {role}
    </span>
  {:else}
    <span class="badge badge--muted">no roles</span>
  {/each}
</div>

<style>
  .badge {
    @apply inline-block px-3 py-1 rounded-full text-sm font-medium;
  }
  .badge--admin {
    @apply bg-red-100 text-red-900;
  }
  .badge--editor {
    @apply bg-blue-100 text-blue-900;
  }
  .badge--viewer {
    @apply bg-gray-100 text-gray-900;
  }
  .badge--muted {
    @apply bg-gray-50 text-gray-500 italic;
  }
</style>
```

```ts
// src/routes/admin/users/[id]/UserRoleBadges.test.ts (NEW)
import { render, screen } from '@testing-library/svelte';
import { describe, it, expect } from 'vitest';
import UserRoleBadges from './UserRoleBadges.svelte';

describe('UserRoleBadges', () => {
  it('renders each role as a badge', () => {
    render(UserRoleBadges, { roles: ['admin', 'editor'] });
    expect(screen.getByText('admin')).toBeInTheDocument();
    expect(screen.getByText('editor')).toBeInTheDocument();
  });

  it('empty roles → muted fallback', () => {
    render(UserRoleBadges, { roles: [] });
    expect(screen.getByText('no roles')).toBeInTheDocument();
  });

  it('applies data-role attribute for styling hooks', () => {
    render(UserRoleBadges, { roles: ['admin'] });
    expect(screen.getByRole('generic', { hidden: true }).querySelector('[data-role="admin"]')).toBeTruthy();
  });

  it('single role rendering', () => {
    const { container } = render(UserRoleBadges, { roles: ['viewer'] });
    expect(container.querySelectorAll('.badge')).toHaveLength(1);
  });

  it('many roles (performance check)', () => {
    const roles = Array.from({ length: 50 }, (_, i) => `role-${i}`);
    const { container } = render(UserRoleBadges, { roles });
    expect(container.querySelectorAll('.badge')).toHaveLength(50);
  });
});
```

```svelte
<!-- src/routes/admin/users/[id]/+page.svelte (SIMPLIFIED) -->
<script lang="ts">
  import UserRoleBadges from './UserRoleBadges.svelte';
  import type { PageData } from './$types';

  interface Props {
    data: PageData;
  }

  let { data }: Props = $props();
</script>

<div class="user-details">
  <h1>{data.user.name}</h1>
  
  <section>
    <h2>Roles</h2>
    <UserRoleBadges roles={data.user.roles} />
  </section>

  {#if data.user.roles.includes('admin')}
    <section>
      <h2>Admin Settings</h2>
      <!-- Admin-only content -->
    </section>
  {/if}
</div>
```

**Impact:**
- Template cog drops from 14 → 5
- Each component testable independently
- Reusable `UserRoleBadges` in other contexts

---

## 1f. `vite.config.ts` — Config Ignore

**Issue:** `default` export (CC 10) is conditional plugin array. Config files are not application code. Exempt from analysis.

**Fix:** Add fallow.json ignore pattern.

```jsonc
// fallow.json (ADD to health.ignore)
{
  "health": {
    "ignore": [
      "vite.config.ts",
      "vite.config.js",
      "svelte.config.js",
      "tailwind.config.ts",
      "**/*.config.{ts,js,mjs,cjs}",
      "vitest.config.ts"
    ]
  }
}
```

**Impact:** Instantly drops ~3 false-positive "critical" findings. Real critical count: 6 → 4.

---

## TIER 2 — High Complexity (18 functions with coverage)

These have tests already → CRAP lower, but cog complexity real. Refactor for maintainability, not coverage.

### Strategy: Guard Clauses + Lookup Tables

**Guard Clauses:** Replace nested `if` with early returns.

```ts
// BEFORE: cog 18
if (user) {
  if (user.verified) {
    if (congregation) {
      // ... 10 levels deeper
    } else {
      // ...
    }
  } else {
    // ...
  }
} else {
  // ...
}

// AFTER: cog 5
if (!user) throw redirect(302, '/login');
if (!user.verified) throw redirect(302, '/verify');
if (!congregation) return { user, congs: [] };

// Main logic starts here, flat
```

**Lookup Tables:** Replace status/role switch statements.

```ts
// BEFORE
const label = user.role === 'admin' ? 'Administrator'
  : user.role === 'editor' ? 'Editor'
  : user.role === 'viewer' ? 'Viewer'
  : 'Unknown';

// AFTER
const roleLabels = {
  admin: 'Administrator',
  editor: 'Editor',
  viewer: 'Viewer'
};
const label = roleLabels[user.role] ?? 'Unknown';
```

### Action Items (18 functions)

1. **List all 18 high-cog functions** from fallow output
2. **For each:**
   - Apply guard clause pattern (flip nested ifs)
   - Extract lookup tables for status/role/locale maps
   - Collapse long else chains
3. **Re-run** `fallow health` after each refactor
4. **Update test snapshots** (coverage exists, just complexity drops)
5. **Target:** Avg cog < 12 (current avg likely 15+)

No code examples needed — pattern is mechanical and applies uniformly.

---

## TIER 3 — Deduplication (22 groups, 10.4%)

### 3a. Form Action Dedup (SOLVED by 1c)

Both `pages/new` and `pages/[id]` `save` actions now call shared `parsePageForm` + `pbErrorToFail`. Dup eliminated.

### 3b. Test Boilerplate Factory

Extract shared factories to eliminate copy-paste in 86 test files.

```ts
// src/test/helpers/factories.ts (NEW)
import type { RequestEvent } from '@sveltejs/kit';

/**
 * Create minimal SvelteKit RequestEvent for testing.
 * Override specific properties as needed.
 */
export function makeEvent(over: Partial<RequestEvent> = {}): RequestEvent {
  return {
    url: new URL('http://localhost/test'),
    params: {},
    locals: {} as Record<string, any>,
    request: new Request('http://localhost/test'),
    getClientAddress: () => '127.0.0.1',
    platform: undefined,
    isDataRequest: false,
    route: { id: '/test' },
    cookies: {
      get: () => undefined,
      set: () => {},
      delete: () => {},
      serialize: () => ''
    },
    ...over
  } as RequestEvent;
}

/**
 * Build FormData from object for test assertions.
 */
export function formData(record: Record<string, string | string[]>): FormData {
  const fd = new FormData();
  for (const [k, v] of Object.entries(record)) {
    if (Array.isArray(v)) {
      for (const item of v) fd.append(k, item);
    } else {
      fd.set(k, v);
    }
  }
  return fd;
}

/**
 * Mock PocketBase API with auth context.
 */
export function mockPbApi(userId?: string) {
  return {
    authStore: {
      model: userId ? { id: userId, email: 'test@test.local' } : null,
      isValid: !!userId
    },
    collection: (name: string) => ({
      getFullList: async () => [],
      getOne: async (id: string) => ({ id, name_en: 'test' }),
      create: async (data: any) => ({ id: 'new-id', ...data }),
      update: async (id: string, data: any) => ({ id, ...data }),
      delete: async (id: string) => true
    })
  };
}
```

**Usage in tests:**

```ts
import { makeEvent, formData, mockPbApi } from '$test/helpers/factories';

it('save creates page', async () => {
  const event = makeEvent({ locals: { api: mockPbApi('user123') } });
  // ...
});
```

**Apply to all 86 test files:** Replace inline `new FormData()`, `new URL()`, `{ request: new Request() }` with imports.

### 3c. Svelte Component Snippet Dedup

If multiple forms/pages use the same `{#snippet field(name, label)}` block:

```svelte
<!-- BEFORE: repeated in 5 files -->
{#snippet formField(name, label)}
  <div class="form-group">
    <label for={name}>{label}</label>
    <input id={name} name={name} type="text" />
  </div>
{/snippet}

<!-- AFTER: $lib/ui/FormField.svelte -->
<script lang="ts">
  interface Props {
    name: string;
    label: string;
  }
  let { name, label }: Props = $props();
</script>

<div class="form-group">
  <label for={name}>{label}</label>
  <slot {name} />
</div>
```

Import + use:

```svelte
<import FormField from '$lib/ui/FormField.svelte';

<FormField name="title" label="Page Title">
  <input id="title" name="title" type="text" />
</FormField>
```

**Search pattern:** `{#snippet` across entire codebase. Extract top 3-5 repeated snippets to `$lib/ui/`.

---

## Execution Checklist

### Phase 1: Foundation (Day 1)

- [ ] Create `FALLOW-REMEDIATIONS.md` (this file)
- [ ] Update `fallow.json` with config ignore patterns
- [ ] Re-run `fallow health --json` (should drop critical count to ~4)
- [ ] Create `src/test/helpers/factories.ts`

### Phase 2: Critical Tier 1 (Days 2–4)

- [ ] Create `src/routes/admin/pages/_shared.ts` + tests
- [ ] Refactor `pages/[id]/+page.server.ts` and `pages/new/+page.server.ts`
- [ ] Create `hooks.client.test.ts` (test only, no refactor)
- [ ] Create `account/+page.server.test.ts` (test only, no refactor)
- [ ] Create `docker/scripts/lib/capKeys.mjs` + tests
- [ ] **Manual verification:** Run bootstrap with --dry-run, compare output
- [ ] Refactor `bootstrap.mjs` to call new `capKeys` module
- [ ] Create `UserRoleBadges.svelte` + tests
- [ ] Refactor `admin/users/[id]/+page.svelte`

### Phase 3: Tier 2 Refactoring (Days 5–6)

- [ ] Extract all 18 high-cog functions to list
- [ ] Apply guard-clause pattern to each (mechanical)
- [ ] Apply lookup table pattern where applicable
- [ ] Re-run `fallow health` after each, confirm cog drops
- [ ] Update test snapshots (no new tests, just coverage exists)

### Phase 4: Deduplication (Day 7)

- [ ] Scan test files for `new FormData()` / `new URL()` → replace with factories
- [ ] Scan Svelte files for repeated `{#snippet` blocks → hoist to `$lib/ui/`
- [ ] Run global find-replace on test boilerplate patterns

### Phase 5: Verification & Cleanup (Day 8)

- [ ] Run full test suite: `pnpm vitest run` (expect ~260+ passing)
- [ ] Run fallow sweep:
  ```bash
  pnpm fallow check     # expect: 0 issues
  pnpm fallow health    # expect: 0 critical, avg cog < 12
  pnpm fallow dupes     # expect: < 4%
  ```
- [ ] Code review: spot-check Tier 2 refactors
- [ ] Commit & PR

---

## Verification Targets

| Metric | Baseline | Target | Command |
|--------|----------|--------|---------|
| Critical CRAP | 7 | 0 | `pnpm fallow health` |
| Avg Cog (High) | ~15 | <12 | `pnpm fallow health` |
| Duplication | 10.4% | <4% | `pnpm fallow dupes` |
| Dead Code | 0 | 0 | `pnpm fallow check` |
| Tests Passing | 235 | 260+ | `pnpm vitest run` |

---

## Notes

- **Behavior-preserving:** All refactors are mechanical (extract + call). No logic changes.
- **Bootstrap rotation:** Only pure cores tested. Manual verification required before merge.
- **Config ignore:** Drops noise instantly. Do first.
- **Guards + lookups:** Mechanical pattern, apply uniformly across 18 fns. No special cases.
- **Factories:** Reduces test LOC by ~30% once applied everywhere.

---

**Next:** Load `context7` or `find-docs` to verify SvelteKit RequestEvent shape for `makeEvent` factory if uncertain.

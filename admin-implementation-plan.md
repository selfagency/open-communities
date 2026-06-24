# Admin Backend Implementation Plan

## Overview

Build a full admin backend within the SvelteKit webapp for managing congregations, users, content, and analytics. All admin routes live under `/admin/` and are guarded by `client?.admin === true`.

---

## Phase 1: Admin Infrastructure

### 1.1 Admin Layout (`src/routes/admin/+layout.svelte`)

```svelte
<script lang="ts">
  import { page } from '$app/state';
  import { goto } from '$app/navigation';
  import { m } from '$lib/paraglide/messages';
  import * as Sidebar from '$lib/components/ui/sidebar';
  import * as Breadcrumb from '$lib/components/ui/breadcrumb';
  import { Separator } from '$lib/components/ui/separator';

  const navItems = [
    { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/admin/congregations', label: 'Congregations', icon: Building2 },
    { href: '/admin/approvals', label: 'Approvals', icon: ClipboardCheck },
    { href: '/admin/users', label: 'Users', icon: Users },
    { href: '/admin/analytics', label: 'Analytics', icon: BarChart3 },
    { href: '/admin/pages', label: 'Pages', icon: FileText },
    { href: '/admin/settings', label: 'Settings', icon: Settings },
  ];
</script>

<Sidebar.Provider>
  <Sidebar.Root>
    <Sidebar.Inset>
      <header class="flex h-16 shrink-0 items-center gap-2 border-b px-4">
        <Sidebar.Trigger class="-ml-1" />
        <Separator orientation="vertical" class="mr-2 h-4" />
        <Breadcrumb.Root>
          <Breadcrumb.List>
            <Breadcrumb.Item><Breadcrumb.Link href="/admin">Admin</Breadcrumb.Link></Breadcrumb.Item>
            <Breadcrumb.Separator />
            <Breadcrumb.Item><Breadcrumb.Page>{page.data.title}</Breadcrumb.Page></Breadcrumb.Item>
          </Breadcrumb.List>
        </Breadcrumb.Root>
      </header>
      <main class="flex flex-1 flex-col gap-4 p-4">
        {@render children?.()}
      </main>
    </Sidebar.Inset>
  </Sidebar.Root>
</Sidebar.Provider>
```

### 1.2 Admin Layout Server (`src/routes/admin/+layout.server.ts`)

```typescript
import { redirect } from '@sveltejs/kit';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async (event) => {
  const { locals } = event;
  const client = locals.api?.authStore?.record;

  if (!client?.admin) {
    throw redirect(303, '/');
  }

  return {
    title: 'Dashboard',
    user: client,
  };
};
```

### 1.3 Admin Dashboard (`src/routes/admin/+page.server.ts`)

```typescript
import type { PageServerLoad } from './$types';
import { withRetry } from '$lib/server/api';

export const load: PageServerLoad = async (event) => {
  const { api } = event.locals;

  const [congregationCount, userCount, pendingCount] = await Promise.all([
    withRetry(() => api.collection('congregationMeta').getList(1, 1, { filter: 'visible=true' })),
    withRetry(() => api.collection('users').getList(1, 1)),
    withRetry(() => api.collection('congregationMeta').getList(1, 1, { filter: 'visible=false' })),
  ]);

  return {
    stats: {
      congregations: congregationCount.totalItems,
      users: userCount.totalItems,
      pendingApprovals: pendingCount.totalItems,
    },
  };
};
```

### 1.4 Admin Dashboard (`src/routes/admin/+page.svelte`)

```svelte
<script lang="ts">
  import { Card, CardContent, CardHeader, CardTitle } from '$lib/components/ui/card';
  import { m } from '$lib/paraglide/messages';

  let { data } = $props();
</script>

<div class="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
  <Card>
    <CardHeader><CardTitle>Congregations</CardTitle></CardHeader>
    <CardContent><p class="text-3xl font-bold">{data.stats.congregations}</p></CardContent>
  </Card>
  <Card>
    <CardHeader><CardTitle>Users</CardTitle></CardHeader>
    <CardContent><p class="text-3xl font-bold">{data.stats.users}</p></CardContent>
  </Card>
  <Card>
    <CardHeader><CardTitle>Pending Approvals</CardTitle></CardHeader>
    <CardContent><p class="text-3xl font-bold">{data.stats.pendingApprovals}</p></CardContent>
  </Card>
</div>
```

---

## Phase 2: Congregation Management

### 2.1 Congregation List (`/admin/congregations`)

Uses shadcn-svelte `Data Table` component with:
- Columns: Name, City, State, Denomination, Owner, Status (visible/hidden), Created, Actions
- Server-side pagination via `api.collection('congregationMeta').getList()`
- Filters: status toggle, denomination select, search input
- Row actions dropdown: Edit, Toggle visibility, Delete

**Server:**
```typescript
import type { PageServerLoad } from './$types';
import { withRetry } from '$lib/server/api';

export const load: PageServerLoad = async ({ locals, url }) => {
  const { api } = locals;
  const page = Number(url.searchParams.get('page') || '1');
  const perPage = 20;
  const search = url.searchParams.get('q') || '';
  const status = url.searchParams.get('status') || 'all';

  let filter = '';
  if (status === 'visible') filter = 'visible=true';
  else if (status === 'hidden') filter = 'visible=false';

  const result = await withRetry(() =>
    api.collection('congregationMeta').getList(page, perPage, {
      filter: filter || undefined,
      sort: '-created',
    })
  );

  return { congregations: result.items, total: result.totalItems, page, perPage };
};
```

### 2.2 Approval Queue (`/admin/approvals`)

Two tabs: **New Submissions** (visible=false, no owner) and **Pending Changes** (visible=false, has owner).

Each item shows congregation name, submitter info, date. Actions: Approve (set visible=true), Reject (send email).

**Server action for approval:**
```typescript
export const actions = {
  approve: async ({ locals, request }) => {
    const { api } = locals;
    const form = await request.formData();
    const id = form.get('id') as string;

    await api.collection('congregations').update(id, { visible: true });

    // Send approval email to owner
    const meta = await api.collection('congregationMeta').getOne(id);
    if (meta.owner) {
      const owner = await api.collection('users').getOne(meta.owner);
      await transactionalMail({
        email: owner.email,
        name: owner.name || '',
        subject: 'Your congregation has been approved',
        message: `Your congregation "${meta.name}" has been approved and is now visible on the directory.`,
      });
    }

    return { success: true };
  },

  reject: async ({ locals, request }) => {
    const { api } = locals;
    const form = await request.formData();
    const id = form.get('id') as string;
    const reason = form.get('reason') as string;

    // Send rejection email
    const meta = await api.collection('congregationMeta').getOne(id);
    if (meta.owner) {
      const owner = await api.collection('users').getOne(meta.owner);
      await transactionalMail({
        email: owner.email,
        name: owner.name || '',
        subject: 'Your congregation submission',
        message: `Your congregation "${meta.name}" was not approved. Reason: ${reason || 'Not specified'}`,
      });
    }

    // Delete the congregation and its child records
    await api.collection('congregations').delete(id);

    return { success: true };
  },
};
```

---

## Phase 3: User Management

### 3.1 User List (`/admin/users`)

Data table with columns: Name, Email, Verified, Admin, Congregation, Language, Created.
Filters: admin/non-admin, verified/unverified, search.
Server-side pagination.

**Server:**
```typescript
import type { PageServerLoad } from './$types';
import { withRetry } from '$lib/server/api';

export const load: PageServerLoad = async ({ locals, url }) => {
  const { api } = locals;
  const page = Number(url.searchParams.get('page') || '1');
  const perPage = 20;
  const search = url.searchParams.get('q') || '';

  let filter = '';
  if (search) filter = `email~"${search}" || name~"${search}"`;

  const result = await withRetry(() =>
    api.collection('users').getList(page, perPage, {
      filter: filter || undefined,
      sort: '-created',
    })
  );

  return { users: result.items, total: result.totalItems, page, perPage };
};
```

### 3.2 User Edit (`/admin/users/[id]`)

Form with fields: Name, Email, Language (select), Admin (switch), Verified (switch).
Password management: "Send password reset" button triggers PB's password reset flow.
Danger zone: Delete user with confirmation.

**Server:**
```typescript
import { fail } from '@sveltejs/kit';
import { superValidate } from 'sveltekit-superforms';
import { zod } from 'sveltekit-superforms/adapters';
import { z } from 'zod/v4';
import type { Actions, PageServerLoad } from './$types';
import { withRetry } from '$lib/server/api';

const userEditSchema = z.object({
  name: z.string().optional(),
  email: z.email(),
  lang: z.enum(['de', 'en', 'es', 'fr', 'he', 'hu', 'pt', 'ru', 'uk']),
  admin: z.boolean().optional(),
  verified: z.boolean().optional(),
});

export const load: PageServerLoad = async ({ locals, params }) => {
  const { api } = locals;
  const user = await withRetry(() => api.collection('users').getOne(params.id));
  const form = await superValidate(user, zod(userEditSchema));
  return { form, user };
};

export const actions: Actions = {
  default: async ({ locals, request, params }) => {
    const { api } = locals;
    const form = await superValidate(request, zod(userEditSchema));
    if (!form.valid) return fail(400, { form });

    await api.collection('users').update(params.id, form.data);
    return { form };
  },

  sendPasswordReset: async ({ locals, params }) => {
    const { api } = locals;
    await api.collection('users').requestPasswordReset(params.id);
    return { success: true };
  },

  delete: async ({ locals, params }) => {
    const { api } = locals;
    // Unlink congregation if any
    const user = await api.collection('users').getOne(params.id);
    if (user.congregation) {
      await api.collection('users').update(params.id, { congregation: null });
    }
    await api.collection('users').delete(params.id);
    return { success: true };
  },
};
```

### 3.3 CSV Export (`/admin/users/export`)

```typescript
import type { RequestHandler } from './$types';
import { withRetry } from '$lib/server/api';

export const GET: RequestHandler = async ({ locals }) => {
  const { api } = locals;
  const users = await withRetry(() =>
    api.collection('users').getFullList({ sort: 'email' })
  );

  const headers = 'Name,Email,Language,Verified,Admin,Congregation,Created\n';
  const rows = users.map((u) =>
    `"${u.name || ''}","${u.email}","${u.lang || 'en'}",${u.verified},${u.admin},"${u.congregation || ''}","${u.created}"`
  ).join('\n');

  return new Response(headers + rows, {
    headers: {
      'Content-Type': 'text/csv',
      'Content-Disposition': 'attachment; filename="users.csv"',
    },
  });
};
```

---

## Phase 4: Analytics Dashboard

### 4.1 Overview (`/admin/analytics`)

Server-side PostHog queries using the existing `posthog-node` client:

```typescript
import type { PageServerLoad } from './$types';
import { PostHog } from 'posthog-node';
import { env } from '$env/dynamic/public';

const phClient = new PostHog(env.PUBLIC_POSTHOG_KEY, {
  host: env.PUBLIC_POSTHOG_HOST,
});

export const load: PageServerLoad = async () => {
  // Page views over time
  const trends = await phClient.query({
    kind: 'Trends',
    series: [{ kind: 'EventsNode', event: '$pageview', name: 'Page views' }],
    dateRange: { date_from: '-30d' },
    interval: 'day',
  });

  // User signups
  const signups = await phClient.query({
    kind: 'Trends',
    series: [{ kind: 'EventsNode', event: 'user_signed_up', name: 'Signups' }],
    dateRange: { date_from: '-30d' },
    interval: 'day',
  });

  // Congregation submissions
  const submissions = await phClient.query({
    kind: 'Trends',
    series: [{ kind: 'EventsNode', event: 'congregation_submitted', name: 'Submissions' }],
    dateRange: { date_from: '-30d' },
    interval: 'day',
  });

  return { trends, signups, submissions };
};
```

Display using shadcn-svelte `Chart` components (recharts-based).

### 4.2 Local Stats

Server endpoint `GET /admin/stats` returns cached counts:
- Total congregations, total users, pending approvals
- Cached with 5-minute TTL (reuse existing cache patterns)

---

## Phase 5: Page Management

### 5.1 Pages List (`/admin/pages`)

Data table: Title, Slug, Language, Published, Created. Actions: Edit, Toggle publish, Delete.

### 5.2 Page Edit (`/admin/pages/[id]`)

Form: Title, Slug, Content (textarea), Language (select), Published (switch).
Sister pages selector for translations.

---

## Phase 6: Settings

### 6.1 Settings Page (`/admin/settings`)

- SMTP status (connected/not connected)
- PostHog status
- Cache management: "Clear all caches" button
- System info: Node version, PB version

---

## Implementation Order

| Phase | Description | Files | Est. |
|-------|-------------|-------|------|
| 1 | Admin layout, sidebar, dashboard, auth guard | 4-5 files | 1 day |
| 2.1 | Congregation list with data table | 2-3 files | 0.5 day |
| 2.2 | Approval queue with approve/reject actions | 2-3 files | 0.5 day |
| 2.3 | Congregation edit (reuse existing form) | 1-2 files | 0.5 day |
| 3.1-3.2 | User list + edit with password reset | 4-5 files | 1 day |
| 3.3 | CSV export endpoint | 1 file | 0.25 day |
| 4 | Analytics dashboard with PostHog queries | 3-4 files | 1.5 days |
| 5 | Page management CRUD | 4-5 files | 1 day |
| 6 | Settings page | 1-2 files | 0.5 day |

**Total: ~7 days**

---

## Key Design Decisions

1. **No new PB collections needed** — Everything maps to existing schema. The `admin` boolean on `users` is sufficient.

2. **Reuse existing components** — The congregation form (`form.svelte`) works in admin mode already. Admin edit page just needs to pass `user?.admin = true`.

3. **Approval queue logic** — `visible=false` + no owner = new submission. `visible=false` + has owner = pending edit. This matches existing behavior.

4. **PostHog queries run server-side** — Admin server loads fetch PostHog data and pass to client. No PostHog JS SDK needed on admin pages.

5. **CSV export is a server endpoint** — No client-side CSV library needed. Just a `+server.ts` that queries PB and streams CSV.

6. **Permissions** — All admin routes check `client?.admin === true` in the layout server. Individual actions also verify in their handlers (defense in depth).

7. **shadcn-svelte components to install**: `sidebar`, `breadcrumb`, `data-table`, `chart`, `skeleton`, `empty`, `navigation-menu`, `date-picker`

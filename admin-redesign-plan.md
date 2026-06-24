# Admin Section Redesign Plan

## Design Inspirations

### shadcn-svelte Blocks
- **dashboard-01**: Sidebar + section cards + interactive chart + data table pattern
- **sidebar-07**: Collapsible sidebar with breadcrumb header, 3-column stat grid
- **sidebar-03**: Sidebar with submenus and breadcrumb navigation bar

### Tailwind UI (application-ui-v4)
- **Home screens**: 01-sidebar.html (sidebar + stats header + content area)
- **Stats**: 01-with-trending.html (stat cards with trend indicators), 05-with-shared-borders.html (connected card groups)
- **Sidebar navigation**: Multi-column/stacked layouts
- **Detail screens**: Sidebar + stacked content panels

### Umami Features (analytics reference)
- **Visitors**: Real-time active visitors, total visits, unique visitors
- **Pageviews**: Page views over time, top pages, entry/exit pages
- **Traffic sources**: Referrers, search engines, social, direct, campaigns
- **Locations**: Geographic distribution of visitors
- **Devices**: Browser, OS, device type breakdown
- **Events**: Custom event tracking and goals
- **Insights**: Trend comparisons (7d, 30d, 90d), period-over-period changes
- **Retention**: Returning vs new visitors

## Layout Architecture

```
┌──────────────────────────────────────────────┐
│  Sidebar (collapsible) │  Main Content Area   │
│                        │                      │
│  ┌─────────────────┐  │  ┌────────────────┐  │
│  │ Logo / Brand    │  │  │ Breadcrumb     │  │
│  ├─────────────────┤  │  ├────────────────┤  │
│  │ Dashboard       │  │  │ Page Title     │  │
│  │ Congregations   │  │  ├────────────────┤  │
│  │ Approvals       │  │  │                │  │
│  │ Users           │  │  │  Content       │  │
│  │ Analytics       │  │  │                │  │
│  │ Pages           │  │  │                │  │
│  │ Settings        │  │  └────────────────┘  │
│  ├─────────────────┤  │                      │
│  │ User profile    │  │                      │
│  └─────────────────┘  │                      │
└──────────────────────────────────────────────┘
```

## Phase 1: Layout & Navigation

### Install shadcn-svelte blocks
```bash
pnpm dlx shadcn-svelte@latest add dashboard-01
pnpm dlx shadcn-svelte@latest add sidebar-07
```

### Sidebar (`src/lib/components/admin/app-sidebar.svelte`)
- **Pattern**: shadcn dashboard-01 sidebar with inset variant
- **Nav items**: Dashboard, Congregations, Approvals, Users, Analytics, Pages, Settings
- **Submenus**: Congregations → (All, Pending, Hidden), Users → (All, Admins)
- **Collapsible**: Icons-only mode on collapse
- **User section**: Avatar + email at bottom
- **Active state**: Highlight based on current route

### Header/Breadcrumb bar
- **Pattern**: shadcn sidebar-07 header with breadcrumb
- **Left**: Sidebar toggle + breadcrumb trail (e.g., "Admin > Congregations > Edit")
- **Right**: Optional actions (search, notifications placeholder)

### Reusable layout component
```svelte
<!-- src/routes/admin/+layout.svelte -->
<Sidebar.Provider>
  <AppSidebar variant="inset" />
  <Sidebar.Inset>
    <SiteHeader breadcrumbs={...} />
    <main class="@container/main flex flex-1 flex-col gap-2">
      {@render children()}
    </main>
  </Sidebar.Inset>
</Sidebar.Provider>
```

## Phase 2: Dashboard (Home Page)

### Stat Cards (row of 4-5)
- **Pattern**: Tailwind UI "stats with shared borders" + shadcn section-cards
- **Metrics**: Total Congregations, Active (visible), Pending Approval, Total Users, New This Week
- **Trend indicators**: Up/down arrows with % change vs last period
- **Clickable**: Navigate to relevant section

### Recent Activity
- **Pattern**: Simple card with list of recent submissions and changes
- **Items**: Last 5 congregation submissions, pending changes, new users
- **Quick actions**: Approve/reject inline from dashboard

### Quick Stats Sparkline (optional)
- Tiny inline chart (7-day trend for new congregations)

## Phase 3: Analytics Dashboard

### Data Sources (PostHog)
All via `src/lib/server/posthog-api.ts` (already built):
- `GET /api/projects/:id/web_analytics/weekly_digest?days=N`
- `POST /api/projects/:id/query/` (HogQL)

### Metrics Sections
Following Umami's feature set:

**1. Overview Bar (4 stat cards with trends)**
- Unique Visitors (current + % change)
- Page Views (current + % change)
- Sessions (current + % change)
- Avg Session Duration (formatted + % change)
- Bounce Rate (% + % change)

**2. Daily Trend Chart (area chart)**
- **Pattern**: shadcn chart area-interactive
- **Data**: Daily events over 30 days (from HogQL)
- **Interaction**: Hover tooltip, date range selector (7d/30d/90d toggle)
- **Series**: Total events, with optional breakdown

**3. Traffic Sources (bar chart or table)**
- **Data**: Top sources from weekly digest
- **Type**: Horizontal bar chart or ranked table
- **Columns**: Source name, visitors, % of total

**4. Top Pages (table)**
- **Data**: Top pages from weekly digest
- **Columns**: Path, visitors, trend

**5. Geographic Distribution (future)**
- Map or table showing visitors by country (from HogQL)

## Phase 4: Congregation Management

### List View
- **Pattern**: shadcn data table with toolbar
- **Toolbar**: Search input + status filter dropdown + "Add New" button
- **Table columns**: Name, Denomination, Location, Status (visible/hidden), Owner, Actions
- **Row actions**: Edit, Toggle visibility, Delete (with confirm dialog)

### Detail/Edit View
- **Pattern**: Tailwind UI detail screen — sidebar + stacked content
- **Left**: Tabs for congregation info fields
- **Right**: Status card, owner info, quick actions
- **Sections**: Contact, Location, Services, Accessibility, Health, Security, Registration

### Approval Queue
- **Pattern**: shadcn data table + tabs (New / Pending Changes)
- **Row actions**: Approve button (green), Reject button (red) with reason dialog
- **Detail slide-over**: Click row to expand congregation preview

## Phase 5: User Management

### List View
- **Pattern**: shadcn data table
- **Table columns**: Name, Email, Language, Verified, Admin, Joined, Congregation
- **Filters**: Search, admin toggle, verified toggle

### User Detail
- **Pattern**: Tailwind UI settings screen — stacked cards
- **Card 1 — Profile**: Name, email, language (editable)
- **Card 2 — Permissions**: Admin toggle, verified badge
- **Card 3 — Password**: Send reset button
- **Card 4 — Danger Zone**: Delete user card (red, with confirm)

### CSV Export
- Button in toolbar that triggers download (already built)

## Phase 6: Page Management

### List View
- **Pattern**: shadcn data table
- **Columns**: Title, Slug, Language, Published, Updated

### Edit with Quill WYSIWYG
```bash
npm install quill
```
- **Pattern**: Tailwind UI detail screen
- **Title**: Text input
- **Slug**: Auto-generated from title, editable
- **Language**: Dropdown
- **Content**: Quill editor with full toolbar
  - Bold, italic, underline, strikethrough
  - Headings (H1-H4)
  - Links (with href input)
  - Lists (ordered, bullet)
  - Blockquote
  - Code block
  - Image upload (future)
- **Save**: Primary button, top-right sticky

### Quill Integration
```svelte
<script lang="ts">
  import Quill from 'quill';
  import 'quill/dist/quill.snow.css';
  import { onMount } from 'svelte';

  let { bind: content }: { bind: string } = $props();
  let editorEl: HTMLDivElement;
  let quill: Quill;

  onMount(() => {
    quill = new Quill(editorEl, { theme: 'snow' });
    quill.on('text-change', () => {
      content = quill.root.innerHTML;
    });
  });
</script>
```

## Phase 7: Settings

### Info Cards (grid)
- **Pattern**: Tailwind UI description lists in cards
- **Node.js**: Version display
- **SMTP**: Host, port, user (masked), status indicator
- **PostHog**: Host, project ID, connected status
- **PocketBase**: URL, version, DB size

### Cache Clear
- Button with loading state + success confirmation

## Implementation Order

| Phase | Est. Time | Files |
|-------|-----------|-------|
| 1. Layout & Navigation | 2h | `app-sidebar.svelte`, `+layout.svelte`, `site-header.svelte` |
| 2. Dashboard | 1h | `+page.svelte`, stats components |
| 3. Analytics | 2h | chart components, date range, source tables |
| 4. Congregations | 2h | data table, detail view, approval queue |
| 5. Users | 1h | data table, detail form, CSV |
| 6. Pages | 2h | data table, Quill editor integration |
| 7. Settings | 0.5h | info cards, cache button |
| **Total** | **~10h** | |

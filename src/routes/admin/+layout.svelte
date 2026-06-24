<script lang="ts">
  import { page } from '$app/state';
  import { goto } from '$app/navigation';
  import * as Sidebar from '$lib/components/ui/sidebar';
  import * as Breadcrumb from '$lib/components/ui/breadcrumb';
  import { Separator } from '$lib/components/ui/separator';
  import LayoutDashboard from '@lucide/svelte/icons/layout-dashboard';
  import Building2 from '@lucide/svelte/icons/building-2';
  import ClipboardCheck from '@lucide/svelte/icons/clipboard-check';
  import Users from '@lucide/svelte/icons/users';
  import BarChart3 from '@lucide/svelte/icons/bar-chart-3';
  import FileText from '@lucide/svelte/icons/file-text';
  import Settings from '@lucide/svelte/icons/settings';

  let { children } = $props();

  const navItems = [
    { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/admin/congregations', label: 'Congregations', icon: Building2 },
    { href: '/admin/approvals', label: 'Approvals', icon: ClipboardCheck },
    { href: '/admin/users', label: 'Users', icon: Users },
    { href: '/admin/analytics', label: 'Analytics', icon: BarChart3 },
    { href: '/admin/pages', label: 'Pages', icon: FileText },
    { href: '/admin/settings', label: 'Settings', icon: Settings },
  ];

  function isActive(href: string) {
    if (href === '/admin') return page.url.pathname === '/admin';
    return page.url.pathname.startsWith(href);
  }
</script>

<Sidebar.Provider>
  <Sidebar.Root>
    <Sidebar.Header>
      <Sidebar.Menu>
        {#each navItems as { href, label, icon: Icon } (href)}
          <Sidebar.MenuItem>
            <button
              class="flex w-full items-center gap-2 rounded-md p-2 text-sm hover:bg-sidebar-accent hover:text-sidebar-accent-foreground data-active:bg-sidebar-accent data-active:text-sidebar-accent-foreground data-active:font-medium"
              class:data-active={isActive(href)}
              onclick={() => goto(href)}
            >
              <Icon class="size-4 shrink-0" />
              <span class="truncate">{label}</span>
            </button>
          </Sidebar.MenuItem>
        {/each}
      </Sidebar.Menu>
    </Sidebar.Header>
  </Sidebar.Root>
  <Sidebar.Inset>
    <header class="flex h-16 shrink-0 items-center gap-2 border-b px-4">
      <Sidebar.Trigger class="-ml-1" />
      <Separator orientation="vertical" class="mr-2 h-4" />
      <Breadcrumb.Root>
        <Breadcrumb.List>
          <Breadcrumb.Item>
            <Breadcrumb.Link href="/admin">Admin</Breadcrumb.Link>
          </Breadcrumb.Item>
          <Breadcrumb.Separator />
          <Breadcrumb.Item>
            <Breadcrumb.Page>{page.data.title || 'Dashboard'}</Breadcrumb.Page>
          </Breadcrumb.Item>
        </Breadcrumb.List>
      </Breadcrumb.Root>
    </header>
    <main class="flex flex-1 flex-col gap-4 p-4">
      {@render children?.()}
    </main>
  </Sidebar.Inset>
</Sidebar.Provider>

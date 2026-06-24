<script lang="ts">
	import ChartAreaIcon from "@lucide/svelte/icons/chart-area";
	import ChurchIcon from "@lucide/svelte/icons/church";
	import LayoutDashboardIcon from "@lucide/svelte/icons/layout-dashboard";
	import LibraryIcon from "@lucide/svelte/icons/library";
	import SettingsIcon from "@lucide/svelte/icons/settings";
	import ThumbsUpIcon from "@lucide/svelte/icons/thumbs-up";
	import UsersIcon from "@lucide/svelte/icons/users";
	import { page } from "$app/state";
	import * as Sidebar from "$lib/components/ui/sidebar/index.js";
	import type { ComponentProps } from "svelte";

	const navItems = [
		{ title: "Dashboard", url: "/admin", icon: LayoutDashboardIcon },
		{ title: "Congregations", url: "/admin/congregations", icon: ChurchIcon },
		{ title: "Approvals", url: "/admin/approvals", icon: ThumbsUpIcon },
		{ title: "Users", url: "/admin/users", icon: UsersIcon },
		{ title: "Analytics", url: "/admin/analytics", icon: ChartAreaIcon },
		{ title: "Pages", url: "/admin/pages", icon: LibraryIcon },
		{ title: "Settings", url: "/admin/settings", icon: SettingsIcon },
	];

	function isActive(url: string) {
		if (url === "/admin") return page.url.pathname === "/admin";
		return page.url.pathname.startsWith(url);
	}

	let { ...restProps }: ComponentProps<typeof Sidebar.Root> = $props();
</script>

<Sidebar.Root collapsible="offcanvas" {...restProps}>
	<Sidebar.Header>
		<Sidebar.Menu>
			<Sidebar.MenuItem>
				<Sidebar.MenuButton class="data-[slot=sidebar-menu-button]:!p-1.5">
					{#snippet child({ props })}
						<a href="/admin" {...props}>
							<ChurchIcon class="!size-5" />
							<span class="text-base font-semibold">Open Communities</span>
						</a>
					{/snippet}
				</Sidebar.MenuButton>
			</Sidebar.MenuItem>
		</Sidebar.Menu>
	</Sidebar.Header>
	<Sidebar.Content>
		<Sidebar.Group>
			<Sidebar.GroupContent>
				<Sidebar.Menu>
					{#each navItems as item}
						<Sidebar.MenuItem>
							<Sidebar.MenuButton
								isActive={isActive(item.url)}
							>
								{#snippet child({ props })}
									<a href={item.url} {...props}>
										<item.icon class="!size-4" />
										<span>{item.title}</span>
									</a>
								{/snippet}
							</Sidebar.MenuButton>
						</Sidebar.MenuItem>
					{/each}
				</Sidebar.Menu>
			</Sidebar.GroupContent>
		</Sidebar.Group>
	</Sidebar.Content>
</Sidebar.Root>

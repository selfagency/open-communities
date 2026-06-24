<script lang="ts">
	import ChartBarIcon from "@tabler/icons-svelte/icons/chart-bar";
	import CheckIcon from "@tabler/icons-svelte/icons/circle-check";
	import BuildingIcon from "@tabler/icons-svelte/icons/building";
	import DashboardIcon from "@tabler/icons-svelte/icons/dashboard";
	import FileDescriptionIcon from "@tabler/icons-svelte/icons/file-description";
	import SettingsIcon from "@tabler/icons-svelte/icons/settings";
	import UsersIcon from "@tabler/icons-svelte/icons/users";
	import type { ComponentProps } from "svelte";
	import { page } from "$app/state";
	import * as Sidebar from "$lib/components/ui/sidebar/index.js";
	import NavMain from "./nav-main.svelte";
	import NavUser from "./nav-user.svelte";

	const adminNav = [
		{ title: "Dashboard", url: "/admin", icon: DashboardIcon },
		{ title: "Congregations", url: "/admin/congregations", icon: BuildingIcon },
		{ title: "Approvals", url: "/admin/approvals", icon: CheckIcon },
		{ title: "Users", url: "/admin/users", icon: UsersIcon },
		{ title: "Analytics", url: "/admin/analytics", icon: ChartBarIcon },
		{ title: "Pages", url: "/admin/pages", icon: FileDescriptionIcon },
		{ title: "Settings", url: "/admin/settings", icon: SettingsIcon },
	];

	let { ...restProps }: ComponentProps<typeof Sidebar.Root> = $props();
</script>

<Sidebar.Root collapsible="offcanvas" {...restProps}>
	<Sidebar.Header>
		<Sidebar.Menu>
			<Sidebar.MenuItem>
				<Sidebar.MenuButton class="data-[slot=sidebar-menu-button]:!p-1.5">
					{#snippet child({ props })}
						<a href="/admin" {...props}>
							<DashboardIcon class="!size-5" />
							<span class="text-base font-semibold">Open Communities</span>
						</a>
					{/snippet}
				</Sidebar.MenuButton>
			</Sidebar.MenuItem>
		</Sidebar.Menu>
	</Sidebar.Header>
	<Sidebar.Content>
		<NavMain items={adminNav} />
	</Sidebar.Content>
	<Sidebar.Footer>
		<NavUser />
	</Sidebar.Footer>
</Sidebar.Root>

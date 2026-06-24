<script lang="ts">
	import { page } from "$app/state";
	import * as Breadcrumb from "$lib/components/ui/breadcrumb/index.js";
	import { Separator } from "$lib/components/ui/separator/index.js";
	import * as Sidebar from "$lib/components/ui/sidebar/index.js";

	const titles: Record<string, string> = {
		"/admin": "Dashboard",
		"/admin/congregations": "Congregations",
		"/admin/approvals": "Approvals",
		"/admin/users": "Users",
		"/admin/analytics": "Analytics",
		"/admin/pages": "Pages",
		"/admin/settings": "Settings",
	};

	const currentTitle = $derived(titles[page.url.pathname] ?? "Admin");
</script>

<header
	class="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12"
>
	<div class="flex items-center gap-2 px-4">
		<Sidebar.Trigger class="-ms-1" />
		<Separator orientation="vertical" class="me-2 data-[orientation=vertical]:h-4" />
		<Breadcrumb.Root>
			<Breadcrumb.List>
				<Breadcrumb.Item class="hidden md:block">
					<Breadcrumb.Link href="/admin">Admin</Breadcrumb.Link>
				</Breadcrumb.Item>
				{#if currentTitle !== "Dashboard"}
					<Breadcrumb.Separator class="hidden md:block" />
					<Breadcrumb.Item>
						<Breadcrumb.Page>{currentTitle}</Breadcrumb.Page>
					</Breadcrumb.Item>
				{/if}
			</Breadcrumb.List>
		</Breadcrumb.Root>
	</div>
</header>

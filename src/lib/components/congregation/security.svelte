<script lang="ts">
	/* region imports */
	import SecurityIcon from 'lucide-svelte/icons/shield';
	import UnarmedIcon from 'lucide-svelte/icons/shield-ban';

	import type { SecurityRecord } from '$lib/pocketbase.d';

	import * as Tooltip from '$lib/components/ui/tooltip';
	import * as m from '$lib/paraglide/messages';
	/* endregion imports */

	/* region variables */
	// props
	const {
		mode = $bindable('mini'),
		security
	}: { mode?: 'full' | 'mini'; security: SecurityRecord } = $props();

	// constants
	/* endregion variables */
</script>

{#if mode === 'mini'}
	<div class="flex w-full flex-row items-center justify-end space-x-1 antialiased">
		{#if security.localPolice || security.privateSecurityArmed || security.clergyArmed || security.congregantsArmed}
			<Tooltip.Provider>
				<Tooltip.Root>
					<Tooltip.Trigger>
						<SecurityIcon size="18" />
						<span class="sr-only">{m['security.armedSecurity']()}</span>
					</Tooltip.Trigger>
					<Tooltip.Content>
						<span class="text-nowrap">{m['security.armedSecurity']()}</span>
					</Tooltip.Content>
				</Tooltip.Root>
			</Tooltip.Provider>
		{:else if security.privateSecurityUnarmed}
			<Tooltip.Provider>
				<Tooltip.Root>
					<Tooltip.Trigger>
						<UnarmedIcon size="18" />
						<span class="sr-only">{m['security.unarmedSecurity']()}</span>
					</Tooltip.Trigger>
					<Tooltip.Content>
						<span class="text-nowrap">{m['security.unarmedSecurity']()}</span>
					</Tooltip.Content>
				</Tooltip.Root>
			</Tooltip.Provider>
		{/if}
	</div>
{/if}

{#if mode === 'full'}
	<div class="col-span-3">
		<h2 class="label">{m['security.security']()}</h2>
	</div>
	<ul class="col-span-9 space-y-2">
		{#if security.localPolice || security.privateSecurityArmed || security.clergyArmed || security.congregantsArmed}
			<li class="flex flex-row items-start justify-start space-x-1">
				<span class="flex flex-col items-start justify-start">
					<SecurityIcon size="18" />
					<span class="sr-only">{m['security.armedSecurity']()}</span>
				</span>
				<span class="flex flex-col items-start justify-start">
					{#if security.localPolice}
						{m['security.localPolice']()}
					{/if}
					{#if security.privateSecurityArmed}
						{m['security.privateSecurityArmed']()}
					{/if}
					{#if security.clergyArmed}
						{m['security.clergyArmed']()}
					{/if}
					{#if security.congregantsArmed}
						{m['security.congregantsArmed']()}
					{/if}
				</span>
			</li>
		{/if}
		{#if security.privateSecurityUnarmed}
			<li class="flex flex-row items-start justify-start space-x-1">
				<span class="flex flex-col items-start justify-start">
					<UnarmedIcon size="18" />
					<span class="sr-only">{m['security.unarmedSecurity']()}</span>
				</span>
				<span class="flex flex-col items-start justify-start">
					{m['security.privateSecurityUnarmed']()}
				</span>
			</li>
		{/if}
		{#if security.privateSecurityUnarmed}
			<li class="flex flex-row items-start justify-start space-x-1">
				<span class="flex flex-col items-start justify-start">
					{m['security.noFirearms']()}
				</span>
			</li>
		{/if}
	</ul>
{/if}

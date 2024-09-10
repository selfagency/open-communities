<script lang="ts">
	/* region imports */
	import type { ServicesRecord } from '$lib/types';

	import { t } from '$lib/i18n';
	/* endregion imports */

	/* region variables */
	// props
	export let services: ServicesRecord | undefined;
	/* endregion variables */
</script>

<div class="col-span-3"><h2 class="label">Services</h2></div>
<div class="col-span-9">
	<ul class="w-full list-inside list-disc">
		{#if services?.inPerson}
			<li>{$t('base.services.inPerson')}</li>
		{/if}
		{#if services?.onlineOnly}
			<li>{$t('base.services.onlineOnly')}</li>
		{/if}
		{#if services?.hybrid}
			<li>{$t('base.services.hybrid')}</li>
		{/if}
		{#if services?.offsite}
			<li>{$t('base.services.offsite')}</li>
		{/if}
	</ul>
</div>

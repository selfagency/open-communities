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

<div class="col-span-3"><h2 class="label">{$t('congregation.services.services')}</h2></div>
<div class="col-span-9">
	<ul class="w-full divide-y">
		{#if services?.inPerson}
			<li>{$t('congregation.services.inPerson')}</li>
		{/if}
		{#if services?.onlineOnly}
			<li>{$t('congregation.services.onlineOnly')}</li>
		{/if}
		{#if services?.hybrid}
			<li>{$t('congregation.services.hybrid')}</li>
		{/if}
		{#if services?.offsite}
			<li>{$t('congregation.services.offsite')}</li>
		{/if}
	</ul>
</div>

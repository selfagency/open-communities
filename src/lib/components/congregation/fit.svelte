<script lang="ts">
	/* region imports */
	import type { FitRecord } from '$lib/types';

	import { t } from '$lib/i18n';
	/* endregion imports */

	/* region variables */
	// props
	export let fit: FitRecord;
	/* endregion variables */
</script>

<div class="col-span-3">
	<h2 class="font-bold">{$t('base.fit')}</h2>
</div>
<div class="col-span-9">
	<ul class="w-full list-inside list-disc">
		{#if fit.publicStatement}
			<li>{$t('base.fit.publicStatement')}</li>
		{/if}

		{#if fit.clergyMember}
			<li>{$t('base.fit.clergyMember')}</li>
		{/if}

		{#if fit.multipleClergyMembers}
			<li>{$t('base.fit.multipleClergyMembers')}</li>
		{/if}
	</ul>
</div>

<div class="col-span-3">
	<h3 class="font-bold">{$t('base.fit.flag')}</h3>
</div>
<div class="col-span-9">
	{#if fit.flag}
		{fit.flag}
	{:else}
		{$t('base.unspecified')}
	{/if}
</div>

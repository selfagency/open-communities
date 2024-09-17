<script lang="ts">
	/* region imports */
	import type { FitRecord } from '$lib/types';

	import { Separator } from '$lib/components/ui/separator';
	import { t } from '$lib/i18n';
	/* endregion imports */

	/* region variables */
	// props
	export let fit: FitRecord;
	/* endregion variables */
</script>

<div class="col-span-3">
	<h2 class="label">{$t('congregation.fit.fit')}</h2>
</div>
<div class="col-span-9">
	<ul class="w-full space-y-2">
		{#if fit.publicStatement}
			<li>{$t('congregation.fit.publicStatement')}</li>
		{/if}

		{#if fit.clergyMember}
			<li>{$t('congregation.fit.clergyMember')}</li>
		{/if}

		{#if fit.multipleClergyMembers}
			<li>{$t('congregation.fit.multipleClergyMembers')}</li>
		{/if}

		{#if fit.other}
			<li>{fit.otherText}</li>
		{/if}
	</ul>
</div>

{#if fit.flag}
	<Separator class="col-span-12" />
	<div class="col-span-3">
		<h2 class="label">{$t('congregation.fit.flag.short')}</h2>
	</div>
	<div class="col-span-9">
		{$t(`congregation.fit.flag.${fit.flag}`)}
	</div>
{/if}

<script lang="ts">
	/* region imports */
	import RabbisLogo from '$lib/assets/rabbis4ceasefire.svg?component';
	import { t } from '$lib/i18n';
	/* endregion imports */
</script>

<footer class="flex w-full flex-col items-center justify-center space-y-2 py-12">
	<div
		class="flex w-full flex-row items-center justify-center space-x-2 p-4 text-sm text-slate-700 sm:text-base"
	>
		<span class="pointer-events-none flex w-1/3 flex-row items-center justify-end"
			>{$t('common.home.project')}</span
		>
		<span class="flex flex-row items-center justify-center">
			<a href="https://rabbis4ceasefire.com/" target="_blank">
				<RabbisLogo class="w-24 fill-slate-700 hover:fill-slate-900 sm:w-36" />
			</a>
		</span>
		<span class="pointer-events-none flex w-1/3 flex-row items-center justify-start font-bold"
			>{$t('common.home.ceasefire')}
		</span>
	</div>
	<div class="flex w-full flex-row items-center justify-center">
		<span class="text-center text-xs text-slate-400 hover:text-slate-500">
			<a href="https://self.agency" target="_blank">
				{@html $t('common.home.credit', {
					thing: 'The Self Agency, LLC'
				})}
			</a>
		</span>
	</div>
</footer>

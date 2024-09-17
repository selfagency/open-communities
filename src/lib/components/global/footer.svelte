<script lang="ts">
	/* region imports */
	import RabbisLogo from '$lib/assets/rabbis4ceasefire.svg?component';
	import { t } from '$lib/i18n';
	/* endregion imports */
</script>

<footer class="flex w-full flex-col items-center justify-center space-y-2 py-12">
	<div
		class="flex w-full flex-col items-center justify-center space-y-2 p-4 text-sm text-slate-700 sm:flex-row sm:space-x-2 sm:space-y-0 sm:text-base"
	>
		<span
			class="pointer-events-none flex flex-row items-center justify-center sm:w-1/3 sm:justify-end"
			>{$t('common.home.project')}</span
		>
		<span class="flex flex-row items-center justify-center">
			<a href="https://rabbis4ceasefire.com/" target="_blank">
				<RabbisLogo class="w-24 fill-slate-700 hover:fill-slate-900 sm:w-36" />
			</a>
		</span>
		<span
			class="pointer-events-none flex flex-row items-center justify-center font-bold sm:w-1/3 sm:justify-start"
			>{$t('common.home.ceasefire')}
		</span>
	</div>
	<div class="flex w-full flex-row items-center justify-center">
		<span
			class="flex flex-col items-center justify-center space-y-2 sm:flex-row sm:space-x-4 sm:space-y-0"
		>
			<span class="flex flex-row items-center justify-center space-x-4">
				<a class="text-xs text-slate-400 hover:text-slate-500" href="/contact">
					<span>{$t('common.contact.contactUs')}</span>
				</a>
				<a class="text-xs text-slate-400 hover:text-slate-500" href="/privacy">
					<span>{$t('common.privacyPolicy')}</span>
				</a>
				<a class="text-xs text-slate-400 hover:text-slate-500" href="/terms">
					<span>{$t('common.termsOfService')}</span>
				</a>
			</span>
			<a
				class="text-xs text-slate-400 hover:text-slate-500"
				href="https://self.agency"
				target="_blank"
			>
				<span>
					{@html $t('common.home.credit', {
						thing: 'The Self Agency, LLC'
					})}
				</span>
			</a>
		</span>
	</div>
</footer>

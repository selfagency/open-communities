<script lang="ts">
	/* region imports */
	import RabbisLogo from '$lib/assets/rabbis4ceasefire.svg?component';
	import * as m from '$lib/paraglide/messages';
	/* endregion imports */
</script>

<footer class="flex w-full flex-col items-center justify-center space-y-2 py-12">
	<div
		class="flex w-full flex-col items-center justify-center space-y-2 p-4 text-sm text-slate-700 sm:flex-row sm:space-y-0 sm:space-x-2 sm:text-base"
	>
		<span
			class="pointer-events-none flex flex-row items-center justify-center sm:w-1/3 sm:justify-end"
			>{m.home.project}</span
		>
		<span class="flex flex-col items-center justify-center">
			<a href="https://rabbis4ceasefire.com/" target="_blank">
				<RabbisLogo class="w-24 fill-slate-700 hover:fill-slate-900 sm:w-36" />
				<span class="sr-only">{m.home.author}</span>
			</a>
		</span>
		<span
			class="pointer-events-none flex flex-row items-center justify-center font-bold sm:w-1/3 sm:justify-start"
			>{m.home.ceasefire}
		</span>
	</div>
	<div class="flex w-full flex-row items-center justify-center">
		<span
			class="flex flex-col items-center justify-center space-y-2 sm:flex-row sm:space-y-0 sm:space-x-4"
		>
			<span class="flex flex-row items-center justify-center space-x-4">
				<a class="text-xs text-slate-500 hover:text-slate-500" href="/contact">
					<span>{m.contact.contactUs}</span>
				</a>
				<a class="text-xs text-slate-500 hover:text-slate-500" href="/privacy">
					<span>{m.privacyPolicy}</span>
				</a>
				<a class="text-xs text-slate-500 hover:text-slate-500" href="/terms">
					<span>{m.termsOfService}</span>
				</a>
			</span>
			<a
				class="text-xs text-slate-500 hover:text-slate-500"
				href="https://self.agency"
				target="_blank"
			>
				<span>
					{@html m.home.credit({
						thing: 'The Self Agency, LLC'
					})}
				</span>
			</a>
			<a class="text-xs text-slate-500 hover:text-slate-500" href="/site-credits">
				<span>
					{m.siteCredits}
				</span>
			</a>
		</span>
	</div>
</footer>

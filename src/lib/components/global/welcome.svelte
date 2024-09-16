<script lang="ts">
	/* region imports */
	import Find from '$lib/assets/find.svg?component';
	import Inclusive from '$lib/assets/inclusive.svg?component';
	import { t } from '$lib/i18n';
	/* endregion imports */
</script>

<div
	class="relative mb-16 mt-4 flex h-48 w-full flex-row items-center justify-center rounded-xl bg-slate-200 px-12 sm:mb-24 sm:mt-12"
>
	<Find class="absolute -left-5 -top-10 w-24 fill-slate-800 sm:w-32 lg:-left-10" />
	<Inclusive class="absolute -bottom-10 -right-5 w-24 fill-slate-800 sm:w-32 lg:-right-10" />

	<h1 class="xs:text-2xl w-full text-center text-xl sm:max-w-[70%] md:text-4xl lg:text-5xl">
		{$t('common.home.blurb')}
	</h1>
</div>

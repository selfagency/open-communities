<script lang="ts">
	/* region imports */
	import Find from '$lib/assets/find.svg?component';
	import Inclusive from '$lib/assets/inclusive.svg?component';
	import { m } from '$lib/paraglide/messages';
	/* endregion imports */
</script>

<div
	class="relative mt-4 mb-16 flex h-56 w-full flex-row items-center justify-center rounded-xl bg-slate-200 px-12 sm:mt-12 sm:mb-24"
>
	<Find class="absolute -top-10 -left-5 w-24 fill-slate-800 sm:w-32 lg:-left-10" />
	<Inclusive class="absolute -right-5 -bottom-10 w-24 fill-slate-800 sm:w-32 lg:-right-10" />

	<h1
		class="pointer-events-none w-full text-center text-xl sm:max-w-[80%] sm:text-3xl md:text-4xl lg:text-5xl"
	>
		{m.home_blurb()}
	</h1>
</div>

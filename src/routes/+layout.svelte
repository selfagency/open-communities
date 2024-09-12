<script>
	/* region imports */
	import Nav from '$lib/components/nav/index.svelte';
	import { Toaster } from '$lib/components/ui/sonner';

	import '../app.css';
	/* endregion imports */
</script>

<Nav />

<main class="mt-24 w-full">
	<slot />
</main>

<Toaster />

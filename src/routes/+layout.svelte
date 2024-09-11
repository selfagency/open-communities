<script>
	/* region imports */
	import { Toaster } from '$lib/components/ui/sonner';

	import '../app.css';
	/* endregion imports */
</script>

<main class="w-full">
	<slot />
</main>

<Toaster />

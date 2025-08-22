<script lang="ts">
	import Congregation from '$lib/components/form/segments/congregation.svelte';
	import * as Accordion from '$lib/components/ui/accordion';
	export let props: any = {};
	const childProps: any = props;
</script>

<Accordion.Root type="single">
	<Congregation {...childProps} />
</Accordion.Root>

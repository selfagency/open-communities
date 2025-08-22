<script lang="ts">
    import Registration from '$lib/components/form/segments/registration.svelte';
    import * as Accordion from '$lib/components/ui/accordion';
    export let props: any = {};
    const childProps: any = props;
</script>

<Accordion.Root type="single">
    <Registration {...childProps} />
</Accordion.Root>

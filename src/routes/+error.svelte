<script lang="ts">
	/* region imports */
	import { page } from '$app/stores';
	import { t } from '$lib/i18n';
	/* endregion imports */
</script>

<svelte:head>
	<title>{$t('common.errors.error')} &middot; {$t('common.title')}</title>
</svelte:head>

<section
	class="mx-auto flex min-h-[70vh] w-full flex-col items-center justify-center space-y-4 sm:w-[50%]"
>
	{#if $page.status === 401 || $page.status === 403}
		{#await import('$lib/assets/401.svg?component') then { default: Error401 }}
			<Error401 class="mx-auto w-full fill-slate-800" />
			<h1 class="text-center text-4xl font-bold">{$t('common.errors.401')}</h1>
		{/await}
	{/if}

	{#if $page.status === 404}
		{#await import('$lib/assets/404.svg?component') then { default: Error404 }}
			<Error404 class="mx-auto w-full fill-slate-800" />
			<h1 class="text-center text-4xl font-bold">{$t('common.errors.404')}</h1>
		{/await}
	{/if}

	{#if $page.status > 500}
		{#await import('$lib/assets/500.svg?component') then { default: Error500 }}
			<Error500 class="mx-auto w-full fill-slate-800" />
			<h1 class="text-center text-4xl font-bold">{$t('common.errors.500')}</h1>
		{/await}
	{/if}
</section>

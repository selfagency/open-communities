<script lang="ts">
	/* region imports */
	import type { SuperForm } from 'sveltekit-superforms';

	import { sleep } from 'radashi';
	import { onDestroy, onMount } from 'svelte';

	import { browser } from '$app/environment';
	import { env } from '$env/dynamic/public';
	import * as Form from '$lib/components/ui/form';
	import { log } from '$lib/utils';
	// import { log } from '$lib/utils';
	/* endregion imports */

	/* region variables */
	// props
	let { form }: { form: SuperForm<any> } = $props();

	// locals
	let widget: HTMLElement | null = $state(null);
	/* endregion variables */

	/* region form */
	const { form: formData } = form;
	/* endregion form */

	/* region lifecycle */
	onMount(async () => {
		if (browser) {
			await sleep(500);
			widget = document.getElementById('captcha');
			if (widget) {
				log.debug('[captcha] Widget found, adding event listener');
				widget.addEventListener('solve', function (e) {
					log.debug('[captcha] Solve event fired:', e.detail);
					$formData.captcha = e.detail.token;
					log.debug('[captcha] Token set to:', $formData.captcha);
				});
			} else {
				log.error('[captcha] Widget not found!');
			}
		}
	});

	onDestroy(() => {
		if (widget) {
			widget.removeEventListener('solve', () => {});
		}
	});
	/* endregion lifecycle */
</script>

<Form.Field {form} name="captcha">
	<Form.Control>
		<div class="my-4 w-full">
			<cap-widget
				id="captcha"
				data-cap-api-endpoint={`${env.PUBLIC_CAPTCHA_ENDPOINT}/${env.PUBLIC_CAPTCHA_SITE_KEY}/`}
			></cap-widget>
		</div>
	</Form.Control>
	<Form.FieldErrors />
</Form.Field>

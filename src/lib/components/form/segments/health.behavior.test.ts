import { describe, expect, it, vi } from 'vitest';

import { makeMockFormProps, mockSveltekitSuperforms } from '$test/testUtils';
vi.mock('sveltekit-superforms', () => mockSveltekitSuperforms);

describe('Health segment (behavior)', () => {
	it('selects a protocol radio and updates formData', async () => {
		const { default: Host } = await import('$test/components/HealthHost.svelte');

		// ensure the bound value exists so RadioGroup.bind:value is not undefined
		const props = makeMockFormProps({ health: { otherText: '', protocol: '' } }, {});
		const target = document.createElement('div');

		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		new (Host as unknown as any)({ props: { props }, target });

		// wait a couple microtasks for Svelte to render the radios
		await Promise.resolve();
		await Promise.resolve();

		// find radio inputs or radio-group items rendered by the UI primitives
		const radios = target.querySelectorAll(
			'input[type="radio"], [role="radio"], [data-slot="radio-group-item"]'
		);
		expect(radios.length).toBeGreaterThan(0);

		// click the first radio robustly
		const first = radios[0] as HTMLElement;
		first.dispatchEvent(new MouseEvent('click', { bubbles: true }));
		await Promise.resolve();

		let latest: unknown;
		const unsub = (
			props.formData as unknown as { subscribe: (fn: (v: unknown) => void) => () => void }
		).subscribe((v) => (latest = v));
		unsub();

		const health = (latest as unknown as Record<string, unknown>).health as
			| Record<string, unknown>
			| undefined;
		expect(health?.protocol).toBeTruthy();
	});
});

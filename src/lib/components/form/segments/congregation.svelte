<script lang="ts">
	/* region imports */
	import { isEmpty } from 'radashi';
	import { getContext, onMount, untrack } from 'svelte';

	import type { CongregationMetaRecord } from '$lib/pocketbase.d';
	import type { LocationMeta, LocationRecord } from '$lib/types.d';

	import { page } from '$app/state';
	import Combobox from '$lib/components/global/combobox.svelte';
	import * as Accordion from '$lib/components/ui/accordion';
	import { Button } from '$lib/components/ui/button';
	import * as Form from '$lib/components/ui/form';
	import { Input } from '$lib/components/ui/input';
	import * as Select from '$lib/components/ui/select';
	import { Textarea } from '$lib/components/ui/textarea';
	import { Location } from '$lib/location';
	import { m } from '$lib/paraglide/messages';
	import { log } from '$lib/utils';

	import Required from '../required.svelte';
	/* endregion imports */

	/* region variables */
	// props
	let { errors, form, formData, view = $bindable() } = $props();

	// contstants
	const {
		load: loadLocation,
		setCity,
		setCountry,
		setState,
		state: location
	} = new Location({ countries: page.data.countries });

	const congregation = getContext('congregation') as CongregationMetaRecord;

	const denominations = [
		{ label: m.denomination_conservative(), value: 'conservative' },
		{
			label: m.denomination_reconstructionist(),
			value: 'reconstructionist'
		},
		{ label: m.denomination_reform(), value: 'reform' },
		{ label: m.denomination_renewal(), value: 'renewal' },
		{ label: m.denomination_humanist(), value: 'humanist' },
		{ label: m.denomination_orthodox(), value: 'orthodox' },
		{
			label: m.denomination_postDenominational(),
			value: 'postDenominational'
		},
		{
			label: m.denomination_multiDenominational(),
			value: 'multiDenominational'
		},
		{ label: m.denomination_unaffiliated(), value: 'unaffiliated' },
		{ label: m.other(), value: 'other' }
	];

	// locals
	let country: string = $state('');
	let province: string = $state('');
	let city: string = $state('');

	// methods
	async function handleCountryChange(e: CustomEvent) {
		country = e.detail.value;
		await setCountry(e.detail.value);
		province = '';
		city = '';
	}

	async function handleStateChange(e: CustomEvent) {
		province = e.detail.value;
		await setState(e.detail.value);
		city = '';
	}

	function handleCityChange(e: CustomEvent) {
		city = e.detail.value;
		setCity(e.detail.value);
	}

	// lifecycle

	onMount(async () => {
		if (congregation) {
			const location = (congregation as CongregationMetaRecord)?.location as LocationMeta;

			city = location.city?.id as string;
			province = location.state?.id as string;
			country = location.country?.id as string;

			try {
				await loadLocation({
					city,
					country,
					state: province
				} as LocationRecord);
			} catch (error) {
				log.error('Error loading location:', error);
			}
		}
	});

	// reactivity
	$effect(() => {
		if ($location?.record || congregation?.location) {
			untrack(() => {
				let loc = ($location.record || congregation.location) as LocationMeta;
				$formData.location = {
					city: loc.city?.id,
					country: loc.country?.id,
					state: loc.state?.id
				};
			});
		}
	});
</script>

<Accordion.Item value="congregation">
	<Accordion.Trigger class="flex w-full flex-row items-center justify-between">
		<div
			class="font-display flex translate-y-0.5 flex-row items-center justify-start text-lg font-normal"
		>
			<span>{m.congregation()}</span>
			{#if isEmpty($formData.name) || isEmpty($formData.clergy) || isEmpty($formData.flavor) || $errors.name || $errors.city || $errors.state || $errors.country || $errors.clergy || $errors.flavor}
				<span class="text-red-500">*</span>
			{/if}
		</div>
	</Accordion.Trigger>
	<Accordion.Content>
		<Form.Field {form} name="name">
			<Form.Control>
				{#snippet children(props)}
					<Form.Label
						>{m.name()}
						<Required set={!isEmpty($formData.name)} /></Form.Label
					>
					<Input
						{...props}
						bind:value={$formData.name}
						required
						onchange={() => {
							$formData.name = $formData.name.trim();
						}}
					/>
				{/snippet}
			</Form.Control>
			<Form.FieldErrors />
		</Form.Field>

		{#if $formData.location}
			<Form.Field {form} name="country">
				<Form.Control>
					{#snippet children(props)}
						<Form.Label>{m.location.location()}</Form_Label>
						<Combobox
							items={$location.options.countryOptions}
							{...props}
							value={country}
							placeholder={m.selectThing({
								thing: m.location.country()_toLowerCase()
							})}
							on:change={handleCountryChange}
						/>
					{/snippet}
				</Form.Control>
				<Form.FieldErrors />
			</Form.Field>
			<Form.Field {form} name="state">
				<Form.Control>
					{#snippet children(props)}
						<Form.Label>{m.location.state()}</Form_Label>
						<Combobox
							items={$location.options.stateOptions}
							{...props}
							value={province}
							placeholder={m.selectThing({
								thing: m.location.state()_toLowerCase()
							})}
							disabled={!country || !$location.options.stateOptions}
							on:change={handleStateChange}
						/>
					{/snippet}
				</Form.Control>
				<Form.FieldErrors />
			</Form.Field>
			<Form.Field {form} name="city">
				<Form.Control>
					{#snippet children(props)}
						<Form.Label>{m.location.city()}</Form_Label>
						<Combobox
							items={$location.options.cityOptions}
							{...props}
							value={city}
							placeholder={m.selectThing({
								thing: m.location.city()_toLowerCase()
							})}
							disabled={!province || !$location.options.cityOptions}
							on:change={handleCityChange}
						/>
					{/snippet}
				</Form.Control>
				<Form.FieldErrors />
			</Form.Field>
		{/if}

		<Form.Field {form} name="contactUrl">
			<Form.Control>
				{#snippet children(props)}
					<Form.Label>{m.website()}</Form_Label>
					<div class="text-xs text-slate-500">{m.http()}</div>
					<Input
						{...props}
						bind:value={$formData.contactUrl}
						onchange={() => {
							$formData.contactUrl = $formData.contactUrl.trim();
						}}
					/>
				{/snippet}
			</Form.Control>
			<Form.FieldErrors />
		</Form.Field>
		<Form.Field {form} name="clergy">
			<Form.Control>
				{#snippet children(props)}
					<Form.Label
						>{m.clergy_extended()}
						<Required set={!isEmpty($formData.clergy)} /></Form.Label
					>
					<Input {...props} bind:value={$formData.clergy} required />
				{/snippet}
			</Form.Control>
			<Form.FieldErrors />
		</Form.Field>
		<Form.Field {form} name="denomination">
			<Form.Control>
				{#snippet children(props)}
					<Form.Label>{m.denomination.extended()}</Form_Label>
					<Select.Root type="single" name="denomination" bind:value={$formData.denomination}>
						<Select.Trigger class="w-full" {...props}>
							{#if $formData?.denomination}
								{@const denom = `denomination.${$formData.denomination}`}
								{m[denom]()}
							{:else}
								{m.selectThing({ thing: m.denomination.denomination()_toLowerCase() })}
							{/if}
						</Select.Trigger>
						<Select.Content {...props}>
							{#each denominations as { label, value }, i (i)}
								<Select.Item {value}>{label}</Select.Item>
							{/each}
						</Select.Content>
					</Select.Root>
				{/snippet}
			</Form.Control>
			<Form.FieldErrors />
		</Form.Field>
		<Form.Field {form} name="flavor">
			<Form.Control
				>{#snippet children(props)}
					<Form.Label
						>{m.flavor_extended()}
						<Required set={!isEmpty($formData.flavor)} /></Form.Label
					>
					<Textarea {...props} bind:value={$formData.flavor} required />
				{/snippet}
			</Form.Control>
			<Form.FieldErrors />
		</Form.Field>
		<Form.Field {form} name="notes">
			<Form.Control
				>{#snippet children(props)}
					<Form.Label>{m.notes.extended()}</Form_Label>
					<Textarea {...props} bind:value={$formData.notes} />
				{/snippet}
			</Form.Control>
			<Form.FieldErrors />
		</Form.Field>
		<div class="mt-4 flex flex-row items-center justify-end">
			<Button variant="secondary" onclick={() => (view = 'fit')}>{m.next()} →</Button>
		</div>
	</Accordion.Content>
</Accordion.Item>

<script lang="ts">
	/* region imports */
	import { Checkbox } from '$lib/components/ui/checkbox';
	import { Label } from '$lib/components/ui/label';
	import { ScrollArea } from '$lib/components/ui/scroll-area';
	import { t } from '$lib/i18n';
	/* endregion imports */
</script>

<ScrollArea class="h-36 w-48 rounded-md border p-4">
	<div class="filter-box">
		<span class="filter-item space-x-1">
			<Checkbox id="services_inPerson" class="scale-75" />
			<Label for="services_inPerson">
				<div class="filter-label">{$t('base.services.inPerson')}</div>
			</Label>
		</span>
		<span class="filter-item space-x-1">
			<Checkbox id="services_onlineOnly" class="scale-75" />
			<Label for="services_onlineOnly">
				<div class="filter-label">{$t('base.services.onlineOnly')}</div>
			</Label>
		</span>
		<span class="filter-item space-x-1">
			<Checkbox id="services_hybrid" class="scale-75" />
			<Label for="services_hybrid">
				<div class="filter-label">{$t('base.services.hybrid')}</div>
			</Label>
		</span>
		<span class="filter-item space-x-1">
			<Checkbox id="services_offsite" class="scale-75" />
			<Label for="services_offsite">
				<div class="filter-label">{$t('base.services.offsite')}</div>
			</Label>
		</span>
		<span class="filter-item space-x-1">
			<Checkbox id="services_other" class="scale-75" />
			<Label for="services_other">
				<div class="filter-label">{$t('base.common.other')}</div>
			</Label>
		</span>
	</div>
</ScrollArea>

<ScrollArea class="h-36 w-48 rounded-md border p-4">
	<div class="filter-box">
		<span class="filter-item space-x-1">
			<Checkbox id="safety_maskingRequired" class="scale-75" />
			<Label for="safety_maskingRequired">
				<div class="filter-label">{$t('base.safety.maskingRequired')}</div>
			</Label>
		</span>
		<span class="filter-item space-x-1">
			<Checkbox id="safety_maskingRecommended" class="scale-75" />
			<Label for="safety_maskingRecommended">
				<div class="filter-label">{$t('base.safety.maskingRecommended')}</div>
			</Label>
		</span>
		<span class="filter-item space-x-1">
			<Checkbox id="safety_noGuidelines" class="scale-75" />
			<Label for="safety_noGuidelines">
				<div class="filter-label">{$t('base.safety.noGuidelines')}</div>
			</Label>
		</span>
		<span class="filter-item space-x-1">
			<Checkbox id="safety_other" class="scale-75" />
			<Label for="safety_other">
				<div class="filter-label">{$t('base.common.other')}</div>
			</Label>
		</span>
	</div>
</ScrollArea>

<style lang="postcss">
	.filter-box {
		@apply mx-auto mb-12 flex flex-col items-center justify-start space-y-2;
	}

	.filter-item {
		@apply flex w-full flex-row items-start justify-start;
	}

	.filter-label {
		@apply mt-0.5;
	}
</style>

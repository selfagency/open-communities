<script lang="ts">
	/* region imports */
	import { Checkbox } from '$lib/components/ui/checkbox';
	import { Label } from '$lib/components/ui/label';
	import { ScrollArea } from '$lib/components/ui/scroll-area';
	import { t } from '$lib/i18n';
	/* endregion imports */
</script>

<ScrollArea class="h-36 w-48 rounded-md border p-4">
	<div class="mx-auto mb-12 flex flex-col items-center justify-start space-y-1">
		<span class="flex w-full flex-row items-center justify-start space-x-1">
			<Checkbox id="services_inPerson" class="scale-75" />
			<Label for="services_inPerson">{$t('base.services.inPerson')}</Label>
		</span>
		<span class="flex w-full flex-row items-center justify-start space-x-1">
			<Checkbox id="services_onlineOnly" class="scale-75" />
			<Label for="services_onlineOnly">{$t('base.services.onlineOnly')}</Label>
		</span>
		<span class="flex w-full flex-row items-center justify-start space-x-1">
			<Checkbox id="services_hybrid" class="scale-75" />
			<Label for="services_hybrid">{$t('base.services.hybrid')}</Label>
		</span>
		<span class="flex w-full flex-row items-center justify-start space-x-1">
			<Checkbox id="services_offsite" class="scale-75" />
			<Label for="services_offsite">{$t('base.services.offsite')}</Label>
		</span>
		<span class="flex w-full flex-row items-center justify-start space-x-1">
			<Checkbox id="services_other" class="scale-75" />
			<Label for="services_other">{$t('base.common.other')}</Label>
		</span>
	</div>
</ScrollArea>

<ScrollArea class="h-36 w-48 rounded-md border p-4">
	<div class="mx-auto mb-12 flex flex-col items-center justify-start space-y-1">
		<span class="flex w-full flex-row items-center justify-start space-x-1">
			<Checkbox id="safety_maskingRequired" class="scale-75" />
			<Label for="safety_maskingRequired">{$t('base.safety.maskingRequired')}</Label>
		</span>
		<span class="flex w-full flex-row items-center justify-start space-x-1">
			<Checkbox id="safety_maskingRecommended" class="scale-75" />
			<Label for="safety_maskingRecommended">{$t('base.safety.maskingRecommended')}</Label>
		</span>
		<span class="flex w-full flex-row items-center justify-start space-x-1">
			<Checkbox id="safety_noGuidelines" class="scale-75" />
			<Label for="safety_noGuidelines">{$t('base.safety.noGuidelines')}</Label>
		</span>
		<span class="flex w-full flex-row items-center justify-start space-x-1">
			<Checkbox id="safety_other" class="scale-75" />
			<Label for="safety_other">{$t('base.common.other')}</Label>
		</span>
	</div>
</ScrollArea>

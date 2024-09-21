<script lang="ts">
	/* region imports */
	import { Badge } from '$lib/components/ui/badge';
	import { t } from '$lib/i18n';
	/* endregion imports */

	/* region variables */
	// props
	export let set: boolean = false;
	/* endregion variables */
</script>

<Badge
	variant="outline"
	class={set ? 'bg-slate-50 text-slate-500' : 'border-red-100 bg-red-50 text-red-400'}
>
	<span class="font-normal">{$t('common.required')}</span>
</Badge>

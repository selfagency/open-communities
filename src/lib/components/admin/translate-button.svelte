<script lang="ts">
import CircleCheckIcon from '@tabler/icons-svelte/icons/circle-check';
import CircleXIcon from '@tabler/icons-svelte/icons/circle-x';
import LanguageIcon from '@tabler/icons-svelte/icons/language';
import LoadingIcon from '@tabler/icons-svelte/icons/loader';
import { Button } from '$lib/components/ui/button';

let {
  langCode,
  selectedLang,
  translateStatus,
  translating,
  content,
  onTranslate
}: {
  langCode: string;
  selectedLang: string;
  translateStatus: string;
  translating: boolean;
  content: string;
  onTranslate: (lang: string) => void;
} = $props();

const icon = $derived.by(() => {
  if (selectedLang !== langCode) {
    return LanguageIcon;
  }
  switch (translateStatus) {
    case 'loading':
      return LoadingIcon;
    case 'success':
      return CircleCheckIcon;
    case 'error':
      return CircleXIcon;
    default:
      return LanguageIcon;
  }
});

const iconClass = $derived.by(() => {
  if (selectedLang !== langCode) {
    return 'mr-1.5 size-4';
  }
  switch (translateStatus) {
    case 'loading':
      return 'mr-1.5 size-4 animate-spin';
    case 'success':
      return 'mr-1.5 size-4 text-green-600';
    case 'error':
      return 'mr-1.5 size-4 text-destructive';
    default:
      return 'mr-1.5 size-4';
  }
});
</script>

<svelte:options customElement={false} />

<Button
  disabled={translating || !content}
  onclick={(e) => { e.stopPropagation(); onTranslate(langCode); }}
  size="sm"
  variant="ghost"
>
  <svelte:component aria-hidden="true" class={iconClass} this={icon} />
  Translate
</Button>

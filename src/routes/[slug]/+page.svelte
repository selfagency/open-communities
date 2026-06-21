<script lang="ts">
  /* region imports */
  import * as Card from '$lib/components/ui/card';
  import { m } from '$lib/paraglide/messages';
  // import { log } from '$lib/utils';

  import type { PageProps } from './$types';
  /* endregion imports */

  /* region variables */
  // props
  const { data }: PageProps = $props();
  /* endregion variables */
</script>

<svelte:head>
  <title>{data.content?.title ?? ''} &middot; {m.title()}</title>
</svelte:head>

{#if data.content}
  {#key data.content.id}
    <section class="max-w-3xl mx-auto">
      <Card.Root>
        <Card.Header><h1 class="text-3xl">{data.content.title}</h1></Card.Header>
        <Card.Content>
          <div class="prose max-w-none">
            <!-- eslint-disable-next-line svelte/no-at-html-tags -- sanitized by route load -->
            {@html data.content.content}
          </div>
        </Card.Content>
      </Card.Root>
    </section>
  {/key}
{/if}

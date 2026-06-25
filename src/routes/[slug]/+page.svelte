<script lang="ts">
  /* region imports */
  import DOMPurify from 'isomorphic-dompurify';
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
  <title>{data.page?.title ?? ''} &middot; {m.title()}</title>
</svelte:head>

{#if data.page}
  {#key data.page.id}
    <section class="max-w-3xl mx-auto">
      <Card.Root>
        <Card.Header><h1 class="text-3xl">{data.variant?.title || data.page.title}</h1></Card.Header>
        <Card.Content>
          {#if data.variant?.content}
            <div class="prose max-w-none">
              {@html DOMPurify.sanitize(data.variant.content as string)}
            </div>
          {:else if data.page.content}
            <div class="prose max-w-none">
              {@html DOMPurify.sanitize(data.page.content as string)}
            </div>
          {:else}
            <p class="text-muted-foreground text-sm italic">{m.noContent()}</p>
          {/if}
        </Card.Content>
      </Card.Root>
    </section>
  {/key}
{/if}

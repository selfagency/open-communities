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

  const page = $derived(data.page as Record<string, unknown> | undefined);
  const variant = $derived(data.variant as Record<string, unknown> | null);

  const title = $derived((variant?.title as string) || (page?.title as string) || '');
  const description = $derived((variant?.description as string) || (page?.description as string) || '');
  const content = $derived((variant?.content as string) || (page?.content as string) || '');
  const image = $derived((variant?.image as string) || (page?.image as string) || '');
  const imageAlt = $derived((variant?.imageAlt as string) || (page?.imageAlt as string) || '');
  const imageCaption = $derived((variant?.imageCaption as string) || (page?.imageCaption as string) || '');
  /* endregion variables */
</script>

<svelte:head>
  <title>{title} &middot; {m.title()}</title>
  {#if description}
    <meta name="description" content={description} />
  {/if}
  {#if image}
    <meta property="og:image" content={image} />
  {/if}
</svelte:head>

{#if page}
  {#key page.id}
    <section class="max-w-3xl mx-auto" itemscope itemtype="https://schema.org/WebPage">
      <Card.Root>
        <Card.Header>
          <h1 class="text-3xl" itemprop="name">{title}</h1>
          <meta itemprop="description" content={description} />
          <meta itemprop="url" content={'https://opencommunities.info/' + (page.slug as string)} />
        </Card.Header>
        {#if image}
          <figure class="px-6 pb-2">
            <img
              src={image}
              alt={imageAlt}
              class="w-full rounded-lg object-cover"
              itemprop="image"
            />
            {#if imageCaption}
              <figcaption class="text-muted-foreground mt-2 text-center text-sm italic">
                {imageCaption}
              </figcaption>
            {/if}
          </figure>
        {/if}
        <Card.Content itemprop="mainContent">
          {#if content}
            <div class="prose max-w-none">
              {@html DOMPurify.sanitize(content)}
            </div>
          {:else}
            <p class="text-muted-foreground text-sm italic">{m.noContent()}</p>
          {/if}
        </Card.Content>
      </Card.Root>
    </section>
  {/key}
{/if}

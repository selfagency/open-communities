<script lang="ts">
  import {
    BlockFormatDropDown,
    BoldButton,
    BulletDropDrownItem,
    Divider,
    DropDownAlign,
    HeadingDropDownItem,
    InsertLink,
    ItalicButton,
    NumberDropDrownItem,
    ParagraphDropDownItem,
    StrikethroughButton,
    Toolbar,
    UnderlineButton
  } from 'svelte-lexical';

  let {
    dir
  }: {
    dir?: 'rtl' | 'ltr';
  } = $props();
</script>

<Toolbar>
  {#snippet children({ editor, activeEditor, blockType })}
    <BlockFormatDropDown>
      <ParagraphDropDownItem />
      <HeadingDropDownItem headingSize="h1" />
      <HeadingDropDownItem headingSize="h2" />
      <HeadingDropDownItem headingSize="h3" />
      <NumberDropDrownItem />
      <BulletDropDrownItem />
    </BlockFormatDropDown>
    <Divider />
    <BoldButton />
    <ItalicButton />
    <UnderlineButton />
    <StrikethroughButton />
    <Divider />
    <DropDownAlign />
    <InsertLink />
  {/snippet}
</Toolbar>

import Root from './accordion.svelte';
import Content from './accordion-content.svelte';
import Item from './accordion-item.svelte';
import Trigger from './accordion-trigger.svelte';

export {
  Content as AccordionContent,
  Content,
  Item as AccordionItem,
  Item,
  //
  Root as Accordion,
  Root,
  Trigger as AccordionTrigger,
  Trigger
};

// Backwards-compatible default export for CommonJS consumers
export default {
  Accordion: Root,
  AccordionContent: Content,
  AccordionItem: Item,
  AccordionTrigger: Trigger
};

// Provide minimal exports used by the app to satisfy imports during tests
import Generic from './primitives/Generic.svelte';

const Dialog = {
  Close: Generic,
  Content: Generic,
  Description: Generic,
  Header: Generic,
  Portal: Generic,
  Root: Generic,
  Title: Generic,
  Trigger: Generic
};

const Select = {
  Content: Generic,
  Root: Generic,
  Trigger: Generic
};

const Command = {
  Dialog: Generic,
  Root: Generic
};

const Popover = {
  Content: Generic,
  Root: Generic,
  Trigger: Generic
};

const Collapsible = {
  Content: Generic,
  Root: Generic,
  Trigger: Generic
};

const RadioGroup = {
  Item: Generic,
  Root: Generic
};

const ScrollArea = {
  Root: Generic,
  Scrollbar: Generic
};

const useId = () => 'test-id';

export default {
  Collapsible,
  Command,
  Dialog,
  Popover,
  RadioGroup,
  ScrollArea,
  Select,
  useId
};

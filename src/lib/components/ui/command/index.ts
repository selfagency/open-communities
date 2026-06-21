import { Command as CommandPrimitive } from 'bits-ui';
import Root from './command.svelte';
import Dialog from './command-dialog.svelte';
import Empty from './command-empty.svelte';
import Group from './command-group.svelte';
import Input from './command-input.svelte';
import Item from './command-item.svelte';
import LinkItem from './command-link-item.svelte';
import List from './command-list.svelte';
import Separator from './command-separator.svelte';
import Shortcut from './command-shortcut.svelte';

const Loading = CommandPrimitive.Loading;

export {
  Dialog as CommandDialog,
  Dialog,
  Empty as CommandEmpty,
  Empty,
  Group as CommandGroup,
  Group,
  Input as CommandInput,
  Input,
  Item as CommandItem,
  Item,
  LinkItem as CommandLinkItem,
  LinkItem,
  List as CommandList,
  List,
  Loading as CommandLoading,
  Loading,
  //
  Root as Command,
  Root,
  Separator as CommandSeparator,
  Separator,
  Shortcut as CommandShortcut,
  Shortcut
};

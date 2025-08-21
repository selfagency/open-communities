// Provide minimal exports used by the app to satisfy imports during tests
import Generic from './primitives/Generic.svelte';

export const Dialog = {
	Close: Generic,
	Content: Generic,
	Description: Generic,
	Header: Generic,
	Portal: Generic,
	Root: Generic,
	Title: Generic,
	Trigger: Generic
};

export const Select = {
	Content: Generic,
	Root: Generic,
	Trigger: Generic
};

export const Command = {
	Dialog: Generic,
	Root: Generic
};

export const Popover = {
	Content: Generic,
	Root: Generic,
	Trigger: Generic
};

export const Collapsible = {
	Content: Generic,
	Root: Generic,
	Trigger: Generic
};

export const RadioGroup = {
	Item: Generic,
	Root: Generic
};

export const ScrollArea = {
	Root: Generic,
	Scrollbar: Generic
};

export const useId = () => 'test-id';

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

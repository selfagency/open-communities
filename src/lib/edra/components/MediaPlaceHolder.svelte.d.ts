import type { Icon } from '@lucide/svelte';
import type { Snippet } from 'svelte';
interface Props {
    icon?: typeof Icon;
    title?: string;
    onClick?: () => void;
    class?: string;
    children?: Snippet<[]>;
}
declare const MediaPlaceHolder: import("svelte").Component<Props, {}, "">;
type MediaPlaceHolder = ReturnType<typeof MediaPlaceHolder>;
export default MediaPlaceHolder;

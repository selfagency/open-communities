declare module 'pell' {
  interface PellAction {
    name: string;
    icon?: string;
    title?: string;
    result?: () => void;
  }

  interface PellEditor {
    content: HTMLElement;
  }

  interface PellOptions {
    element: HTMLElement;
    onChange: (html: string) => void;
    defaultParagraphSeparator?: string;
    styleWithCSS?: boolean;
    actions?: (string | PellAction)[];
    classes?: {
      actionbar?: string;
      button?: string;
      content?: string;
      selected?: string;
    };
  }

  export function init(options: PellOptions): PellEditor;
  export function exec(command: string, value?: string): void;
}

declare module 'pell' {
  interface PellAction {
    icon?: string;
    name: string;
    result?: () => void;
    title?: string;
  }

  interface PellEditor {
    content: HTMLElement;
  }

  interface PellOptions {
    actions?: (string | PellAction)[];
    classes?: {
      actionbar?: string;
      button?: string;
      content?: string;
      selected?: string;
    };
    defaultParagraphSeparator?: string;
    element: HTMLElement;
    onChange: (html: string) => void;
    styleWithCSS?: boolean;
  }

  export function init(options: PellOptions): PellEditor;
  export function exec(command: string, value?: string): void;
}

/* eslint-disable no-var */
declare global {
  var Wysi: (opts: {
    el: string | HTMLElement;
    darkMode?: boolean;
    height?: number;
    autoGrow?: boolean;
    autoHide?: boolean;
    onChange?: (content: string) => void;
  }) => void;
}

export {};

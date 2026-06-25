import { type ClassValue, clsx } from 'clsx';
import fstw from 'fast-string-truncated-width';
import { isEmpty, shake } from 'radashi';
import { cubicOut } from 'svelte/easing';
import type { TransitionConfig } from 'svelte/transition';
import { twMerge } from 'tailwind-merge';
import { Logger } from 'tslog';

import { dev } from '$app/environment';

export type WithElementRef<T, U extends HTMLElement = HTMLElement> = T & { ref?: null | U };

// biome-ignore lint/suspicious/noExplicitAny: conditional type utility
export type WithoutChild<T> = T extends { child?: any } ? Omit<T, 'child'> : T;
// biome-ignore lint/suspicious/noExplicitAny: conditional type utility
export type WithoutChildren<T> = T extends { children?: any } ? Omit<T, 'children'> : T;
export type WithoutChildrenOrChild<T> = WithoutChildren<WithoutChild<T>>;

/* region types */
type FlyAndScaleParams = {
  duration?: number;
  start?: number;
  x?: number;
  y?: number;
};

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
/* endregion types */

export function truncateText(text: unknown, limit = 32, ellipses = true) {
  if (!text || typeof text !== 'string') {
    return '';
  }
  const opts = { ellipsis: '...', limit };
  const sliced = fstw(text, opts);
  return `${text.slice(0, sliced.index + 1)}${ellipses && sliced.ellipsed ? opts.ellipsis : ''}`;
}

export const flyAndScale = (
  node: Element,
  params: FlyAndScaleParams = { duration: 150, start: 0.95, x: 0, y: -8 }
): TransitionConfig => {
  const style = getComputedStyle(node);
  const transform = style.transform === 'none' ? '' : style.transform;

  const scaleConversion = (valueA: number, scaleA: [number, number], scaleB: [number, number]) => {
    const [minA, maxA] = scaleA;
    const [minB, maxB] = scaleB;

    const percentage = (valueA - minA) / (maxA - minA);
    const valueB = percentage * (maxB - minB) + minB;

    return valueB;
  };

  const styleToString = (style: Record<string, number | string | undefined>): string =>
    Object.keys(style).reduce((str, key) => {
      if (style[key] === undefined) {
        return str;
      }
      return `${str}${key}:${style[key]};`;
    }, '');

  return {
    css: (t) => {
      const y = scaleConversion(t, [0, 1], [params.y ?? 5, 0]);
      const x = scaleConversion(t, [0, 1], [params.x ?? 0, 0]);
      const scale = scaleConversion(t, [0, 1], [params.start ?? 0.95, 1]);

      return styleToString({
        opacity: t,
        transform: `${transform} translate3d(${x}px, ${y}px, 0) scale(${scale})`
      });
    },
    delay: 0,
    duration: params.duration ?? 200,
    easing: cubicOut
  };
};

export const logger = new Logger(
  {
    hideLogPositionForProduction: dev,
    prettyErrorStackTemplate: '{{method}} - {{filePathWithLine}}',
    prettyErrorTemplate: '{{errorName}}: {{errorMessage}}\n{{errorStack}}',
    prettyLogTemplate: '{{yyyy}}/{{mm}}/{{dd}} {{hh}}:{{MM}}:{{ss}} {{logLevelName}} [{{name}}] ',
    type: 'pretty'
  },
  { main: true, sub: false }
);

export const log = logger.getSubLogger({ name: 'frontend' });

export const valueSet = (obj: Record<string, unknown>): boolean => {
  if (!obj || isEmpty(obj)) {
    return false;
  }
  const shaken = shake(obj, (v) => (typeof v === 'boolean' ? v !== true : isEmpty(v)));
  return !isEmpty(shaken);
};

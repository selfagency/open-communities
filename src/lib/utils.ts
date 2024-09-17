/* region imports */
import type { TransitionConfig } from 'svelte/transition';

import { type ClassValue, clsx } from 'clsx';
import fstw from 'fast-string-truncated-width';
import { cubicOut } from 'svelte/easing';
import { twMerge } from 'tailwind-merge';
import { Logger } from 'tslog';

import { dev } from '$app/environment';
/* endregion imports */

/* region types */
type FlyAndScaleParams = {
	y?: number;
	x?: number;
	start?: number;
	duration?: number;
};
/* endregion types */

export function truncateText(text: unknown, limit: number = 32, ellipses: boolean = true) {
	if (!text || typeof text !== 'string') {
		return '';
	} else {
		const opts = { limit, ellipsis: '…' };
		const sliced = fstw(text, opts);
		return `${text.slice(0, sliced.index + 1)}${ellipses && sliced.ellipsed ? opts.ellipsis : ''}`;
	}
}

export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs));
}

export const flyAndScale = (
	node: Element,
	params: FlyAndScaleParams = { y: -8, x: 0, start: 0.95, duration: 150 }
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

	const styleToString = (style: Record<string, number | string | undefined>): string => {
		return Object.keys(style).reduce((str, key) => {
			if (style[key] === undefined) return str;
			return str + `${key}:${style[key]};`;
		}, '');
	};

	return {
		duration: params.duration ?? 200,
		delay: 0,
		css: (t) => {
			const y = scaleConversion(t, [0, 1], [params.y ?? 5, 0]);
			const x = scaleConversion(t, [0, 1], [params.x ?? 0, 0]);
			const scale = scaleConversion(t, [0, 1], [params.start ?? 0.95, 1]);

			return styleToString({
				transform: `${transform} translate3d(${x}px, ${y}px, 0) scale(${scale})`,
				opacity: t
			});
		},
		easing: cubicOut
	};
};

export const logger = new Logger(
	{
		type: 'pretty',
		hideLogPositionForProduction: dev,
		prettyLogTemplate: '{{yyyy}}/{{mm}}/{{dd}} {{hh}}:{{MM}}:{{ss}} {{logLevelName}} [{{name}}] ',
		prettyErrorTemplate: '{{errorName}}: {{errorMessage}}\n{{errorStack}}',
		prettyErrorStackTemplate: '{{method}} - {{filePathWithLine}}'
	},
	{ main: true, sub: false }
);

export const log = logger.getSubLogger({ name: 'frontend' });

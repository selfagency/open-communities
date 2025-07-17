/** @type {import('tailwindcss').Config} */
import typography from '@tailwindcss/typography';
import { fontFamily } from 'tailwindcss/defaultTheme';
import animate from 'tailwindcss-animate';

export default {
	mode: 'jit',
	content: ['./src/**/*.{html,js,svelte,ts}'],
	plugins: [typography, animate],
	darkMode: 'selector',
	theme: {
		container: {
			center: true,
			padding: '2rem',
			screens: {
				'2xl': '1400px'
			}
		},
		extend: {
			screens: {
				print: { raw: 'print' },
				screen: { raw: 'screen' },
				md: '780px'
			},
			boxShadow: {
				top: '0 -4px 12px -1px rgba(0, 0, 0, 0.05), 0 -2px 10px -1px rgba(0, 0, 0, 0.03)'
			},
			colors: {
				border: 'oklch(var(--border))',
				input: 'oklch(var(--input))',
				ring: 'oklch(var(--ring))',
				background: 'oklch(var(--background))',
				foreground: 'oklch(var(--foreground))',
				primary: {
					DEFAULT: 'oklch(var(--primary))',
					foreground: 'oklch(var(--primary-foreground))'
				},
				secondary: {
					DEFAULT: 'oklch(var(--secondary))',
					foreground: 'oklch(var(--secondary-foreground))'
				},
				destructive: {
					DEFAULT: 'oklch(var(--destructive))',
					foreground: 'oklch(var(--destructive-foreground))'
				},
				muted: {
					DEFAULT: 'oklch(var(--muted))',
					foreground: 'oklch(var(--muted-foreground))'
				},
				accent: {
					DEFAULT: 'oklch(var(--accent))',
					foreground: 'oklch(var(--accent-foreground))'
				},
				popover: {
					DEFAULT: 'oklch(var(--popover))',
					foreground: 'oklch(var(--popover-foreground))'
				},
				card: {
					DEFAULT: 'oklch(var(--card))',
					foreground: 'oklch(var(--card-foreground))'
				}
			},
			borderRadius: {
				lg: `var(--radius)`,
				md: `calc(var(--radius) - 2px)`,
				sm: 'calc(var(--radius) - 4px)'
			},
			fontFamily: {
				sans: ['var(--font-sans)', ...fontFamily.sans]
			},
			keyframes: {
				'accordion-down': {
					from: { height: '0' },
					to: { height: 'var(--radix-accordion-content-height)' }
				},
				'accordion-up': {
					from: { height: 'var(--radix-accordion-content-height)' },
					to: { height: '0' }
				}
			},
			animation: {
				'accordion-down': 'accordion-down 0.2s ease-out',
				'accordion-up': 'accordion-up 0.2s ease-out'
			}
		},
		fontFamily: {
			display: [
				'Magilio',
				'Atkinson Hyperlegible',
				'Roboto',
				'sans-serif',
				'ui-sans-serif',
				'system-ui',
				'-apple-system'
			],
			sans: [
				'Atkinson Hyperlegible',
				'Roboto',
				'sans-serif',
				'ui-sans-serif',
				'system-ui',
				'-apple-system'
			],
			serif: ['serif', 'ui-serif', 'system-ui', '-apple-system']
		}
	}
};

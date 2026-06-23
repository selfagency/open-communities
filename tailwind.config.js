/** @type {import('tailwindcss').Config} */
import typography from '@tailwindcss/typography';
import { fontFamily } from 'tailwindcss/defaultTheme';
import animate from 'tailwindcss-animate';

export default {
  content: ['./src/**/*.{html,js,svelte,ts}'],
  darkMode: 'selector',
  mode: 'jit',
  plugins: [typography, animate],
  theme: {
    container: {
      center: true,
      padding: '2rem',
      screens: {
        '2xl': '1400px'
      }
    },
    extend: {
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out'
      },
      borderRadius: {
        lg: `var(--radius)`,
        md: `calc(var(--radius) - 2px)`,
        sm: 'calc(var(--radius) - 4px)'
      },
      boxShadow: {
        top: '0 -4px 12px -1px rgba(0, 0, 0, 0.05), 0 -2px 10px -1px rgba(0, 0, 0, 0.03)'
      },
      colors: {
        accent: {
          DEFAULT: 'oklch(var(--accent))',
          foreground: 'oklch(var(--accent-foreground))'
        },
        background: 'oklch(var(--background))',
        border: 'oklch(var(--border))',
        card: {
          DEFAULT: 'oklch(var(--card))',
          foreground: 'oklch(var(--card-foreground))'
        },
        destructive: {
          DEFAULT: 'oklch(var(--destructive))',
          foreground: 'oklch(var(--destructive-foreground))'
        },
        foreground: 'oklch(var(--foreground))',
        input: 'oklch(var(--input))',
        muted: {
          DEFAULT: 'oklch(var(--muted))',
          foreground: 'oklch(var(--muted-foreground))'
        },
        popover: {
          DEFAULT: 'oklch(var(--popover))',
          foreground: 'oklch(var(--popover-foreground))'
        },
        primary: {
          DEFAULT: 'oklch(var(--primary))',
          foreground: 'oklch(var(--primary-foreground))'
        },
        ring: 'oklch(var(--ring))',
        secondary: {
          DEFAULT: 'oklch(var(--secondary))',
          foreground: 'oklch(var(--secondary-foreground))'
        }
      },
      fontFamily: {
        display: ['var(--font-display)', ...fontFamily.sans],
        sans: ['var(--font-sans)', ...fontFamily.sans],
        serif: ['var(--font-serif)', ...fontFamily.serif]
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
      screens: {
        md: '780px',
        print: { raw: 'print' },
        screen: { raw: 'screen' }
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
      sans: ['Atkinson Hyperlegible', 'Roboto', 'sans-serif', 'ui-sans-serif', 'system-ui', '-apple-system'],
      serif: ['serif', 'ui-serif', 'system-ui', '-apple-system']
    }
  }
};

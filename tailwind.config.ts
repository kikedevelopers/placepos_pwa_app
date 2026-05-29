import type { Config } from 'tailwindcss'

// Tokens de color idénticos a pos_app (src/styles/global.css). Convención
// shadcn: `hsl(var(--token) / <alpha-value>)`. NUNCA hardcodear hex en la UI;
// usar siempre las clases tematizadas (bg-primary, text-foreground, ...).
const config: Config = {
    darkMode: ['class'],
    content: ['./src/**/*.{html,js,svelte,ts}'],
    theme: {
        container: {
            center: true,
            padding: '1rem',
            screens: { '2xl': '1400px' }
        },
        extend: {
            colors: {
                background: 'hsl(var(--background) / <alpha-value>)',
                foreground: 'hsl(var(--foreground) / <alpha-value>)',
                card: {
                    DEFAULT: 'hsl(var(--card) / <alpha-value>)',
                    foreground: 'hsl(var(--card-foreground) / <alpha-value>)'
                },
                popover: {
                    DEFAULT: 'hsl(var(--popover) / <alpha-value>)',
                    foreground: 'hsl(var(--popover-foreground) / <alpha-value>)'
                },
                border: 'hsl(var(--border) / <alpha-value>)',
                input: 'hsl(var(--input) / <alpha-value>)',
                ring: 'hsl(var(--ring) / <alpha-value>)',
                primary: {
                    DEFAULT: 'hsl(var(--primary) / <alpha-value>)',
                    foreground: 'hsl(var(--primary-foreground) / <alpha-value>)'
                },
                secondary: {
                    DEFAULT: 'hsl(var(--secondary) / <alpha-value>)',
                    foreground: 'hsl(var(--secondary-foreground) / <alpha-value>)'
                },
                muted: {
                    DEFAULT: 'hsl(var(--muted) / <alpha-value>)',
                    foreground: 'hsl(var(--muted-foreground) / <alpha-value>)'
                },
                accent: {
                    DEFAULT: 'hsl(var(--accent) / <alpha-value>)',
                    foreground: 'hsl(var(--accent-foreground) / <alpha-value>)'
                },
                destructive: {
                    DEFAULT: 'hsl(var(--destructive) / <alpha-value>)',
                    foreground: 'hsl(var(--destructive-foreground) / <alpha-value>)'
                },
                success: {
                    DEFAULT: 'hsl(var(--success) / <alpha-value>)',
                    foreground: 'hsl(var(--success-foreground) / <alpha-value>)'
                },
                warning: {
                    DEFAULT: 'hsl(var(--warning) / <alpha-value>)',
                    foreground: 'hsl(var(--warning-foreground) / <alpha-value>)'
                },
                info: {
                    DEFAULT: 'hsl(var(--info) / <alpha-value>)',
                    foreground: 'hsl(var(--info-foreground) / <alpha-value>)'
                }
            },
            borderRadius: {
                xl: 'calc(var(--radius) + 4px)',
                lg: 'var(--radius)',
                md: 'calc(var(--radius) - 2px)',
                sm: 'calc(var(--radius) - 4px)'
            },
            fontFamily: {
                sans: [
                    '-apple-system',
                    'BlinkMacSystemFont',
                    'Inter',
                    'Segoe UI',
                    'Roboto',
                    'Helvetica Neue',
                    'sans-serif'
                ]
            },
            transitionTimingFunction: {
                // Curvas fuertes (emil-design-eng): las built-in son débiles.
                'out-strong': 'cubic-bezier(0.23, 1, 0.32, 1)',
                'in-out-strong': 'cubic-bezier(0.77, 0, 0.175, 1)',
                drawer: 'cubic-bezier(0.32, 0.72, 0, 1)'
            },
            keyframes: {
                'fade-in-up': {
                    from: { opacity: '0', transform: 'translateY(8px)' },
                    to: { opacity: '1', transform: 'translateY(0)' }
                },
                'scale-in': {
                    from: { opacity: '0', transform: 'scale(0.95)' },
                    to: { opacity: '1', transform: 'scale(1)' }
                },
                'slide-up': {
                    from: { transform: 'translateY(100%)' },
                    to: { transform: 'translateY(0)' }
                }
            },
            animation: {
                'fade-in-up': 'fade-in-up 300ms cubic-bezier(0.23, 1, 0.32, 1)',
                'scale-in': 'scale-in 200ms cubic-bezier(0.23, 1, 0.32, 1)',
                'slide-up': 'slide-up 300ms cubic-bezier(0.32, 0.72, 0, 1)'
            }
        }
    },
    plugins: []
}

export default config

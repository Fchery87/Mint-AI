import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: ['class'],
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './lib/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    container: {
      center: true,
      padding: '2rem',
      screens: {
        '2xl': '1400px',
      },
    },
    extend: {
      colors: {
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--accent-secondary))',
          foreground: 'hsl(var(--foreground))',
        },
        tertiary: {
          DEFAULT: 'hsl(var(--accent-tertiary))',
          foreground: 'hsl(var(--foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
      },
      borderRadius: {
        none: 'var(--radius-none)',
        sm: 'var(--radius-sm)',
        DEFAULT: 'var(--radius-base)',
      },
      fontFamily: {
        // Cyberpunk Typography System
        display: ['var(--font-display)', 'monospace'],
        sans: ['var(--font-sans)', 'monospace'],
        mono: ['var(--font-mono)', 'monospace'],
      },
      boxShadow: {
        'neon': 'var(--shadow-neon)',
        'neon-sm': 'var(--shadow-neon-sm)',
        'neon-lg': 'var(--shadow-neon-lg)',
        'neon-secondary': 'var(--shadow-neon-secondary)',
        'neon-tertiary': 'var(--shadow-neon-tertiary)',
      },
      animationDuration: {
        fast: '100ms',
        base: '150ms',
        slow: '300ms',
      },
      transitionTimingFunction: {
        digital: 'cubic-bezier(0.4, 0, 0.2, 1)',
        glitch: 'steps(4)',
      },
      keyframes: {
        'blink': {
          '50%': { opacity: '0' },
        },
        'glitch': {
          '0%, 100%': { 
            transform: 'translate(0)',
            clipPath: 'polygon(0 2%, 100% 2%, 100% 5%, 0 5%)',
          },
          '20%': { 
            transform: 'translate(-2px, 2px)',
            clipPath: 'polygon(0 15%, 100% 15%, 100% 15%, 0 15%)',
          },
          '40%': { 
            transform: 'translate(2px, -2px)',
            clipPath: 'polygon(0 10%, 100% 10%, 100% 20%, 0 20%)',
          },
          '60%': { 
            transform: 'translate(-1px, -1px)',
            clipPath: 'polygon(0 1%, 100% 1%, 100% 2%, 0 2%)',
          },
          '80%': { 
            transform: 'translate(1px, 1px)',
            clipPath: 'polygon(0 33%, 100% 33%, 100% 33%, 0 33%)',
          },
        },
        'rgbShift': {
          '0%, 100%': { 
            textShadow: '-2px 0 #ff00ff, 2px 0 #00d4ff',
          },
          '50%': { 
            textShadow: '2px 0 #ff00ff, -2px 0 #00d4ff',
          },
        },
        'flicker': {
          '0%, 100%': { opacity: '1' },
          '41%': { opacity: '1' },
          '42%': { opacity: '0.8' },
          '43%': { opacity: '1' },
          '45%': { opacity: '0.3' },
          '46%': { opacity: '1' },
        },
      },
      animation: {
        'blink': 'blink 1s step-end infinite',
        'glitch': 'glitch 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94) both infinite',
        'rgb-shift': 'rgbShift 3s ease-in-out infinite',
        'flicker': 'flicker 2s linear infinite',
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
};

export default config;

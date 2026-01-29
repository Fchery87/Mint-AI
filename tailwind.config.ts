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
        // Core theme colors using CSS variables (RGB format)
        background: 'rgb(var(--background))',
        foreground: 'rgb(var(--foreground))',
        card: {
          DEFAULT: 'rgb(var(--card))',
          foreground: 'rgb(var(--card-foreground))',
        },
        popover: {
          DEFAULT: 'rgb(var(--popover))',
          foreground: 'rgb(var(--popover-foreground))',
        },
        muted: {
          DEFAULT: 'rgb(var(--muted))',
          foreground: 'rgb(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'rgb(var(--accent))',
          foreground: 'rgb(var(--accent-foreground))',
          secondary: 'rgb(var(--accent-secondary))',
          tertiary: 'rgb(var(--accent-tertiary))',
        },
        border: 'rgb(var(--border))',
        input: 'rgb(var(--input))',
        ring: 'rgb(var(--ring))',
        destructive: {
          DEFAULT: 'rgb(var(--destructive))',
          foreground: 'rgb(var(--destructive-foreground))',
        },
        // Mapped aliases for shadcn/ui compatibility
        primary: {
          DEFAULT: 'rgb(var(--accent))',
          foreground: 'rgb(var(--accent-foreground))',
        },
        secondary: {
          DEFAULT: 'rgb(var(--accent-secondary))',
          foreground: 'rgb(var(--foreground))',
        },
        tertiary: {
          DEFAULT: 'rgb(var(--accent-tertiary))',
          foreground: 'rgb(var(--foreground))',
        },
        // Custom cyberpunk colors
        'void-black': '#0a0a0f',
        'neon-green': '#00ff88',
        'neon-magenta': '#ff00ff',
        'neon-cyan': '#00d4ff',
      },
      borderRadius: {
        none: 'var(--radius-none)',
        sm: 'var(--radius-sm)',
        DEFAULT: 'var(--radius-base)',
      },
      fontFamily: {
        // Cyberpunk Typography System
        display: ['var(--font-display)', 'Orbitron', 'sans-serif'],
        sans: ['var(--font-sans)', 'Share Tech Mono', 'monospace'],
        mono: ['var(--font-mono)', 'JetBrains Mono', 'monospace'],
      },
      boxShadow: {
        neon: 'var(--shadow-neon)',
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
        blink: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0' },
        },
        glitch: {
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
        scanline: {
          '0%': { transform: 'translateY(-100%)' },
          '100%': { transform: 'translateY(100vh)' },
        },
        'rgb-shift': {
          '0%, 100%': {
            textShadow: '-2px 0 #ff00ff, 2px 0 #00d4ff',
          },
          '50%': {
            textShadow: '2px 0 #ff00ff, -2px 0 #00d4ff',
          },
        },
        flicker: {
          '0%, 100%': { opacity: '1' },
          '41%': { opacity: '1' },
          '42%': { opacity: '0.8' },
          '43%': { opacity: '1' },
          '45%': { opacity: '0.3' },
          '46%': { opacity: '1' },
        },
        'pulse-glow': {
          '0%, 100%': {
            boxShadow: '0 0 5px rgba(0, 255, 136, 0.8), 0 0 10px rgba(0, 255, 136, 0.4)',
          },
          '50%': {
            boxShadow: '0 0 10px rgba(0, 255, 136, 1), 0 0 20px rgba(0, 255, 136, 0.6), 0 0 30px rgba(0, 255, 136, 0.3)',
          },
        },
        'slide-up': {
          '0%': { transform: 'translateY(100%)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        'slide-down': {
          '0%': { transform: 'translateY(-100%)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
      },
      animation: {
        blink: 'blink 1s step-end infinite',
        glitch: 'glitch 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94) both infinite',
        scanline: 'scanline 8s linear infinite',
        'rgb-shift': 'rgb-shift 3s ease-in-out infinite',
        flicker: 'flicker 2s linear infinite',
        'pulse-glow': 'pulse-glow 2s ease-in-out infinite',
        'slide-up': 'slide-up 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        'slide-down': 'slide-down 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
};

export default config;

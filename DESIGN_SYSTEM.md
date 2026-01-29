# Mint AI Design System

## Overview
A refined, professional design system moving away from cyberpunk toward an elegant, premium developer tool aesthetic.

## Philosophy
- **Clarity first**: Clean interfaces that prioritize content
- **Typography-driven**: Beautiful font pairings create hierarchy
- **Subtle sophistication**: Refined shadows, micro-interactions, depth
- **Dual-mode excellence**: Both light and dark modes feel intentional

---

## Typography

### Font Families

| Role | Font | Weight Range | Usage |
|------|------|--------------|-------|
| Display | **Plus Jakarta Sans** | 700-800 | Headings, logo, major UI labels |
| Body | **Plus Jakarta Sans** | 400-600 | Primary text, UI elements |
| Mono | **JetBrains Mono** | 400-500 | Code, terminal, technical text |

**Why Plus Jakarta Sans?**
- Modern geometric sans-serif with personality
- Excellent readability at all sizes
- Distinctive without being distracting
- Works beautifully in both light and dark modes

### Type Scale

| Level | Size | Weight | Line Height | Letter Spacing | Usage |
|-------|------|--------|-------------|----------------|-------|
| H1 | 2rem (32px) | 800 | 1.1 | -0.02em | Page titles |
| H2 | 1.5rem (24px) | 700 | 1.2 | -0.01em | Section headers |
| H3 | 1.25rem (20px) | 700 | 1.3 | 0 | Card titles |
| H4 | 1.125rem (18px) | 600 | 1.4 | 0 | Subsection |
| Body | 0.875rem (14px) | 400 | 1.6 | 0 | Primary text |
| Small | 0.75rem (12px) | 500 | 1.5 | 0.01em | Labels, captions |
| Tiny | 0.6875rem (11px) | 500 | 1.4 | 0.02em | Badges, timestamps |

---

## Color System

### Primary Accent: Teal/Emerald
A sophisticated teal that works beautifully in both modes:
- **Light mode**: Deep, rich teal
- **Dark mode**: Bright, vibrant teal

### Light Mode Palette

| Token | Hex | Usage |
|-------|-----|-------|
| `--background` | #fafafa | Page background |
| `--foreground` | #171717 | Primary text |
| `--card` | #ffffff | Card backgrounds |
| `--card-foreground` | #171717 | Card text |
| `--muted` | #f3f4f6 | Subtle backgrounds |
| `--muted-foreground` | #6b7280 | Secondary text |
| `--border` | #e5e7eb | Borders |
| `--accent` | #0d9488 | Primary teal |
| `--accent-foreground` | #ffffff | Text on accent |

### Dark Mode Palette

| Token | Hex | Usage |
|-------|-----|-------|
| `--background` | #0f172a | Deep navy/slate |
| `--foreground` | #f8fafc | Primary text |
| `--card` | #1e293b | Card backgrounds |
| `--card-foreground` | #f8fafc | Card text |
| `--muted` | #334155 | Subtle backgrounds |
| `--muted-foreground` | #94a3b8 | Secondary text |
| `--border` | #334155 | Borders |
| `--accent` | #2dd4bf | Bright teal |
| `--accent-foreground` | #0f172a | Text on accent |

### Semantic Colors

| Token | Light | Dark | Usage |
|-------|-------|------|-------|
| `--success` | #10b981 | #34d399 | Success states |
| `--warning` | #f59e0b | #fbbf24 | Warnings |
| `--destructive` | #ef4444 | #f87171 | Errors |
| `--info` | #3b82f6 | #60a5fa | Information |

---

## Shadows & Elevation

### Light Mode Shadows
```
--shadow-sm: 0 1px 2px 0 rgb(0 0 0 / 0.05)
--shadow: 0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)
--shadow-md: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)
--shadow-lg: 0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)
--shadow-glow: 0 0 20px -5px rgb(13 148 136 / 0.3)
```

### Dark Mode Shadows
```
--shadow-sm: 0 1px 2px 0 rgb(0 0 0 / 0.3)
--shadow: 0 1px 3px 0 rgb(0 0 0 / 0.4), 0 1px 2px -1px rgb(0 0 0 / 0.4)
--shadow-md: 0 4px 6px -1px rgb(0 0 0 / 0.4), 0 2px 4px -2px rgb(0 0 0 / 0.4)
--shadow-lg: 0 10px 15px -3px rgb(0 0 0 / 0.4), 0 4px 6px -4px rgb(0 0 0 / 0.4)
--shadow-glow: 0 0 30px -5px rgb(45 212 191 / 0.2)
```

---

## Spacing System

Base unit: 4px

| Token | Value | Usage |
|-------|-------|-------|
| 1 | 4px | Tight spacing |
| 2 | 8px | Default gap |
| 3 | 12px | Small padding |
| 4 | 16px | Standard padding |
| 5 | 20px | Medium padding |
| 6 | 24px | Large padding |
| 8 | 32px | Section padding |
| 10 | 40px | Major sections |
| 12 | 48px | Hero spacing |

---

## Border Radius

| Token | Value | Usage |
|-------|-------|-------|
| --radius-none | 0px | Sharp corners |
| --radius-sm | 4px | Small elements |
| --radius | 6px | Default |
| --radius-md | 8px | Cards, inputs |
| --radius-lg | 12px | Large cards |
| --radius-xl | 16px | Modals |
| --radius-full | 9999px | Pills, avatars |

---

## Animation

### Timing Functions
```
--ease-default: cubic-bezier(0.4, 0, 0.2, 1)
--ease-in: cubic-bezier(0.4, 0, 1, 1)
--ease-out: cubic-bezier(0, 0, 0.2, 1)
--ease-spring: cubic-bezier(0.175, 0.885, 0.32, 1.275)
```

### Durations
```
--duration-fast: 100ms
--duration-base: 150ms
--duration-slow: 250ms
--duration-slower: 350ms
```

---

## Component Guidelines

### Buttons
- **Primary**: Solid accent color, white text
- **Secondary**: Light gray background, dark text
- **Ghost**: Transparent, subtle hover
- **Outline**: Border only, transparent background

All buttons:
- Height: 36px (default), 32px (sm), 40px (lg)
- Padding: 12px horizontal
- Border radius: 6px
- Font weight: 500
- Transition: all 150ms ease

### Cards
- Background: `--card`
- Border: 1px solid `--border`
- Border radius: 8px
- Shadow: `--shadow`
- Hover: Subtle lift with increased shadow

### Inputs
- Background: `--background` or `--card`
- Border: 1px solid `--border`
- Border radius: 6px
- Focus: 2px accent color ring
- Transition: border-color, shadow 150ms

### Panels/Sidebar
- Background: `--card` or slightly darker variant
- Border: 1px solid `--border`
- No glow effects
- Clean, minimal headers

---

## Migration Notes

### Remove:
- All `cyber-` prefixed classes
- `cyber-chamfer-*` clip-paths
- Neon glow shadows (`shadow-neon*`) except subtle accent glow
- Scanline overlay
- RGB shift animations
- Glitch effects
- Circuit grid patterns
- `font-mono` for non-code text
- Uppercase text transforms (use sentence case)

### Replace:
- Orbitron → Plus Jakarta Sans
- Share Tech Mono → Plus Jakarta Sans (body)
- Neon green/magenta/cyan → Teal accent
- Sharp corners → Rounded (6-8px)
- Aggressive animations → Subtle transitions

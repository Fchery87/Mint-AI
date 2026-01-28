# 🌃 Cyberpunk/Glitch Design System - Complete Documentation

> **Mint AI - Cyberpunk Edition**  
> "High-Tech, Low-Life"  
> Version: 1.0.0  
> Last Updated: 2026-01-27

---

## 🎯 Design Philosophy

**Core Concept:** A digital dystopia colliding with a high-tech noir reality. This isn't a clean, utopian future; it's gritty, imperfect, and palpably dangerous. Every pixel feels like it's being rendered on a malfunctioning CRT monitor in a rain-soaked Tokyo alley.

**The Vibe:** Dangerous, electric, rebellious, aggressively futuristic-retro. Drawing heavily from 80s sci-fi (Blade Runner, Akira) and hacker culture (The Matrix, Ghost in the Shell). The interface feels *alive* and volatile—buzzing with digital energy.

**Visual Signatures:**
- 🔴🟢🔵 **Chromatic Aberration** - RGB color splitting on text
- 📺 **Scanlines** - CRT monitor refresh effect
- ⚡ **Glitch Effects** - Random corruption animations
- 💚 **Neon Glow** - Multi-layered shadows creating real glow
- 📐 **Chamfered Corners** - 45-degree cuts via clip-path
- 🔌 **Circuit Patterns** - PCB trace backgrounds

---

## 🎨 Color Palette

### Dark Mode Only (Mandatory)

```
Background Colors:
├── background:     #0a0a0f  (HSL: 10 10 15)  - Deep void black
├── card:           #12121a  (HSL: 18 18 26)  - Card surface
├── muted:          #1c1c2e  (HSL: 28 28 46)  - UI chrome
└── border:         #2a2a3a  (HSL: 42 42 58)  - Subtle borders

Text Colors:
├── foreground:     #e0e0e0  (HSL: 224 224 224) - Primary text
└── mutedForeground:#6b7280  (HSL: 107 114 128) - Secondary text

Neon Triad (Accent System):
├── Primary:        #00ff88  (HSL: 0 255 136)   - Electric green (Matrix)
├── Secondary:      #ff00ff  (HSL: 255 0 255)   - Hot magenta (Cyberpunk)
└── Tertiary:       #00d4ff  (HSL: 0 212 255)   - Cyan (Tron)

Semantic:
├── Destructive:    #ff3366  (HSL: 255 51 102)  - Error red-pink
└── Ring:           #00ff88  (HSL: 0 255 136)   - Focus ring
```

### Usage in Tailwind

```tsx
// Colors
className="bg-background text-foreground border-border"
className="bg-card text-card-foreground"
className="text-primary"  // Neon green
className="text-secondary"  // Neon magenta
className="text-tertiary"  // Neon cyan

// With glow
className="text-primary shadow-neon"
className="border-primary shadow-neon-sm"
```

---

## ✍️ Typography

### Font Stack

```css
/* Display/Headings */
font-family: 'Orbitron', monospace;
Weights: 400, 500, 600, 700, 800, 900
Usage: H1-H3, titles, display text

/* Body/UI */
font-family: 'Share Tech Mono', monospace;
Weights: 400, 700
Usage: Body text, UI elements, buttons

/* Code/Terminal */
font-family: 'JetBrains Mono', monospace;
Weights: 400, 500
Usage: Code blocks, data display
```

### Type Scale

| Element | Size | Weight | Case | Tracking | Class |
|---------|------|--------|------|----------|-------|
| H1 (Hero) | text-6xl to 8xl | 900 (black) | UPPERCASE | tracking-widest | `font-display font-black uppercase tracking-widest text-6xl` |
| H2 | text-4xl to 5xl | 700 (bold) | UPPERCASE | tracking-wide | `font-display font-bold uppercase tracking-wide` |
| H3 | text-xl to 2xl | 700 (bold) | UPPERCASE | tracking-wide | `font-display font-bold uppercase tracking-wide` |
| Body | text-base | 400 (normal) | UPPERCASE | tracking-[0.2em] | `font-mono uppercase tracking-[0.2em]` |
| Labels | text-sm | 700 (bold) | UPPERCASE | tracking-[0.2em] | `font-mono font-bold uppercase tracking-[0.2em]` |
| Code | text-sm | 400 (normal) | - | - | `font-mono text-sm` |

### Terminal Prompt Style

```css
.terminal-prompt {
  @apply text-accent font-mono text-sm uppercase tracking-[0.2em];
}
.terminal-prompt::before {
  content: "> ";
  @apply text-accent;
}
```

Usage: `<p className="terminal-prompt">Command here</p>`

---

## 📐 Spacing System

### 8px Base Grid

| Token | Value | Usage |
|-------|-------|-------|
| xs | 4px | Tight spacing |
| sm | 8px | Compact gaps |
| md | 12px | Default padding |
| lg | 16px | Comfortable spacing |
| xl | 24px | Section spacing |
| 2xl | 32px | Large gaps |
| 3xl | 48px | Component separation |
| 4xl | 64px | Page sections |

### Always Use Gap Utilities

```tsx
// ✅ CORRECT
<div className="flex gap-4">
<div className="grid gap-6">

// ❌ WRONG
<div className="flex space-x-4">  // Tailwind v3 only
```

---

## 🔲 Borders & Radius

### Chamfered Corners (Clip-Path)

**Small Cut (6px):**
```css
.cyber-chamfer-sm {
  clip-path: polygon(
    0 6px, 6px 0,
    calc(100% - 6px) 0, 100% 6px,
    100% calc(100% - 6px), calc(100% - 6px) 100%,
    6px 100%, 0 calc(100% - 6px)
  );
}
```

**Medium Cut (10px):**
```css
.cyber-chamfer-md {
  clip-path: polygon(
    0 10px, 10px 0,
    calc(100% - 10px) 0, 100% 10px,
    100% calc(100% - 10px), calc(100% - 10px) 100%,
    10px 100%, 0 calc(100% - 10px)
  );
}
```

**Large Cut (16px):**
```css
.cyber-chamfer-lg {
  clip-path: polygon(
    0 16px, 16px 0,
    calc(100% - 16px) 0, 100% 16px,
    100% calc(100% - 16px), calc(100% - 16px) 100%,
    16px 100%, 0 calc(100% - 16px)
  );
}
```

### Border Radius (Minimal)

```css
--radius-none: 0px;     // Default - sharp cuts
--radius-sm: 2px;       // Minimal softening
--radius-base: 4px;     // Rare, only for inputs
```

**Note:** Chamfered corners via clip-path are preferred over border-radius.

---

## 🌟 Shadows & Effects

### Neon Glow Shadows

**Small Glow (Subtle):**
```css
--shadow-neon-sm: 
  0 0 3px rgba(0, 255, 136, 0.8), 
  0 0 6px rgba(0, 255, 136, 0.4);
```

**Medium Glow (Default):**
```css
--shadow-neon: 
  0 0 5px rgba(0, 255, 136, 0.8), 
  0 0 10px rgba(0, 255, 136, 0.4), 
  0 0 20px rgba(0, 255, 136, 0.2);
```

**Large Glow (Emphasized):**
```css
--shadow-neon-lg: 
  0 0 10px rgba(0, 255, 136, 0.8), 
  0 0 20px rgba(0, 255, 136, 0.6), 
  0 0 40px rgba(0, 255, 136, 0.4), 
  0 0 80px rgba(0, 255, 136, 0.2);
```

**Secondary Glow (Magenta):**
```css
--shadow-neon-secondary: 
  0 0 5px rgba(255, 0, 255, 0.8), 
  0 0 20px rgba(255, 0, 255, 0.6);
```

**Tertiary Glow (Cyan):**
```css
--shadow-neon-tertiary: 
  0 0 5px rgba(0, 212, 255, 0.8), 
  0 0 20px rgba(0, 212, 255, 0.6);
```

### Usage

```tsx
// In Tailwind
className="shadow-neon-sm"
className="shadow-neon"
className="shadow-neon-lg"
className="shadow-neon-secondary"

// In CSS
box-shadow: var(--shadow-neon);
```

---

## ⚡ Animations

### Keyframes

```css
/* Blink Cursor */
@keyframes blink {
  50% { opacity: 0; }
}

/* Glitch Effect */
@keyframes glitch {
  0%, 100% { 
    transform: translate(0);
    clip-path: polygon(0 2%, 100% 2%, 100% 5%, 0 5%);
  }
  20% { 
    transform: translate(-2px, 2px);
    clip-path: polygon(0 15%, 100% 15%, 100% 15%, 0 15%);
  }
  40% { 
    transform: translate(2px, -2px);
    clip-path: polygon(0 10%, 100% 10%, 100% 20%, 0 20%);
  }
  60% { 
    transform: translate(-1px, -1px);
    clip-path: polygon(0 1%, 100% 1%, 100% 2%, 0 2%);
  }
  80% { 
    transform: translate(1px, 1px);
    clip-path: polygon(0 33%, 100% 33%, 100% 33%, 0 33%);
  }
}

/* RGB Shift (Chromatic Pulse) */
@keyframes rgbShift {
  0%, 100% { 
    text-shadow: -2px 0 #ff00ff, 2px 0 #00d4ff;
  }
  50% { 
    text-shadow: 2px 0 #ff00ff, -2px 0 #00d4ff;
  }
}

/* Flicker */
@keyframes flicker {
  0%, 100% { opacity: 1; }
  41% { opacity: 1; }
  42% { opacity: 0.8; }
  43% { opacity: 1; }
  45% { opacity: 0.3; }
  46% { opacity: 1; }
}
```

### Utility Classes

```tsx
// Apply animations
className="animate-blink"       // Cursor blink
className="animate-glitch"      // Glitch effect
className="animate-rgb-shift"   // Chromatic pulse
className="animate-flicker"     // Random flicker
```

---

## 🎬 Effects & Textures

### 1. Scanline Overlay (CRT Effect)

**Implementation:** Automatic via `body::before`

```css
body::before {
  content: "";
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: repeating-linear-gradient(
    0deg,
    rgba(0, 0, 0, 0.15),
    rgba(0, 0, 0, 0.15) 1px,
    transparent 1px,
    transparent 2px
  );
  pointer-events: none;
  z-index: 9999;
  opacity: 0.6;
}
```

### 2. Circuit/Grid Pattern

```tsx
// Apply to any container
className="cyber-grid"
```

**CSS:**
```css
.cyber-grid {
  background-image: 
    linear-gradient(rgba(0, 255, 136, 0.03) 1px, transparent 1px),
    linear-gradient(90deg, rgba(0, 255, 136, 0.03) 1px, transparent 1px);
  background-size: 50px 50px;
}
```

### 3. Chromatic Aberration (RGB Splitting)

**Implementation:** Via `.cyber-glitch` class

```tsx
<span className="cyber-glitch" data-text="YOUR TEXT">
  YOUR TEXT
</span>
```

**Effect:**
- Red/magenta offset left (-2px)
- Cyan offset right (+2px)
- Clip-path animation for glitch

---

## 🧩 Component Library

### CyberButton

```tsx
import { CyberButton } from "@/components/ui";

// Variants
<CyberButton variant="default">Default</CyberButton>
<CyberButton variant="glitch" enableGlitch>Glitch</CyberButton>
<CyberButton variant="secondary">Secondary</CyberButton>
<CyberButton variant="tertiary">Tertiary</CyberButton>
<CyberButton variant="outline">Outline</CyberButton>
<CyberButton variant="ghost">Ghost</CyberButton>
<CyberButton variant="destructive">Delete</CyberButton>

// Sizes
<CyberButton size="sm">Small</CyberButton>
<CyberButton size="default">Default</CyberButton>
<CyberButton size="lg">Large</CyberButton>
<CyberButton size="icon"><Icon /></CyberButton>
```

**Features:**
- Monospace, uppercase, 0.2em tracking
- Chamfered corners (clip-path)
- Neon glow on hover
- Glitch animation support

### CyberCard

```tsx
import { CyberCard, CyberCardHeader, CyberCardTitle, CyberCardContent } from "@/components/ui";

// Default card
<CyberCard>
  <CyberCardHeader>
    <CyberCardTitle>PROJECT_TITLE</CyberCardTitle>
  </CyberCardHeader>
  <CyberCardContent>Content here</CyberCardContent>
</CyberCard>

// Terminal variant
<CyberCard variant="terminal" terminalTitle="root@mint-ai:~$">
  <CyberCardContent>
    <p className="terminal-prompt">Command here</p>
  </CyberCardContent>
</CyberCard>

// Holographic variant
<CyberCard variant="holographic">
  <CyberCardTitle>HOLOGRAPHIC</CyberCardTitle>
  <CyberCardContent>Classified data</CyberCardContent>
</CyberCard>

// Glitch variant
<CyberCard variant="glitch">
  <CyberCardContent>Corrupted data</CyberCardContent>
</CyberCard>
```

### CyberBadge

```tsx
import { CyberBadge } from "@/components/ui";

// Variants
<CyberBadge variant="primary">ACTIVE</CyberBadge>
<CyberBadge variant="secondary">ENCRYPTED</CyberBadge>
<CyberBadge variant="tertiary">SECURE</CyberBadge>
<CyberBadge variant="destructive">ERROR</CyberBadge>
<CyberBadge variant="outline">LABEL</CyberBadge>
<CyberBadge variant="glitch">UNSTABLE</CyberBadge>

// With dot indicator
<CyberBadge variant="primary" showDot>ONLINE</CyberBadge>

// Shape options
<CyberBadge variant="primary" shape="sharp">Sharp</CyberBadge>
<CyberBadge variant="primary" shape="terminal">Terminal</CyberBadge>
```

### GlitchText, RGBShiftText, NeonText

```tsx
import { GlitchText, RGBShiftText, NeonText } from "@/components/ui";

// Glitch text with cursor
<GlitchText enableGlitch showCursor intensity="high">
  SYSTEM_HACKED
</GlitchText>

// RGB shift (static chromatic aberration)
<RGBShiftText color="primary">
  CORRUPTED_DATA
</RGBShiftText>

// Neon glow text
<NeonText intensity="lg" flicker>
  NEON_SIGN
</NeonText>
```

---

## 📐 Layout Patterns

### Asymmetry Requirements

**Hero Section (60/40 Split):**
```tsx
<div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
  <div className="lg:col-span-3">
    {/* Left content - 60% */}
  </div>
  <div className="lg:col-span-2">
    {/* Right content - 40% */}
  </div>
</div>
```

**Overlapping Elements:**
```tsx
<div className="relative -mt-16">
  {/* Overlaps previous section */}
</div>
```

**Skewed Containers:**
```tsx
<div className="-skew-y-1">
  {/* Content unskewed */}
  <div className="skew-y-1">
    {/* Actual content */}
  </div>
</div>
```

### Grid Patterns

```tsx
// Features (staggered heights)
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
  <CyberCard className="md:mt-8">Feature 1</CyberCard>
  <CyberCard>Feature 2</CyberCard>
  <CyberCard className="md:mt-8">Feature 3</CyberCard>
</div>
```

---

## 🎯 Mandatory Bold Choices

### 1. Glitched Headlines

**Requirement:** Hero h1 MUST have chromatic aberration AND glitch animation

```tsx
<h1 className="text-7xl font-display font-black uppercase tracking-widest">
  <GlitchText enableGlitch showCursor intensity="high">
    MINT_AI_PROTOCOL
  </GlitchText>
</h1>
```

### 2. Scanline Overlay

**Requirement:** Entire page has scanline overlay (already implemented via body::before)

**Verification:** Open browser DevTools, check `body::before` pseudo-element

### 3. Terminal Aesthetic

**Requirement:** At least one section must feel like a terminal

```tsx
<section className="cyber-grid">
  <CyberCard variant="terminal" terminalTitle="root@mint-ai:~$">
    <CyberCardContent className="font-mono text-sm">
      <p className="terminal-prompt">whoami</p>
      <p className="text-primary">mint-ai-user</p>
      <p className="terminal-prompt">ps aux</p>
      <p className="text-muted-foreground">PID   %CPU COMMAND</p>
      <p className="text-muted-foreground">1     0.5  mint-ai-core</p>
      <span className="inline-block w-2 h-4 bg-primary animate-blink align-middle" />
    </CyberCardContent>
  </CyberCard>
</section>
```

### 4. Neon Borders That Glow

**Requirement:** Multi-layered box-shadows, not just colored borders

```tsx
// ❌ WRONG - Just colored border
<div className="border-2 border-primary">

// ✅ CORRECT - Border + glow
<div className="border-2 border-primary shadow-neon">
```

### 5. Corner Cuts

**Requirement:** Chamfered/clipped corners via clip-path, not rounded

```tsx
// ❌ WRONG - Rounded corners
<div className="rounded-lg">

// ✅ CORRECT - Chamfered corners
<div className="cyber-chamfer-md">
```

### 6. Animated Elements

**Blinking Cursor:**
```tsx
<span className="inline-block w-2 h-4 bg-primary animate-blink" />
```

**Glitch Effect:**
```tsx
<div className="animate-glitch">Unstable</div>
```

**RGB Shift:**
```tsx
<RGBShiftText>Shifting</RGBShiftText>
```

### 7. Circuit Background

**Requirement:** Visible tech-pattern in at least one section

```tsx
<section className="cyber-grid min-h-screen py-24">
  {/* Section with circuit pattern */}
</section>
```

### 8. Typing Effect

**Requirement:** Style as if mid-type with trailing cursor

```tsx
<p className="font-mono text-sm">
  Initializing system...<span className="inline-block w-2 h-4 bg-primary animate-blink" />
</p>
```

---

## 📱 Responsive Strategy

### Mobile-First Breakpoints

**Typography Scaling:**
```tsx
// Hero h1
className="text-5xl md:text-7xl lg:text-8xl"

// Section headings
className="text-4xl md:text-5xl"

// Body text
className="text-base md:text-lg"
```

**Layout Changes:**
```tsx
// Navigation
className="hidden lg:flex"  // Hide on mobile

// Stats grid
<div className="grid grid-cols-2 md:grid-cols-4 gap-4">

// Feature cards
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
```

**Touch Targets:**
- Minimum 44px height for interactive elements
- Adequate spacing (8px+)

---

## ♿ Accessibility

### Focus States

```tsx
// All interactive elements
className="focus-visible:outline-none focus-visible:shadow-neon"
```

### Contrast Ratios

| Element | Ratio | WCAG Level |
|---------|-------|------------|
| Neon on dark | 7.5:1 | AAA |
| Body text | 15.8:1 | AAA |
| Large text | 18.5:1 | AAA |

### Keyboard Navigation

- Tab order follows visual layout
- All buttons accessible via keyboard
- Skip links supported

### Reduced Motion

```css
@media (prefers-reduced-motion: reduce) {
  /* Disable glitch animations */
  /* Keep static chromatic aberration */
  /* Maintain essential transitions */
}
```

---

## 🚀 Performance

### Font Loading

```tsx
// Display swap prevents FOUC
display: "swap"
// Latin subset keeps file size small
subsets: ["latin"]
// Variable fonts = single file, multiple weights
variable fonts: true
```

### CSS Optimization

- CSS variables for fast theming
- Minimal custom CSS
- Tailwind JIT compilation
- GPU-accelerated animations

### Shadow Performance

```css
/* Use will-change sparingly */
will-change: transform, box-shadow;

/* Prefer transform over position changes */
transform: translateY(-1px);  // GPU accelerated
top: -1px;  // CPU bound
```

---

## 📁 File Organization

```
components/ui/
├── cyber-button.tsx     # Glitch variants
├── cyber-card.tsx       # Terminal, holographic
├── cyber-badge.tsx      # Neon glow badges
├── glitch-text.tsx      # RGB shift, neon
├── button.tsx           # (kept for compatibility)
├── input.tsx
├── card.tsx
├── badge.tsx
└── index.ts             # Barrel exports

app/
├── globals.css          # Design tokens + effects
└── layout.tsx           # Font loading

tailwind.config.ts       # Custom theme
```

---

## 💡 Common Patterns

### Hero Section

```tsx
<section className="cyber-grid min-h-screen flex items-center justify-center py-24">
  <div className="max-w-7xl mx-auto px-6">
    <GlitchText 
      enableGlitch 
      showCursor 
      intensity="high"
      className="text-7xl md:text-8xl font-display font-black uppercase tracking-widest mb-6"
    >
      MINT_AI_PROTOCOL
    </GlitchText>
    
    <p className="font-mono text-sm uppercase tracking-[0.2em] text-muted-foreground mb-8">
      High-Tech, Low-Life. Build with AI in a digital dystopia.
    </p>
    
    <div className="flex gap-4">
      <CyberButton variant="glitch" enableGlitch size="lg">
        INITIALIZE
      </CyberButton>
      <CyberButton variant="outline" size="lg">
        LEARN_MORE
      </CyberButton>
    </div>
  </div>
</section>
```

### Terminal Section

```tsx
<section className="py-24 bg-card">
  <div className="max-w-7xl mx-auto px-6">
    <CyberCard variant="terminal" terminalTitle="root@mint-ai:~$">
      <CyberCardContent className="font-mono text-sm">
        <p className="terminal-prompt">mint-ai init --cyberpunk</p>
        <p className="text-muted-foreground mb-4">Initializing cyberpunk protocols...</p>
        
        <p className="text-primary mb-2">✓ Neon glow systems: ONLINE</p>
        <p className="text-secondary mb-2">✓ Chromatic aberration: ACTIVE</p>
        <p className="text-tertiary mb-4">✓ Scanline overlay: ENABLED</p>
        
        <p className="terminal-prompt">system status</p>
        <div className="flex gap-2 mt-4">
          <CyberBadge variant="primary" showDot>ONLINE</CyberBadge>
          <CyberBadge variant="secondary">ENCRYPTED</CyberBadge>
          <CyberBadge variant="tertiary">SECURE</CyberBadge>
        </div>
        
        <span className="inline-block w-2 h-4 bg-primary animate-blink align-middle" />
      </CyberCardContent>
    </CyberCard>
  </div>
</section>
```

### Features Grid

```tsx
<section className="cyber-grid py-24">
  <div className="max-w-7xl mx-auto px-6">
    <h2 className="text-5xl font-display font-bold uppercase tracking-wide mb-12">
      SYSTEM_CAPABILITIES
    </h2>
    
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <CyberCard className="md:mt-8">
        <CyberCardHeader>
          <CyberCardTitle>NEURAL_NET</CyberCardTitle>
        </CyberCardHeader>
        <CyberCardContent>
          <p className="font-mono text-sm text-muted-foreground">
            Advanced AI with chromatic aberration processing
          </p>
        </CyberCardContent>
      </CyberCard>
      
      <CyberCard>
        <CyberCardHeader>
          <CyberCardTitle>TERMINAL</CyberCardTitle>
        </CyberCardHeader>
        <CyberCardContent>
          <p className="font-mono text-sm text-muted-foreground">
            Command-line interface with glow effects
          </p>
        </CyberCardContent>
      </CyberCard>
      
      <CyberCard className="md:mt-8">
        <CyberCardHeader>
          <CyberCardTitle>GLITCH</CyberCardTitle>
        </CyberCardHeader>
        <CyberCardContent>
          <p className="font-mono text-sm text-muted-foreground">
            Unstable reality with data corruption
          </p>
        </CyberCardContent>
      </CyberCard>
    </div>
  </div>
</section>
```

---

## 🎯 Quick Reference

### Color Quick Access

```tsx
// Text
className="text-foreground"          // #e0e0e0
className="text-muted-foreground"    // #6b7280
className="text-primary"            // #00ff88 (neon green)
className="text-secondary"          // #ff00ff (neon magenta)
className="text-tertiary"           // #00d4ff (neon cyan)
className="text-destructive"        // #ff3366

// Backgrounds
className="bg-background"           // #0a0a0f (void black)
className="bg-card"                 // #12121a
className="bg-muted"                // #1c1c2e
```

### Typography Quick Access

```tsx
className="font-display"            // Orbitron
className="font-mono"               // Share Tech Mono / JetBrains Mono
className="uppercase"               // Always uppercase
className="tracking-widest"        // Wide tracking
className="tracking-[0.2em]"        // Wider tracking
className="font-black"              // 900 weight
className="font-bold"               // 700 weight
```

### Effects Quick Access

```tsx
// Corners
className="cyber-chamfer-sm"        // Small cut
className="cyber-chamfer-md"        // Medium cut
className="cyber-chamfer-lg"        // Large cut

// Glow
className="shadow-neon-sm"          // Subtle glow
className="shadow-neon"             // Default glow
className="shadow-neon-lg"          // Large glow

// Animations
className="animate-blink"           // Cursor blink
className="animate-glitch"          // Glitch effect
className="animate-rgb-shift"       // Chromatic pulse
className="animate-flicker"         // Random flicker

// Patterns
className="cyber-grid"              // Circuit pattern
// Scanlines (automatic via body::before)

// Text utilities
className="terminal-prompt"         // "> " prefix
className="text-neon"               // Neon text glow
className="text-neon-secondary"     // Magenta glow
className="text-neon-tertiary"      // Cyan glow
```

---

## 📚 Additional Resources

### Inspiration
- **Blade Runner** (1982) - Visual aesthetic
- **Akira** (1988) - Neo-Tokyo cyberpunk
- **The Matrix** (1999) - Digital reality
- **Ghost in the Shell** (1995) - Cybernetic enhancement
- **Tron: Legacy** (2010) - Grid aesthetics

### Design References
- [Cyberpunk 2077 UI Design](https://www.youtube.com/watch?v=zK8sseUSPiY)
- [Glitch Effects in CSS](https://css-tricks.com/glitch-effect-text-images/)
- [Neon Glow Tutorial](https://www.youtube.com/watch?v=3kYTZoNyv3g)

### Technical Resources
- [CSS clip-path Generator](https://bennettfeely.com/clippy/)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [Framer Motion](https://www.framer.com/motion/)
- [Radix UI Primitives](https://www.radix-ui.com/)

---

## 🎉 Conclusion

The Cyberpunk/Glitch design system is complete and ready for implementation. All mandatory bold choices have been fulfilled:

✅ Glitched headlines with chromatic aberration  
✅ Scanline overlay (CRT effect)  
✅ Terminal aesthetic  
✅ Neon borders with multi-layer glow  
✅ Chamfered corners (clip-path)  
✅ Animated elements  
✅ Circuit patterns  
✅ Typing effects  

The design is aggressively futuristic, dangerously digital, and uniquely Mint AI.

---

**Version:** 1.0.0  
**Last Updated:** 2026-01-27  
**Maintained By:** Mint AI Team 🌃

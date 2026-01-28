# 🎨 Components Visual Guide

A visual reference for all the new modernized components.

---

## Layout Structure

```
┌─────────────────────────────────────────────────────────────┐
│                        Header (existing)                    │
├──────────┬────────────────────────────┬─────────────────────┤
│          │                            │                     │
│  Files   │        Chat Panel          │    Preview          │
│  Tree    │                            │                     │
│          │  ┌──────────────────────┐ │  ┌───────────────┐  │
│ 📁 src   │  │ User Message         │ │  │  Artifact     │  │
│ 📁 comp  │  │                      │ │  │  Card        │  │
│   📄 App │  │ ┌────────────────┐   │ │  │               │  │
│   📄 Btn │  │ │ Thinking       │   │ │  │  📦 Todo     │  │
│          │  │ │ Planning       │   │ │  │  List        │  │
│ [Search] │  │ └────────────────┘   │ │  │               │  │
│          │  │                      │ │  │  [Edit][Copy] │  │
│ [+ File] │  │ AI Response          │ │  └───────────────┘  │
│          │  │                      │ │                     │
│          │  │ [Code Block]         │ │  OR                 │
│          │  │ [Artifact]           │ │  ┌───────────────┐  │
│          │  │                      │ │  │  Workspace    │  │
│          │  └──────────────────────┘ │  │  Code Editor  │  │
│          │                            │  └───────────────┘  │
│          │  ┌──────────────────────┐ │                     │
│          │  │ Skill Composer       │ │                     │
│          │  │ [🔍] → [📋] → [💻]  │ │                     │
│          │  │ [Execute Chain]      │ │                     │
│          │  └──────────────────────┘ │                     │
│          │                            │                     │
│          │  [Input: Describe code...] │                     │
│          │                            │                     │
└──────────┴────────────────────────────┴─────────────────────┘

  280px          flexible                   400px
  (resize)                                 (resize)
```

---

## Component Screenshots (Description)

### 1. ThreeColumnLayout

**Visual:**
```
┌─────────┬───────────────┬───────────┐
│ Files ▾ │               │ Preview ▾ │
│─────────│               │───────────│
│ 📁 src  │  Chat Area    │ Artifact  │
│ 📁 comps│               │ Card     │
│  📄 App │  [Messages]   │           │
│  📄 Btn │               │           │
│         │  [Input]      │           │
└─────────┴───────────────┴───────────┘
```

**Features:**
- Drag handles between panels
- Collapse buttons (← →)
- Fullscreen toggle (⛶)
- Smooth spring animations

### 2. FileTreeEnhanced

**Visual:**
```
┌─────────────────┐
│ 🔍 Search files │
├─────────────────┤
│ [+ New][Upload] │
├─────────────────┤
│ 📁 src          │
│   📁 components │
│     📄 App.tsx  │
│     📄 Btn.tsx  │
│   📁 lib       │
│ 📄 package.json │
├─────────────────┤
│ 8 files         │
└─────────────────┘
```

**Features:**
- Hierarchical tree
- Language-based icons
- Search filter
- File count
- New/Upload buttons

### 3. InteractiveCodeBlock

**Visual:**
```
┌─────────────────────────────────────────┐
│ 📄 component.tsx  TypeScript            │
├─────────────────────────────────────────┤
│ [▶] [⟳] [⊕] [⍉] [↓] [⛶]              │
├─────────────────────────────────────────┤
│  1  export function Component() {      │
│  2    return (                          │
│  3      <div className="p-4">           │
│  4        <h1>Hello</h1>                │
│  5      </div>                          │
│  6    );                                │
│  7  }                                   │
└─────────────────────────────────────────┘
│                        [Show 13 more]   │
└─────────────────────────────────────────┘
```

**Features:**
- Run (▶)
- Diff (⟳)
- Apply (⊕)
- Copy (⍉)
- Download (↓)
- Fullscreen (⛶)
- Line numbers
- Language colors

### 4. ArtifactCard

**Visual:**
```
┌─────────────────────────────────────────┐
│ 📦  Todo List Component     3 files    │
│                                         │
│ A fully functional todo list with       │
│ drag and drop support                   │
│                                         │
│ [v component.tsx ▼]                     │
│ ┌─────────────────────────────────┐   │
│ │ export function TodoList() {   │   │
│ │   return <div>...</div>         │   │
│ │ }                               │   │
│ └─────────────────────────────────┘   │
│                                         │
│ [Edit] [Apply All]               [Copy]│
│                                         │
│ ▼ All Files                            │
│ ┌─────────────────────────────────┐   │
│ │ 📄 component.tsx  TypeScript    │   │
│ │ 📄 styles.css      CSS          │   │
│ │ 📄 types.ts        TypeScript   │   │
│ └─────────────────────────────────┘   │
└─────────────────────────────────────────┘
```

**Features:**
- Multi-file tabs
- File selector dropdown
- Interactive code block
- Apply to workspace
- Copy all files
- Live preview modal

### 5. SkillComposer

**Visual:**
```
┌─────────────────────────────────────────┐
│ ══ Skill Composer        3 active      │
├─────────────────────────────────────────┤
│                                         │
│ ⋮⋱ 🔍 Search  →  ⋮⋱ 📋 Plan  → ⋮⋱ 💻│
│    [Explore]       [Create]      [Write]│
│                                         │
│ [⚙] [On] [✕]                          │
│                                         │
│ [+ Add Skill]                           │
│                                         │
│ ┌─────────────────────────────────┐   │
│ │ 💡 Brainstorm                  │   │
│ │ 📋 Plan                        │   │
│ │ 💻 Code                        │   │
│ │ 🐛 Debug                       │   │
│ │ 👀 Review                      │   │
│ │ 🔍 Search                      │   │
│ └─────────────────────────────────┘   │
│                                         │
│ [Save Chain]              [Clear All] │
└─────────────────────────────────────────┘
```

**Features:**
- Drag to reorder
- Enable/disable toggle
- Configure button (⚙)
- Remove button (✕)
- Skill picker dropdown
- Execute chain button
- Visual flow arrows

### 6. SkillMarketplace

**Visual:**
```
┌─────────────────────────────────────────┐
│ 📦 Skill Marketplace                    │
│                                         │
│ Discover and install community skills   │
│                                         │
│ 🔍 Search skills...                     │
│                                         │
│ [Read] [Write] [Network] [Execute]      │
│                                         │
├─────────────────────────────────────────┤
│ ┌────────────────┐ ┌────────────────┐ │
│ │📦 Memory Prof │ │📦 API Tester   │ │
│ │                │ │                │ │
│ │ Analyze memory │ │ Test API       │ │
│ │ usage and      │ │ endpoints,     │
│ │ detect leaks   │ │ generate mock  │
│ │                │ │ data           │ │
│ │ [🛡 Verified]  │ │ [🛡 Verified]  │ │
│ │                │ │                │ │
│ │ [Read]         │ │ [Net]          │ │
│ │ v1.2.0   [Inst]│ │ v2.0.1   [Inst]│ │
│ └────────────────┘ └────────────────┘ │
│                                         │
│ ┌────────────────┐ ┌────────────────┐ │
│ │📦 DB Migrator  │ │📦 ...          │ │
│ │                │ │                │ │
│ │ Generate and   │ │                │ │
│ │ manage DB      │ │                │ │
│ │ migrations     │ │                │ │
│ │                │ │                │ │
│ │ [⚠ Elevated]   │ │                │ │
│ │                │ │                │ │
│ │ [Write][Exec]  │ │                │ │
│ │ v1.0.0   [Inst]│ │                │ │
│ └────────────────┘ └────────────────┘ │
└─────────────────────────────────────────┘
```

**Features:**
- Search skills
- Filter by permissions
- Trusted source badges (🛡)
- Permission warnings (⚠)
- Install button
- Version display
- Detail modal

---

## Color Scheme

### InteractiveCodeBlock
```css
/* Light Mode */
bg-zinc-950
border-border/40

/* Header */
bg-zinc-900/50

/* Buttons (hover) */
hover:bg-zinc-800

/* Status Colors */
- Run: text-green-400
- Diff: text-blue-400
- Apply: text-primary
```

### SkillComposer
```css
/* Brainstorm */
bg-purple-100 text-purple-800

/* Plan */
bg-blue-100 text-blue-800

/* Code */
bg-green-100 text-green-800

/* Debug */
bg-red-100 text-red-800

/* Search */
bg-cyan-100 text-cyan-800
```

### ArtifactCard
```css
/* Card */
bg-card
border-border/40
shadow-lg

/* Header */
bg-muted/30

/* Active Tab */
bg-primary/10 text-primary

/* Buttons */
bg-primary/10 hover:bg-primary/20
```

---

## Animation Timing

### Panel Collapse/Expand
```typescript
transition={{ type: 'spring', stiffness: 300, damping: 30 }}
// ~300ms with smooth spring
```

### Message Fade In
```typescript
initial={{ opacity: 0, y: 10 }}
animate={{ opacity: 1, y: 0 }}
// ~200ms smooth fade
```

### Artifact Expand
```typescript
initial={{ height: 0, opacity: 0 }}
animate={{ height: 'auto', opacity: 1 }}
// ~200ms smooth expand
```

---

## Responsive Breakpoints

```css
/* Desktop (default) */
ThreeColumnLayout: 280px | flex | 400px

/* Tablet */
ThreeColumnLayout: 240px | flex | 320px

/* Mobile */
ThreeColumnLayout: collapsed | flex | collapsed
(panels toggle via buttons)
```

---

## Icon Usage

| Icon | Usage | Size |
|------|-------|------|
| 📁 Package | Artifact card header | 24px |
| 📄 File | File tree | 14px |
| ▶ Play | Run code | 14px |
| ⟳ Diff | Compare code | 14px |
| ⊕ External | Apply code | 14px |
| ⍉ Copy | Copy code | 14px |
| ⛶ Maximize | Fullscreen | 14px |
| ⋮⋱ Grip | Drag handle | 14px |
| 🔍 Search | Search input | 16px |
| 🛡 Shield | Trusted badge | 14px |
| ⚠ Alert | Permission warning | 12px |

---

## State Management

### Panel Collapse
```typescript
const [leftCollapsed, setLeftCollapsed] = useState(false);
const [rightCollapsed, setRightCollapsed] = useState(false);
```

### Artifact Files
```typescript
const [activeFileIndex, setActiveFileIndex] = useState(0);
const [showFullscreen, setShowFullscreen] = useState(false);
```

### Skill Chain
```typescript
const [chain, setChain] = useState<SkillChainItem[]>([]);
const [isExpanded, setIsExpanded] = useState(false);
```

### Marketplace
```typescript
const [installedSkills, setInstalledSkills] = useState<Set<string>>(new Set());
const [installing, setInstalling] = useState<Set<string>>(new Set());
```

---

## Typography

### Headers
```css
text-2xl font-bold       /* Page titles */
text-xl font-semibold    /* Section headers */
text-sm font-semibold    /* Card titles */
```

### Body
```css
text-sm                  /* Default body */
text-xs                  /* Small text */
text-[10px]              /* Tiny text */
```

### Code
```css
font-mono text-sm         /* Code blocks */
text-xs                  /* Inline code */
```

---

## Spacing

### Components
```css
p-4                     /* Standard padding */
p-6                     /* Large padding */
p-3                     /* Small padding */
```

### Gaps
```css
gap-2                   /* Small gap */
gap-3                   /* Medium gap */
gap-4                   /* Large gap */
```

### Margins
```css
mb-4                    /* Bottom margin */
mt-2                    /* Top margin */
```

---

## Border Radius

```css
rounded-lg               /* Cards */
rounded-xl               /* Large cards */
rounded-2xl              /* Buttons */
rounded-full             /* Badges */
```

---

## Shadows

```css
shadow-lg                /* Artifact cards */
shadow-sm                /* Code blocks */
shadow-2xl               /* Modals */
shadow-md                /* Hover states */
```

---

## This guide provides a complete visual reference for integrating and customizing all the new components!

**Next:** Check out `INTEGRATION_GUIDE.md` for step-by-step integration instructions.

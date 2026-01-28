# Chat Panel Modernization - Integration Guide

This guide shows you how to integrate all the new modernized components into your Mint AI application.

## 📋 Table of Contents
1. [Quick Start](#quick-start)
2. [Component Integration](#component-integration)
3. [Advanced Usage](#advanced-usage)
4. [Obra Superpowers Integration](#obra-superpowers-integration)
5. [Migration Checklist](#migration-checklist)

---

## 🚀 Quick Start

### Step 1: Update your main page layout

Replace your current `ResizablePanels` with the new `ThreeColumnLayout`:

```typescript
// app/page.tsx
import { useState } from 'react';
import { ThreeColumnLayout } from '@/components/ThreeColumnLayout';
import { FileTreeEnhanced } from '@/components/FileTreeEnhanced';
import ChatPanel from '@/components/ChatPanel';
import { ArtifactCard } from '@/components/ArtifactCard';

export default function Home() {
  const [leftCollapsed, setLeftCollapsed] = useState(false);
  const [rightCollapsed, setRightCollapsed] = useState(false);

  return (
    <main className="h-screen flex flex-col bg-background">
      {/* Your existing Header */}
      <Header {...headerProps} />

      {/* NEW: Three-Column Layout */}
      <div className="flex-1 overflow-hidden">
        <ThreeColumnLayout
          leftCollapsed={leftCollapsed}
          onLeftCollapse={setLeftCollapsed}
          rightCollapsed={rightCollapsed}
          onRightCollapse={setRightCollapsed}
          defaultLeftWidth={280}
          defaultRightWidth={400}
          
          // Left Panel: File Tree
          leftPanel={
            <FileTreeEnhanced
              files={workspace?.files || {}}
              activePath={workspace?.activePath || null}
              onSelectPath={(path) => {
                setWorkspace(prev => prev ? { ...prev, activePath: path } : prev);
              }}
              onCreateFile={() => {/* Create new file */}}
              onUploadFile={() => {/* Upload file */}}
            />
          }
          
          // Center Panel: Chat
          centerPanel={
            <ChatPanel
              messages={messages}
              isLoading={isLoading}
              onSendMessage={handleSendMessage}
              messagesEndRef={messagesEndRef}
              status={inputStatus}
              activeSkill={activeSkill}
              planStatus={currentPlan?.status}
              canStartBuild={canStartBuild}
              hasUnansweredQuestions={hasUnansweredQuestions}
              onApprovePlan={handleApprovePlan}
              onReviewPlan={handleReviewPlan}
            />
          }
          
          // Right Panel: Preview/Artifacts
          rightPanel={
            <PreviewPanel
              artifacts={artifacts}
              workspace={workspace}
              onUpdateFile={handleUpdateFile}
            />
          }
        />
      </div>
    </main>
  );
}
```

### Step 2: Create a Preview Panel component

```typescript
// components/PreviewPanel.tsx
'use client';

import { ArtifactCard } from '@/components/ArtifactCard';
import { WorkspacePanel } from '@/components/WorkspacePanel';

interface PreviewPanelProps {
  artifacts: any[];
  workspace: WorkspaceState | null;
  onUpdateFile: (path: string, content: string) => void;
}

export function PreviewPanel({ artifacts, workspace, onUpdateFile }: PreviewPanelProps) {
  return (
    <div className="h-full flex flex-col">
      {artifacts.length > 0 ? (
        // Show artifacts (generated code components)
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {artifacts.map(artifact => (
            <ArtifactCard
              key={artifact.id}
              id={artifact.id}
              title={artifact.title}
              description={artifact.description}
              files={artifact.files}
              onEdit={(file) => console.log('Edit file:', file)}
              onApply={(files) => console.log('Apply files:', files)}
            />
          ))}
        </div>
      ) : (
        // Show workspace (existing code)
        <div className="h-full">
          <WorkspacePanel
            workspace={workspace}
            readOnly={false}
            isStreaming={false}
            onSelectPath={(path) => console.log('Select:', path)}
            onUpdateFile={onUpdateFile}
          />
        </div>
      )}
    </div>
  );
}
```

---

## 🔧 Component Integration

### 1. InteractiveCodeBlock

Use in `MessageItem.tsx` to display code with rich interactions:

```typescript
// components/MessageItem.tsx
import { InteractiveCodeBlock } from '@/components/InteractiveCodeBlock';

// Inside your message rendering
{message.code && (
  <InteractiveCodeBlock
    code={message.code}
    language="typescript"
    filename="component.tsx"
    onRun={() => console.log('Run code')}
    onDiff={(before, after) => console.log('Diff:', before, after)}
    onApply={(code) => console.log('Apply:', code)}
  />
)}
```

### 2. ArtifactCard

Use for multi-file outputs:

```typescript
// When parsing project output
const artifact = {
  id: 'artifact-1',
  title: 'Todo List Component',
  description: 'A fully functional todo list with drag and drop',
  files: [
    {
      path: 'components/TodoList.tsx',
      code: 'export function TodoList() { ... }',
      language: 'typescript'
    },
    {
      path: 'components/TodoItem.tsx',
      code: 'export function TodoItem() { ... }',
      language: 'typescript'
    }
  ]
};

// Render artifact
<ArtifactCard
  {...artifact}
  onEdit={(file) => openInEditor(file)}
  onApply={(files) => applyToWorkspace(files)}
/>
```

### 3. SkillComposer

Add to your chat input area:

```typescript
// components/ChatPanel.tsx (or new ChatInputAdvanced.tsx)
import { SkillComposer } from '@/components/SkillComposer';
import { SkillType } from '@/types/skill';

const [showSkillComposer, setShowSkillComposer] = useState(false);
const [customSkillChain, setCustomSkillChain] = useState<SkillChainItem[]>([]);

// In your chat UI
{showSkillComposer && (
  <SkillComposer
    initialChain={customSkillChain}
    onExecute={(chain) => {
      console.log('Execute skill chain:', chain);
      sendMessage('/chain:' + JSON.stringify(chain));
    }}
    onSave={(chain) => {
      setCustomSkillChain(chain);
      localStorage.setItem('custom-skill-chain', JSON.stringify(chain));
    }}
  />
)}
```

### 4. SkillMarketplace

Add to settings or a dedicated page:

```typescript
// app/settings/skills/page.tsx
'use client';

import { SkillMarketplace } from '@/components/SkillMarketplace';
import { externalSkillRegistry } from '@/lib/skills/external-registry';

export default function SkillsSettingsPage() {
  return (
    <div className="container max-w-6xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Skill Marketplace</h1>
      
      <SkillMarketplace
        onInstall={(manifest) => {
          console.log('Installed skill:', manifest.name);
          toast.success(`Installed ${manifest.name}`);
        }}
      />
    </div>
  );
}
```

---

## 🎨 Advanced Usage

### Keyboard Shortcuts

The new layout comes with built-in keyboard shortcuts:

- **Cmd/Ctrl + [**: Toggle left panel (Files)
- **Cmd/Ctrl + ]**: Toggle right panel (Preview)
- **F11**: Toggle fullscreen for preview panel

### Custom Panel Widths

```typescript
<ThreeColumnLayout
  defaultLeftWidth={320}  // Wider file tree
  defaultRightWidth={600} // Wider preview panel
  minLeftWidth={220}
  minRightWidth={400}
  // ...
/>
```

### Artifact Auto-Detection

Automatically detect when output should be shown as artifact:

```typescript
// In your chat stream handler
case 'code-chunk': {
  streamedCode += data.content;
  
  // Detect if this is a multi-file project
  const hasMultipleFiles = 
    (streamedCode.match(/```file:/g) || []).length >= 2;
  
  if (hasMultipleFiles) {
    const parsed = parseProjectOutput(streamedCode);
    if (parsed.type === 'project') {
      // Convert to artifact format
      const artifact = {
        id: `artifact-${Date.now()}`,
        title: parsed.projectName || 'Generated Project',
        description: 'AI-generated multi-file project',
        files: Object.entries(parsed.files).map(([path, code]) => ({
          path,
          code,
          language: detectLanguage(path),
        })),
      };
      setArtifacts(prev => [...prev, artifact]);
    }
  }
  break;
}
```

---

## 🔌 Obra Superpowers Integration

### Installing Obra Skills

```typescript
// Load Obra skills from npm
import { externalSkillRegistry } from '@/lib/skills/external-registry';

async function loadObraSkills() {
  // Option 1: Load from npm package
  await externalSkillRegistry.loadFromNpm('@obra/superpowers');
  
  // Option 2: Load specific skill
  await externalSkillRegistry.loadFromPath('./skills/obra-memory-profiler.ts');
  
  // Option 3: Load from URL
  await externalSkillRegistry.loadFromUrl('https://cdn.obra.dev/skills/memory-profiler.js');
}

// Call on app mount
useEffect(() => {
  loadObraSkills();
}, []);
```

### Creating Custom Obra-Style Skills

```typescript
// skills/my-custom-skill.ts
import { SkillManifest } from '@/lib/skills/external-registry';

const manifest: SkillManifest = {
  id: '@my-org/awesome-skill',
  name: 'Awesome Skill',
  version: '1.0.0',
  author: 'Your Name',
  description: 'Does amazing things',
  permissions: ['read_files', 'write_files'],
  skills: [
    {
      type: 'awesome_action',
      name: 'Awesome Action',
      description: 'Performs awesome action',
      triggerPatterns: [/do something awesome/i],
      stage: 'coding',
      requiresFiles: true,
      supportsStreaming: true,
      handler: 'awesomeActionHandler',
    }
  ],
  repository: 'https://github.com/your-org/skills',
  license: 'MIT',
};

// Handler function
export async function awesomeActionHandler(context: any) {
  // Your skill logic here
  return {
    success: true,
    result: 'Awesome action completed!',
  };
}

export { manifest };
```

### Using Custom Skills in Chat

```typescript
// Register and use
import { externalSkillRegistry } from '@/lib/skills/external-registry';
import myCustomSkill from './skills/my-custom-skill';

// Register
await externalSkillRegistry.registerSkill(myCustomSkill.manifest);

// Now it will auto-trigger when user types "do something awesome"
```

---

## ✅ Migration Checklist

- [ ] **Phase 1: Layout**
  - [ ] Replace `ResizablePanels` with `ThreeColumnLayout`
  - [ ] Add `FileTreeEnhanced` to left panel
  - [ ] Move workspace preview to right panel
  - [ ] Test keyboard shortcuts (Cmd+[, Cmd+], F11)
  - [ ] Test panel resizing

- [ ] **Phase 2: Messages**
  - [ ] Add `InteractiveCodeBlock` to `MessageItem`
  - [ ] Implement `ArtifactCard` for multi-file outputs
  - [ ] Add artifact parsing logic
  - [ ] Test copy, download, run actions

- [ ] **Phase 3: Skills**
  - [ ] Add `SkillComposer` toggle button
  - [ ] Implement skill chain execution
  - [ ] Test skill reordering
  - [ ] Add skill chain save/load

- [ ] **Phase 4: Marketplace**
  - [ ] Create `/settings/skills` route
  - [ ] Add `SkillMarketplace` component
  - [ ] Test skill installation
  - [ ] Implement permission dialogs

- [ ] **Phase 5: Polish**
  - [ ] Update theme colors for new components
  - [ ] Add loading states
  - [ ] Test responsive design
  - [ ] Add error boundaries
  - [ ] Update accessibility labels

---

## 🎯 Quick Wins

Here are the easiest ways to see immediate benefits:

### 1. **Swap the Layout** (5 minutes)
Just replace `ResizablePanels` with `ThreeColumnLayout` - instant modern look!

### 2. **Add Interactive Code** (10 minutes)
Import `InteractiveCodeBlock` and use it in your message renderer.

### 3. **Enable Skill Composer** (15 minutes)
Add a toggle button in your chat area to show/hide the composer.

### 4. **Create First Artifact** (20 minutes)
Parse multi-file outputs and show them in `ArtifactCard`.

---

## 🐛 Troubleshooting

### Panel Resizing Not Working
- Ensure you're using the ref-based drag handlers
- Check for conflicting CSS that sets fixed widths

### Artifacts Not Showing
- Verify your project output parser is detecting multiple files
- Check that file objects have the correct structure: `{ path, code, language }`

### Skill Composer Not Saving
- Ensure you're persisting to localStorage or a database
- Check that the chain structure matches `SkillChainItem[]`

### External Skills Not Loading
- Verify the package exports a `manifest` object
- Check browser console for import errors
- Ensure permissions are granted

---

## 📚 Additional Resources

- **Component Docs**: See inline TypeScript comments
- **Examples**: Check the `examples/` folder
- **Obra Docs**: https://obra.dev/docs
- **Framer Motion**: https://www.framer.com/motion/

---

## 🎉 You're Ready!

You now have a modern, professional AI coding interface comparable to Cursor, Windsurf, and v0.dev!

**Key Improvements:**
- ✅ Three-column layout (Files | Chat | Preview)
- ✅ Interactive code blocks with actions
- ✅ Artifact cards for multi-file projects
- ✅ Visual skill composition
- ✅ External skill marketplace
- ✅ Smooth animations throughout
- ✅ Keyboard shortcuts
- ✅ Responsive design

Enjoy your modernized Mint AI! 🚀

// ─────────────────────────────────────────────────────────────────────────────
// Content Parser for Enhanced Message Display
// Detects code blocks, artifacts, and formats content for rendering
// ─────────────────────────────────────────────────────────────────────────────

export interface CodeBlock {
  language: string;
  code: string;
  filename?: string;
  startIndex: number;
  endIndex: number;
}

export interface Artifact {
  id: string;
  title: string;
  description?: string;
  files: Array<{
    path: string;
    code: string;
    language: string;
  }>;
  previewUrl?: string;
  startIndex: number;
  endIndex: number;
}

export interface ContentSegment {
  type: 'text' | 'code' | 'artifact';
  content?: string;
  codeBlock?: CodeBlock;
  artifact?: Artifact;
}

// ─────────────────────────────────────────────────────────────────────────────
// Code Block Detection
// ─────────────────────────────────────────────────────────────────────────────

function detectCodeBlocks(content: string): CodeBlock[] {
  const codeBlocks: CodeBlock[] = [];
  const codeBlockRegex = /```(\w+)?(?:\[:([\w\-./]+)\])?\n([\s\S]*?)```/g;
  let match;

  while ((match = codeBlockRegex.exec(content)) !== null) {
    const language = match[1] || 'text';
    const filename = match[2] || undefined;
    const code = match[3];
    const startIndex = match.index;
    const endIndex = startIndex + match[0].length;

    codeBlocks.push({
      language,
      code,
      filename,
      startIndex,
      endIndex,
    });
  }

  return codeBlocks;
}

// ─────────────────────────────────────────────────────────────────────────────
// Artifact Detection
// ─────────────────────────────────────────────────────────────────────────────

function detectArtifacts(content: string): Artifact[] {
  const artifacts: Artifact[] = [];
  const artifactRegex = /<artifact\s+title="([^"]+)"(?:\s+description="([^"]*)")?>([\s\S]*?)<\/artifact>/gi;
  let match;
  let artifactIndex = 0;

  while ((match = artifactRegex.exec(content)) !== null) {
    const title = match[1];
    const description = match[2] || undefined;
    const artifactContent = match[3];
    const startIndex = match.index;
    const endIndex = startIndex + match[0].length;

    // Parse files from artifact content
    const files = parseArtifactFiles(artifactContent);

    if (files.length > 0) {
      artifacts.push({
        id: `artifact-${Date.now()}-${artifactIndex++}`,
        title,
        description,
        files,
        startIndex,
        endIndex,
      });
    }
  }

  return artifacts;
}

function parseArtifactFiles(content: string): Array<{ path: string; code: string; language: string }> {
  const files: Array<{ path: string; code: string; language: string }> = [];
  const fileRegex = /<file\s+path="([^"]+)"(?:\s+language="([^"]*)")?>([\s\S]*?)<\/file>/gi;
  let match;

  while ((match = fileRegex.exec(content)) !== null) {
    const path = match[1];
    const language = match[2] || detectLanguageFromPath(path);
    const code = match[3].trim();

    files.push({ path, code, language });
  }

  return files;
}

function detectLanguageFromPath(path: string): string {
  const ext = path.split('.').pop()?.toLowerCase();
  const languageMap: Record<string, string> = {
    ts: 'typescript',
    tsx: 'typescript',
    js: 'javascript',
    jsx: 'javascript',
    py: 'python',
    java: 'java',
    cpp: 'cpp',
    c: 'c',
    go: 'go',
    rs: 'rust',
    rb: 'ruby',
    php: 'php',
    swift: 'swift',
    kt: 'kotlin',
    css: 'css',
    scss: 'scss',
    html: 'html',
    json: 'json',
    md: 'markdown',
    yaml: 'yaml',
    yml: 'yaml',
    sql: 'sql',
    sh: 'bash',
    xml: 'xml',
  };

  return languageMap[ext || ''] || 'text';
}

// ─────────────────────────────────────────────────────────────────────────────
// Content Segmentation
// ─────────────────────────────────────────────────────────────────────────────

export function parseContentSegments(content: string): ContentSegment[] {
  const segments: ContentSegment[] = [];
  const codeBlocks = detectCodeBlocks(content);
  const artifacts = detectArtifacts(content);

  // Merge all special blocks and sort by start index
  const specialBlocks = [
    ...codeBlocks.map((cb) => ({ type: 'code' as const, data: cb, start: cb.startIndex, end: cb.endIndex })),
    ...artifacts.map((art) => ({ type: 'artifact' as const, data: art, start: art.startIndex, end: art.endIndex })),
  ].sort((a, b) => a.start - b.start);

  // Build segments
  let currentIndex = 0;

  for (const block of specialBlocks) {
    // Add text segment before this block
    if (block.start > currentIndex) {
      const textContent = content.slice(currentIndex, block.start).trim();
      if (textContent) {
        segments.push({
          type: 'text',
          content: textContent,
        });
      }
    }

    // Add the special block segment
    if (block.type === 'code') {
      segments.push({
        type: 'code',
        codeBlock: block.data,
      });
    } else if (block.type === 'artifact') {
      segments.push({
        type: 'artifact',
        artifact: block.data,
      });
    }

    currentIndex = block.end;
  }

  // Add remaining text after last block
  if (currentIndex < content.length) {
    const textContent = content.slice(currentIndex).trim();
    if (textContent) {
      segments.push({
        type: 'text',
        content: textContent,
      });
    }
  }

  // If no special blocks found, treat entire content as text
  if (segments.length === 0) {
    segments.push({
      type: 'text',
      content: content.trim(),
    });
  }

  return segments;
}

// ─────────────────────────────────────────────────────────────────────────────
// Utility Functions
// ─────────────────────────────────────────────────────────────────────────────

export function hasCodeBlocks(content: string): boolean {
  return /```(\w+)?/.test(content);
}

export function hasArtifacts(content: string): boolean {
  return /<artifact\s+title="[^"]+"/.test(content);
}

export function extractLanguageFromCodeBlock(codeBlock: string): string {
  const match = codeBlock.match(/^```(\w+)/);
  return match ? match[1] : 'text';
}

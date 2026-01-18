import { describe, expect, test } from 'bun:test';

// Note: In a real environment, we'd import this from route.ts.
// Since we're in a test environment, we'll re-implement or import if possible.
// For now, I'll copy the core logic or use the file directly if the test environment supports it.

// Mock Controller
class MockController {
  enqueued: string[] = [];
  enqueue(chunk: Uint8Array) {
    this.enqueued.push(new TextDecoder().decode(chunk));
  }
}

// Re-defining for test (Real import would be better if Bun supports it)
type StreamEventType = 'explanation-chunk' | 'reasoning-chunk' | 'code-chunk' | 'reasoning-complete' | 'tool-results' | 'done' | 'error';

class StreamingParser {
  private buffer = '';
  private inReasoning = false;
  private inCodeBlock = false;
  private codeBlockStartTag = '';
  private encoder = new TextEncoder();
  private lookaheadSize = 15;

  constructor(
    private controller: any,
    private chatId: string,
    private iteration: number
  ) {}

  public async push(content: string) {
    this.buffer += content;
    await this.processBuffer();
  }

  private async processBuffer() {
    while (this.buffer.length > this.lookaheadSize) {
      if (this.inReasoning) {
        if (this.buffer.includes('</reasoning>')) {
          const endIndex = this.buffer.indexOf('</reasoning>');
          const content = this.buffer.substring(0, endIndex);
          if (content) this.emit('reasoning-chunk', content);
          this.emit('reasoning-complete');
          this.inReasoning = false;
          this.buffer = this.buffer.substring(endIndex + '</reasoning>'.length);
        } else {
          const emitSize = this.buffer.length - this.lookaheadSize;
          if (emitSize > 0) {
            this.emit('reasoning-chunk', this.buffer.substring(0, emitSize));
            this.buffer = this.buffer.substring(emitSize);
          }
          break;
        }
      } else if (this.inCodeBlock) {
        if (this.buffer.includes('```')) {
          const endIndex = this.buffer.indexOf('```');
          const content = this.buffer.substring(0, endIndex);
          this.emit('code-chunk', content, this.extractLang(this.codeBlockStartTag));
          this.inCodeBlock = false;
          this.codeBlockStartTag = '';
          this.buffer = this.buffer.substring(endIndex + 3);
        } else {
          const emitSize = this.buffer.length - this.lookaheadSize;
          if (emitSize > 0) {
            this.emit('code-chunk', this.buffer.substring(0, emitSize), this.extractLang(this.codeBlockStartTag));
            this.buffer = this.buffer.substring(emitSize);
          }
          break;
        }
      } else {
        const reasoningStartIdx = this.buffer.indexOf('<reasoning>');
        const codeStartMatch = this.buffer.match(/```([a-zA-Z0-9_-]+|file:[^\n]*)?/);
        const codeStartIdx = codeStartMatch?.index ?? -1;

        if (reasoningStartIdx !== -1 && (codeStartIdx === -1 || reasoningStartIdx < codeStartIdx)) {
          const before = this.buffer.substring(0, reasoningStartIdx);
          if (before) this.emit('explanation-chunk', before);
          this.inReasoning = true;
          this.buffer = this.buffer.substring(reasoningStartIdx + '<reasoning>'.length);
        } else if (codeStartIdx !== -1) {
          const before = this.buffer.substring(0, codeStartIdx);
          if (before) this.emit('explanation-chunk', before);
          this.inCodeBlock = true;
          this.codeBlockStartTag = codeStartMatch![0];
          this.buffer = this.buffer.substring(codeStartIdx + this.codeBlockStartTag.length);
        } else {
          const emitSize = this.buffer.length - this.lookaheadSize;
          if (emitSize > 0) {
            this.emit('explanation-chunk', this.buffer.substring(0, emitSize));
            this.buffer = this.buffer.substring(emitSize);
          }
          break;
        }
      }
    }
  }

  public async finalize() {
    this.lookaheadSize = 0;
    await this.processBuffer();
    if (this.buffer) {
      this.emit(this.inReasoning ? 'reasoning-chunk' : (this.inCodeBlock ? 'code-chunk' : 'explanation-chunk'), this.buffer);
      this.buffer = '';
    }
  }

  private emit(type: StreamEventType, content?: string, language?: string) {
    const payload: any = { type, chatId: this.chatId, iteration: this.iteration };
    if (content !== undefined) payload.content = content;
    if (language !== undefined) payload.language = language;
    this.controller.enqueue(this.encoder.encode(`data: ${JSON.stringify(payload)}\n\n`));
  }

  private extractLang(tag: string): string {
    const langMatch = tag.match(/```([a-zA-Z0-9_-]+|file:[^\n]*)/);
    return langMatch ? langMatch[1] : '';
  }
}

describe('StreamingParser', () => {
  test('handles fragmented reasoning tags', async () => {
    const controller = new MockController();
    const parser = new StreamingParser(controller, 'test-chat', 1);

    await parser.push('Initial text. <re');
    await parser.push('asoning>Thought content. </rea');
    await parser.push('soning> Final text.');
    await parser.finalize();

    const events = controller.enqueued.map(e => JSON.parse(e.replace('data: ', '')));
    
    const explanationContent = events
      .filter(e => e.type === 'explanation-chunk')
      .map(e => e.content)
      .join('');
    
    const reasoningContent = events
      .filter(e => e.type === 'reasoning-chunk')
      .map(e => e.content)
      .join('');

    expect(explanationContent).toContain('Initial text.');
    expect(explanationContent).toContain('Final text.');
    expect(reasoningContent).toContain('Thought content.');
    expect(events.some(e => e.type === 'reasoning-complete')).toBe(true);
  });

  test('handles fragmented code blocks', async () => {
    const controller = new MockController();
    const parser = new StreamingParser(controller, 'test-chat', 1);

    await parser.push('Some code: ``');
    await parser.push('`typescript\nconst x = 1;');
    await parser.push('\n``');
    await parser.push('`');
    await parser.finalize();

    const events = controller.enqueued.map(e => JSON.parse(e.replace('data: ', '')));
    
    const codeContent = events
      .filter(e => e.type === 'code-chunk')
      .map(e => e.content)
      .join('');
    
    expect(codeContent).toContain('const x = 1;');
    expect(events.some(e => e.type === 'code-chunk' && e.language === 'typescript')).toBe(true);
  });
});

function extractAccumulatedCodeFromStream(chunks: string[]): string {
  let buffer = '';
  let inCodeBlock = false;
  let accumulatedCode = '';
  let pendingFileMarker = false;

  const readFenceLine = () => {
    const lineEnd = buffer.indexOf('\n');
    if (lineEnd === -1) return '';
    const firstLine = buffer.substring(0, lineEnd).trim();
    const nextLineStart = lineEnd + 1;
    const nextLineEnd = buffer.indexOf('\n', nextLineStart);

    if (!firstLine && nextLineEnd !== -1) {
      const nextLine = buffer.substring(nextLineStart, nextLineEnd).trim();
      if (nextLine.startsWith('file:')) {
        buffer = buffer.substring(nextLineEnd + 1);
        return nextLine;
      }
    }
    if (!firstLine && nextLineEnd === -1) {
      pendingFileMarker = true;
    }

    buffer = buffer.substring(lineEnd + 1);
    return firstLine;
  };

  const extractFileToken = (line: string): string => {
    if (!line) return '';
    const tokens = line.split(/\s+/).filter(Boolean);
    const fileToken = tokens.find((token) => token.startsWith('file:'));
    const isSimpleTag =
      tokens.length === 1 && /^(file:[^\s]+|[a-zA-Z0-9_+-]+)$/.test(tokens[0]);

    if (fileToken) return fileToken;
    if (isSimpleTag && line.startsWith('file:')) return line;
    return '';
  };

  for (const chunk of chunks) {
    buffer += chunk;
    while (buffer.includes('```')) {
      const idx = buffer.indexOf('```');
      const before = buffer.substring(0, idx);
      if (inCodeBlock) {
        if (pendingFileMarker && before.includes('\n')) {
          const lineEnd = before.indexOf('\n');
          const firstLine = before.substring(0, lineEnd).trim();
          if (firstLine.startsWith('file:')) {
            accumulatedCode += '```' + firstLine + '\n';
            accumulatedCode += before.substring(lineEnd + 1);
          } else {
            accumulatedCode += before;
          }
          pendingFileMarker = false;
        } else {
          accumulatedCode += before;
        }
        accumulatedCode += '```\n';
        buffer = buffer.substring(idx + 3);
        inCodeBlock = false;
        continue;
      }

      buffer = buffer.substring(idx + 3);
      const line = readFenceLine();
      const fileToken = extractFileToken(line);
      if (fileToken) {
        accumulatedCode += '```' + fileToken + '\n';
      }
      inCodeBlock = true;
    }
    if (inCodeBlock && buffer.length) {
      if (pendingFileMarker && buffer.includes('\n')) {
        const lineEnd = buffer.indexOf('\n');
        const firstLine = buffer.substring(0, lineEnd).trim();
        if (firstLine.startsWith('file:')) {
          accumulatedCode += '```' + firstLine + '\n';
          buffer = buffer.substring(lineEnd + 1);
        }
        pendingFileMarker = false;
      }
      accumulatedCode += buffer;
      buffer = '';
    }
  }

  if (inCodeBlock && buffer.length) {
    accumulatedCode += buffer;
  }

  return accumulatedCode;
}

test('preserves file markers when fence line includes language and file', async () => {
  const chunks = [
    '```tsx file:app/page.tsx\n',
    'export default function Page() { return <div>Hi</div>; }\n',
    '```\n',
  ];

  const result = extractAccumulatedCodeFromStream(chunks);
  expect(result).toContain('```file:app/page.tsx');
});

test('continues to preserve plain file-only fences', async () => {
  const chunks = [
    '```file:components/Button.tsx\n',
    'export function Button() { return <button/> }\n',
    '```\n',
  ];

  const result = extractAccumulatedCodeFromStream(chunks);
  expect(result).toContain('```file:components/Button.tsx');
});

test('preserves file markers when file tag is inside code block', async () => {
  const chunks = [
    '```\n',
    'file:app/page.tsx\n',
    'export default function Page() { return null; }\n',
    '```\n',
  ];

  const result = extractAccumulatedCodeFromStream(chunks);
  expect(result).toContain('```file:app/page.tsx');
});

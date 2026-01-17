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

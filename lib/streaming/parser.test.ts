/**
 * SSE Streaming Parser Tests
 *
 * Unit tests for the state machine-based SSE parser
 * 
 * NOTE: This file uses a simple test runner. When vitest is set up,
 * replace the custom test functions with vitest imports.
 */

import {
  createParseState,
  parseSSEChunk,
  flushParseState,
  formatSSEEvent,
  type SSEParseState,
  type SSEEvent,
} from './parser';
import { SkillType } from '@/types/skill';

// Simple test runner until vitest is set up
let testResults: Array<{ name: string; passed: boolean; error?: string }> = [];

function describe(name: string, fn: () => void) {
  console.log(`\n📦 ${name}`);
  fn();
}

function it(name: string, fn: () => void) {
  try {
    fn();
    testResults.push({ name, passed: true });
    console.log(`  ✅ ${name}`);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    testResults.push({ name, passed: false, error: errorMessage });
    console.log(`  ❌ ${name}: ${errorMessage}`);
  }
}

function expect<T>(actual: T) {
  return {
    toBe(expected: T) {
      if (actual !== expected) {
        throw new Error(`Expected ${expected} but got ${actual}`);
      }
    },
    toEqual(expected: T) {
      if (JSON.stringify(actual) !== JSON.stringify(expected)) {
        throw new Error(`Expected ${JSON.stringify(expected)} but got ${JSON.stringify(actual)}`);
      }
    },
    toHaveLength(expected: number) {
      if ((actual as unknown as Array<unknown>).length !== expected) {
        throw new Error(`Expected length ${expected} but got ${(actual as unknown as Array<unknown>).length}`);
      }
    },
    toBeNull() {
      if (actual !== null) {
        throw new Error(`Expected null but got ${actual}`);
      }
    },
    toBeTrue() {
      if (actual !== true) {
        throw new Error(`Expected true but got ${actual}`);
      }
    },
    toContain(expected: string) {
      const str = String(actual);
      if (!str.includes(expected)) {
        throw new Error(`Expected "${str}" to contain "${expected}"`);
      }
    },
  };
}

describe('SSE Parser', () => {
  describe('createParseState', () => {
    it('should create a fresh parse state', () => {
      const state = createParseState();
      expect(state).toEqual({
        buffer: '',
        inCodeBlock: false,
        inThinkingBlock: false,
        thinkingType: null,
        pendingFileMarker: false,
      });
    });
  });

  describe('parseSSEChunk - Plain Text', () => {
    it('should accumulate small chunks without emitting', () => {
      let state = createParseState();
      const result = parseSSEChunk('Hello', state);

      expect(result.events).toHaveLength(0);
      expect(result.newState.buffer).toBe('Hello');
    });

    it('should emit explanation chunk when buffer exceeds min size', () => {
      let state = createParseState();
      const longText = 'This is a long explanation that exceeds twenty chars';
      const result = parseSSEChunk(longText, state);

      expect(result.events).toHaveLength(1);
      const event = result.events[0];
      expect(event.type).toBe('explanation-chunk');
      if (event.type === 'explanation-chunk') {
        expect(event.content).toBe(longText);
      }
      expect(result.newState.buffer).toBe('');
    });

    it('should emit on newline', () => {
      let state = createParseState();
      const result = parseSSEChunk('Line 1\nLine 2', state);

      expect(result.events).toHaveLength(1);
      expect(result.events[0]).toEqual({
        type: 'explanation-chunk',
        content: 'Line 1\nLine 2',
      });
    });

    it('should handle multiple chunks', () => {
      let state = createParseState();

      // First chunk - not enough to emit
      let result = parseSSEChunk('Hello ', state);
      expect(result.events).toHaveLength(0);
      state = result.newState;

      // Second chunk - now enough to emit
      result = parseSSEChunk('world! This is a longer text.', state);
      expect(result.events).toHaveLength(1);
      expect(result.events[0].type).toBe('explanation-chunk');
      const event = result.events[0];
      if (event.type === 'explanation-chunk') {
        expect(event.content).toBe('Hello world! This is a longer text.');
      }
    });
  });

  describe('parseSSEChunk - Thinking Blocks', () => {
    it('should detect thinking start tag', () => {
      let state = createParseState();
      const result = parseSSEChunk('Before <thinking type="requirements">Content here', state);

      expect(result.events).toHaveLength(1);
      expect(result.events[0]).toEqual({
        type: 'explanation-chunk',
        content: 'Before ',
      });
      expect(result.newState.inThinkingBlock).toBe(true);
      expect(result.newState.thinkingType).toBe('requirements');
      expect(result.newState.buffer).toBe('Content here');
    });

    it('should emit thinking chunks', () => {
      let state = createParseState();
      state = { ...state, inThinkingBlock: true, thinkingType: 'architecture' };

      const result = parseSSEChunk('This is the thinking content that is long enough to emit', state);

      expect(result.events).toHaveLength(1);
      expect(result.events[0]).toEqual({
        type: 'thinking-chunk',
        thinkingType: 'architecture',
        content: 'This is the thinking content that is long enough to emit',
      });
    });

    it('should complete thinking block on end tag', () => {
      let state = createParseState();
      state = {
        ...state,
        inThinkingBlock: true,
        thinkingType: 'requirements',
        buffer: 'Some thinking content',
      };

      const result = parseSSEChunk(' more content</thinking>After', state);

      expect(result.events).toHaveLength(2);
      expect(result.events[0]).toEqual({
        type: 'thinking-chunk',
        thinkingType: 'requirements',
        content: 'Some thinking content more content',
      });
      expect(result.events[1]).toEqual({
        type: 'thinking-complete',
        thinkingType: 'requirements',
      });
      expect(result.newState.inThinkingBlock).toBe(false);
      expect(result.newState.thinkingType).toBeNull();
      expect(result.newState.buffer).toBe('After');
    });

    it('should handle partial thinking end tag', () => {
      let state = createParseState();
      state = {
        ...state,
        inThinkingBlock: true,
        thinkingType: 'requirements',
        buffer: 'Content',
      };

      // Partial end tag - should hold back
      const result = parseSSEChunk(' more </thi', state);

      // Should emit safe content before the partial tag
      expect(result.events).toHaveLength(1);
      expect(result.events[0].type).toBe('thinking-chunk');
      expect(result.newState.buffer).toBe('</thi');
    });

    it('should handle empty thinking block', () => {
      let state = createParseState();
      state = {
        ...state,
        inThinkingBlock: true,
        thinkingType: 'requirements',
        buffer: '',
      };

      const result = parseSSEChunk('</thinking>After', state);

      expect(result.events).toHaveLength(1);
      expect(result.events[0]).toEqual({
        type: 'thinking-complete',
        thinkingType: 'requirements',
      });
      expect(result.newState.buffer).toBe('After');
    });
  });

  describe('parseSSEChunk - Code Blocks', () => {
    it('should detect code block start', () => {
      let state = createParseState();
      const result = parseSSEChunk('Here is code: ```const x = 1', state);

      expect(result.events).toHaveLength(1);
      expect(result.events[0]).toEqual({
        type: 'explanation-chunk',
        content: 'Here is code: ',
      });
      expect(result.newState.inCodeBlock).toBe(true);
      expect(result.newState.pendingFileMarker).toBe(true);
    });

    it('should emit file marker event after code block start', () => {
      let state = createParseState();
      state = { ...state, inCodeBlock: true, pendingFileMarker: true };

      const result = parseSSEChunk('file:app/page.tsx\nconst x = 1', state);

      expect(result.events).toHaveLength(2);
      expect(result.events[0]).toEqual({
        type: 'file-marker',
        marker: 'file:app/page.tsx',
      });
      expect(result.events[1]).toEqual({
        type: 'code-chunk',
        content: 'const x = 1',
      });
      expect(result.newState.pendingFileMarker).toBe(false);
    });

    it('should emit file marker event on second line', () => {
      let state = createParseState();
      state = { ...state, inCodeBlock: true, pendingFileMarker: true };

      const result = parseSSEChunk('\nfile:app/page.tsx\nconst x = 1', state);

      expect(result.events).toHaveLength(2);
      expect(result.events[0]).toEqual({
        type: 'file-marker',
        marker: 'file:app/page.tsx',
      });
      expect(result.events[1]).toEqual({
        type: 'code-chunk',
        content: 'const x = 1',
      });
      expect(result.newState.pendingFileMarker).toBe(false);
    });

    it('should handle file marker on second line', () => {
      let state = createParseState();
      state = { ...state, inCodeBlock: true, pendingFileMarker: true };

      const result = parseSSEChunk('\nfile:app/page.tsx\nconst x = 1', state);

      expect(result.events).toHaveLength(1);
      expect(result.events[0]).toEqual({
        type: 'code-chunk',
        content: 'const x = 1',
      });
      expect(result.newState.pendingFileMarker).toBe(false);
    });

    it('should handle code block without file marker', () => {
      let state = createParseState();
      state = { ...state, inCodeBlock: true, pendingFileMarker: true };

      const result = parseSSEChunk('typescript\nconst x = 1', state);

      expect(result.events).toHaveLength(1);
      expect(result.events[0]).toEqual({
        type: 'code-chunk',
        content: 'const x = 1',
      });
      expect(result.newState.pendingFileMarker).toBe(false);
    });

    it('should emit code chunks', () => {
      let state = createParseState();
      state = { ...state, inCodeBlock: true, pendingFileMarker: false };

      const code = 'const longVariableName = someFunctionCall();\n';
      const result = parseSSEChunk(code, state);

      expect(result.events).toHaveLength(1);
      expect(result.events[0]).toEqual({
        type: 'code-chunk',
        content: code,
      });
    });

    it('should end code block on closing ticks', () => {
      let state = createParseState();
      state = { ...state, inCodeBlock: true, pendingFileMarker: false };

      const result = parseSSEChunk('const x = 1;\n```After code', state);

      expect(result.events).toHaveLength(1);
      expect(result.events[0]).toEqual({
        type: 'code-chunk',
        content: 'const x = 1;\n',
      });
      expect(result.newState.inCodeBlock).toBe(false);
      expect(result.newState.buffer).toBe('After code');
    });

    it('should handle multiple code blocks', () => {
      let state = createParseState();

      // Start first code block
      let result = parseSSEChunk('```file:a.ts\nconst a = 1;\n```', state);
      expect(result.events).toHaveLength(1);
      expect(result.events[0].type).toBe('code-chunk');
      state = result.newState;

      // Text between
      result = parseSSEChunk('\nThen more code:\n```file:b.ts\nconst b = 2;', state);
      expect(result.events).toHaveLength(2);
      expect(result.events[0].type).toBe('explanation-chunk');
      expect(result.events[1].type).toBe('code-chunk');
    });
  });

  describe('parseSSEChunk - Complex Scenarios', () => {
    it('should handle thinking followed by code', () => {
      let state = createParseState();

      let result = parseSSEChunk('<thinking type="plan">I will create a component</thinking>```tsx\nexport default', state);

      expect(result.events).toHaveLength(3);
      expect(result.events[0]).toEqual({
        type: 'thinking-chunk',
        thinkingType: 'plan',
        content: 'I will create a component',
      });
      expect(result.events[1]).toEqual({
        type: 'thinking-complete',
        thinkingType: 'plan',
      });
      expect(result.events[2]).toEqual({
        type: 'code-chunk',
        content: 'export default',
      });
    });

    it('should handle partial tags across chunks', () => {
      let state = createParseState();

      // First chunk ends with partial tag
      let result = parseSSEChunk('Some text <', state);
      expect(result.events).toHaveLength(1);
      expect(result.events[0]).toEqual({
        type: 'explanation-chunk',
        content: 'Some text ',
      });
      state = result.newState;
      expect(state.buffer).toBe('<');

      // Complete the tag
      result = parseSSEChunk('thinking type="test">Content</thinking>', state);
      expect(result.events).toHaveLength(3);
      expect(result.events[0].type).toBe('thinking-chunk');
    });

    it('should handle partial code block markers', () => {
      let state = createParseState();

      // Ends with single backtick
      let result = parseSSEChunk('Code: `', state);
      expect(result.events).toHaveLength(1);
      expect(result.events[0]).toEqual({
        type: 'explanation-chunk',
        content: 'Code: ',
      });
      state = result.newState;
      expect(state.buffer).toBe('`');

      // Complete the code block
      result = parseSSEChunk('``code``', state);
      expect(result.events).toHaveLength(1);
      expect(result.events[0].type).toBe('code-chunk');
    });

    it('should handle streaming simulation', () => {
      let state = createParseState();
      const chunks = [
        'Let me think about this.',
        '<thinking type="analysis">',
        'The user wants a button component.',
        '</thinking>',
        'Here is the code:\n```tsx\n',
        'export function Button() {',
        '\n  return <button>Click</button>;',
        '\n}\n```',
      ];

      const allEvents: unknown[] = [];

      for (const chunk of chunks) {
        const result = parseSSEChunk(chunk, state);
        allEvents.push(...result.events);
        state = result.newState;
      }

      // Flush remaining
      const finalEvents = flushParseState(state);
      allEvents.push(...finalEvents);

      // Should have explanation, thinking chunk, thinking complete, code chunks
      expect(allEvents.some((e: unknown) => (e as { type: string }).type === 'thinking-chunk')).toBe(true);
      expect(allEvents.some((e: unknown) => (e as { type: string }).type === 'thinking-complete')).toBe(true);
      expect(allEvents.some((e: unknown) => (e as { type: string }).type === 'code-chunk')).toBe(true);
    });
  });

  describe('flushParseState', () => {
    it('should flush plain text as explanation', () => {
      const state: SSEParseState = {
        buffer: 'Remaining text',
        inCodeBlock: false,
        inThinkingBlock: false,
        thinkingType: null,
        pendingFileMarker: false,
      };

      const events = flushParseState(state);
      expect(events).toHaveLength(1);
      expect(events[0]).toEqual({
        type: 'explanation-chunk',
        content: 'Remaining text',
      });
    });

    it('should flush code block content', () => {
      const state: SSEParseState = {
        buffer: 'const x = 1;',
        inCodeBlock: true,
        inThinkingBlock: false,
        thinkingType: null,
        pendingFileMarker: false,
      };

      const events = flushParseState(state);
      expect(events).toHaveLength(1);
      expect(events[0]).toEqual({
        type: 'code-chunk',
        content: 'const x = 1;',
      });
    });

    it('should flush thinking block with completion', () => {
      const state: SSEParseState = {
        buffer: 'Some reasoning',
        inCodeBlock: false,
        inThinkingBlock: true,
        thinkingType: 'analysis',
        pendingFileMarker: false,
      };

      const events = flushParseState(state);
      expect(events).toHaveLength(2);
      expect(events[0]).toEqual({
        type: 'thinking-chunk',
        thinkingType: 'analysis',
        content: 'Some reasoning',
      });
      expect(events[1]).toEqual({
        type: 'thinking-complete',
        thinkingType: 'analysis',
      });
    });

    it('should return empty array for empty buffer', () => {
      const state: SSEParseState = {
        buffer: '',
        inCodeBlock: false,
        inThinkingBlock: false,
        thinkingType: null,
        pendingFileMarker: false,
      };

      const events = flushParseState(state);
      expect(events).toHaveLength(0);
    });

    it('should return empty array for whitespace-only buffer', () => {
      const state: SSEParseState = {
        buffer: '   \n\t  ',
        inCodeBlock: false,
        inThinkingBlock: false,
        thinkingType: null,
        pendingFileMarker: false,
      };

      const events = flushParseState(state);
      expect(events).toHaveLength(0);
    });
  });

  describe('formatSSEEvent', () => {
    it('should format event correctly', () => {
      const formatted = formatSSEEvent('thinking-chunk', {
        thinkingType: 'requirements',
        content: 'Some content',
      });

      expect(formatted).toBe('event: thinking-chunk\ndata: {"thinkingType":"requirements","content":"Some content"}\n\n');
    });

    it('should format skill-activated event', () => {
      const formatted = formatSSEEvent('skill-activated', {
        skill: {
          type: SkillType.CODE,
          stage: 'coding',
          confidence: 0.95,
        },
      });

      expect(formatted).toContain('event: skill-activated');
      expect(formatted).toContain('"type":"code"');
      expect(formatted).toContain('"stage":"coding"');
      expect(formatted).toContain('"confidence":0.95');
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty chunk', () => {
      let state = createParseState();
      const result = parseSSEChunk('', state);

      expect(result.events).toHaveLength(0);
      expect(result.newState.buffer).toBe('');
    });

    it('should handle chunk with only whitespace', () => {
      let state = createParseState();
      const result = parseSSEChunk('   \n\t  ', state);

      expect(result.events).toHaveLength(0);
      expect(result.newState.buffer).toBe('   \n\t  ');
    });

    it('should handle nested-looking tags', () => {
      let state = createParseState();
      state = { ...state, inThinkingBlock: true, thinkingType: 'outer' };

      const result = parseSSEChunk('<thinking type="inner">content</thinking></thinking>', state);

      // Should close at first </thinking>
      expect(result.events).toHaveLength(2);
      expect(result.events[0].type).toBe('thinking-chunk');
      expect(result.events[1].type).toBe('thinking-complete');
      expect(result.newState.buffer).toBe('</thinking>');
    });

    it('should handle multiple newlines', () => {
      let state = createParseState();
      const result = parseSSEChunk('Line 1\n\n\nLine 2', state);

      expect(result.events).toHaveLength(1);
      expect(result.events[0]).toEqual({
        type: 'explanation-chunk',
        content: 'Line 1\n\n\nLine 2',
      });
    });

    it('should handle unicode content', () => {
      let state = createParseState();
      const result = parseSSEChunk('Emoji: 🎉 🚀 \n Unicode: 中文', state);

      expect(result.events).toHaveLength(1);
      expect(result.events[0]).toEqual({
        type: 'explanation-chunk',
        content: 'Emoji: 🎉 🚀 \n Unicode: 中文',
      });
    });

    it('should handle special regex characters', () => {
      let state = createParseState();
      const result = parseSSEChunk('Special: $^.*+?()[]{}|\\', state);

      expect(result.events).toHaveLength(1);
      expect(result.events[0]).toEqual({
        type: 'explanation-chunk',
        content: 'Special: $^.*+?()[]{}|\\',
      });
    });
  });
});

import { describe, expect, test } from 'bun:test';
import { splitReasoningAtTerminator } from './route';

describe('splitReasoningAtTerminator', () => {
  test('splits on explicit </reasoning> and consumes the tag', () => {
    const result = splitReasoningAtTerminator('hello</reasoning>after');
    expect(result.terminated).toBe(true);
    expect(result.reasoningContent).toBe('hello');
    expect(result.rest).toBe('after');
  });

  test('splits on fenced code block before </reasoning> and keeps the fence', () => {
    const input = 'hello```ts\nconsole.log(1)\n```</reasoning>after';
    const result = splitReasoningAtTerminator(input);
    expect(result.terminated).toBe(true);
    expect(result.reasoningContent).toBe('hello');
    expect(result.rest.startsWith('```')).toBe(true);
  });

  test('does not split when no terminator is present', () => {
    const result = splitReasoningAtTerminator('hello world');
    expect(result.terminated).toBe(false);
    expect(result.reasoningContent).toBe('');
    expect(result.rest).toBe('hello world');
  });
});


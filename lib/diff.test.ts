import { describe, expect, test } from 'bun:test';
import { unifiedDiffForFile, unifiedDiffForFiles } from './diff';

describe('unifiedDiffForFile', () => {
  test('returns empty string when identical', () => {
    expect(unifiedDiffForFile('a\nb\n', 'a\nb\n', 'x.txt')).toBe('');
  });

  test('includes headers and a hunk when changed', () => {
    const patch = unifiedDiffForFile('a\nb\nc\n', 'a\nB\nc\n', 'x.txt');
    expect(patch.includes('--- a/x.txt')).toBe(true);
    expect(patch.includes('+++ b/x.txt')).toBe(true);
    expect(patch.includes('@@')).toBe(true);
    expect(patch.includes('-b')).toBe(true);
    expect(patch.includes('+B')).toBe(true);
  });

  test('handles insertion', () => {
    const patch = unifiedDiffForFile('a\nc\n', 'a\nb\nc\n', 'x.txt');
    expect(patch.includes('+b')).toBe(true);
  });

  test('handles deletion', () => {
    const patch = unifiedDiffForFile('a\nb\nc\n', 'a\nc\n', 'x.txt');
    expect(patch.includes('-b')).toBe(true);
  });
});

describe('unifiedDiffForFiles', () => {
  test('returns empty string when base missing', () => {
    expect(unifiedDiffForFiles(null, { 'a.txt': 'x' })).toBe('');
  });

  test('includes only changed files', () => {
    const patch = unifiedDiffForFiles(
      { 'a.txt': '1\n', 'b.txt': '2\n' },
      { 'a.txt': '1\n', 'b.txt': '3\n' }
    );
    expect(patch.includes('b.txt')).toBe(true);
    expect(patch.includes('a.txt')).toBe(false);
  });
});


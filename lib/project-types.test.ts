import { describe, expect, test } from 'vitest';
import { parseProjectOutput } from './project-types';

describe('parseProjectOutput', () => {
  test('parses inline file markers without fences', () => {
    const input = [
      'file:package.json',
      '{ "name": "demo" }',
      'file:src/app/page.tsx',
      'export default function Page() { return null; }',
      'file:README.md',
      '# Readme',
      '',
      'Trailing explanation text.',
    ].join('\n');

    const result = parseProjectOutput(input);
    expect(result.type).toBe('project');
    expect(result.files.length).toBe(3);
    expect(result.files[0].path).toBe('package.json');
    expect(result.files[1].path).toBe('src/app/page.tsx');
    expect(result.files[2].path).toBe('README.md');
  });
});

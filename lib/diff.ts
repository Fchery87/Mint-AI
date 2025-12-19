export type DiffOp =
  | { type: 'equal'; line: string }
  | { type: 'insert'; line: string }
  | { type: 'delete'; line: string };

function splitLines(text: string): string[] {
  const normalized = text.replace(/\r\n/g, '\n');
  // Preserve trailing newline behavior similar to git by keeping last empty line if present
  const lines = normalized.split('\n');
  return lines;
}

function myersDiff(a: string[], b: string[]): DiffOp[] {
  const n = a.length;
  const m = b.length;
  const max = n + m;
  const offset = max;

  let v = new Int32Array(2 * max + 1);
  v.fill(-1);
  v[offset + 1] = 0;

  const trace: Int32Array[] = [];

  for (let d = 0; d <= max; d++) {
    const vNext = new Int32Array(v);
    for (let k = -d; k <= d; k += 2) {
      const kIndex = offset + k;

      let x: number;
      if (k === -d || (k !== d && v[kIndex - 1] < v[kIndex + 1])) {
        x = v[kIndex + 1];
      } else {
        x = v[kIndex - 1] + 1;
      }
      let y = x - k;

      while (x < n && y < m && a[x] === b[y]) {
        x++;
        y++;
      }

      vNext[kIndex] = x;

      if (x >= n && y >= m) {
        trace.push(vNext);
        return backtrack(trace, a, b, offset);
      }
    }
    trace.push(vNext);
    v = vNext;
  }

  return [];
}

function backtrack(
  trace: Int32Array[],
  a: string[],
  b: string[],
  offset: number
): DiffOp[] {
  let x = a.length;
  let y = b.length;
  const ops: DiffOp[] = [];

  for (let d = trace.length - 1; d > 0; d--) {
    const vPrev = trace[d - 1];
    const k = x - y;
    const kIndex = offset + k;

    let prevK: number;
    if (
      k === -d ||
      (k !== d && vPrev[kIndex - 1] < vPrev[kIndex + 1])
    ) {
      prevK = k + 1;
    } else {
      prevK = k - 1;
    }

    const prevX = vPrev[offset + prevK];
    const prevY = prevX - prevK;

    while (x > prevX && y > prevY) {
      ops.push({ type: 'equal', line: a[x - 1] });
      x--;
      y--;
    }

    if (x === prevX) {
      ops.push({ type: 'insert', line: b[prevY] });
    } else {
      ops.push({ type: 'delete', line: a[prevX] });
    }

    x = prevX;
    y = prevY;
  }

  while (x > 0 && y > 0) {
    ops.push({ type: 'equal', line: a[x - 1] });
    x--;
    y--;
  }
  while (x > 0) {
    ops.push({ type: 'delete', line: a[x - 1] });
    x--;
  }
  while (y > 0) {
    ops.push({ type: 'insert', line: b[y - 1] });
    y--;
  }

  ops.reverse();
  return ops;
}

export function unifiedDiffForFile(
  oldText: string,
  newText: string,
  path: string,
  contextLines = 3
): string {
  if (oldText === newText) return '';

  const a = splitLines(oldText);
  const b = splitLines(newText);
  const ops = myersDiff(a, b);

  type Hunk = {
    oldStart: number;
    newStart: number;
    oldCount: number;
    newCount: number;
    lines: string[];
    trailingContext: number;
  };

  const hunks: Hunk[] = [];
  let hunk: Hunk | null = null;
  const preContext: string[] = [];

  let oldLine = 1;
  let newLine = 1;

  const pushPreContext = (line: string) => {
    preContext.push(line);
    if (preContext.length > contextLines) preContext.shift();
  };

  for (const op of ops) {
    if (op.type === 'equal') {
      if (!hunk) {
        pushPreContext(op.line);
        oldLine++;
        newLine++;
        continue;
      }

      if (hunk.trailingContext < contextLines) {
        hunk.lines.push(` ${op.line}`);
        hunk.trailingContext++;
        hunk.oldCount++;
        hunk.newCount++;
        oldLine++;
        newLine++;
        continue;
      }

      hunks.push(hunk);
      hunk = null;
      preContext.length = 0;
      pushPreContext(op.line);
      oldLine++;
      newLine++;
      continue;
    }

    if (!hunk) {
      const oldStart = oldLine - preContext.length;
      const newStart = newLine - preContext.length;
      hunk = {
        oldStart,
        newStart,
        oldCount: preContext.length,
        newCount: preContext.length,
        lines: preContext.map((l) => ` ${l}`),
        trailingContext: 0,
      };
      preContext.length = 0;
    }

    if (op.type === 'delete') {
      hunk.lines.push(`-${op.line}`);
      hunk.oldCount++;
      oldLine++;
      hunk.trailingContext = 0;
      continue;
    }

    hunk.lines.push(`+${op.line}`);
    hunk.newCount++;
    newLine++;
    hunk.trailingContext = 0;
  }

  if (hunk) hunks.push(hunk);

  const header = `--- a/${path}\n+++ b/${path}\n`;
  const body = hunks
    .map((h) => {
      const oldRange = `${h.oldStart},${h.oldCount}`;
      const newRange = `${h.newStart},${h.newCount}`;
      return `@@ -${oldRange} +${newRange} @@\n${h.lines.join('\n')}\n`;
    })
    .join('');

  return header + body;
}

export function unifiedDiffForFiles(
  baseFiles: Record<string, string> | null,
  currentFiles: Record<string, string>
): string {
  if (!baseFiles) return '';

  const allPaths = new Set<string>([
    ...Object.keys(baseFiles),
    ...Object.keys(currentFiles),
  ]);

  const sorted = Array.from(allPaths).sort((a, b) => a.localeCompare(b));
  const patches: string[] = [];

  for (const path of sorted) {
    const before = baseFiles[path] ?? '';
    const after = currentFiles[path] ?? '';
    const patch = unifiedDiffForFile(before, after, path);
    if (patch) patches.push(patch);
  }

  return patches.join('\n');
}


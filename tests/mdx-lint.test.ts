/** Catches MDX patterns that compile but render wrongly. */
import { describe, expect, it } from 'vitest';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

const CONTENT = join(__dirname, '..', 'content');
const mdx = (d: string): string[] =>
  readdirSync(d).flatMap((f) => {
    const p = join(d, f);
    return statSync(p).isDirectory() ? mdx(p) : p.endsWith('.mdx') ? [p] : [];
  });

describe('mdx lint', () => {
  it('display math uses $$ on its own lines (single-line $$…$$ renders inline)', () => {
    for (const f of mdx(CONTENT)) {
      const bad = readFileSync(f, 'utf8').split('\n').filter((l) => /^\s*\$\$.+\$\$\s*$/.test(l));
      expect(bad, f).toEqual([]);
    }
  });
});

import { describe, expect, it } from 'vitest';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { allLessons, glossary, graph, lookupTerm, nextLesson, orderedLessonIds, tracks } from '../src/engine/content';

const CONTENT = join(__dirname, '..', 'content');

function mdxFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((f) => {
    const p = join(dir, f);
    if (statSync(p).isDirectory()) return mdxFiles(p);
    return p.endsWith('.mdx') ? [p] : [];
  });
}

const lessons = allLessons();
const ids = new Set(lessons.map((l) => l.id));

describe('content integrity', () => {
  it('has the 3 M1 sample lessons', () => {
    expect(ids).toContain('math.logic.proof-techniques');
    expect(ids).toContain('math.nt.gcd-euclid');
    expect(ids).toContain('math.nt.mod-arith');
  });

  it('every lesson has valid frontmatter', () => {
    for (const l of lessons) {
      expect(l.id, l.id).toMatch(/^[a-z0-9-]+(\.[a-z0-9-]+)+$/);
      expect(tracks.map((t) => t.id)).toContain(l.track);
      expect(l.title.length).toBeGreaterThan(3);
      expect(l.minutes).toBeGreaterThan(0);
      expect(l.minutes, `${l.id} must be ≤ 10 min`).toBeLessThanOrEqual(10);
      expect(l.researchBridge.length, `${l.id} researchBridge`).toBeGreaterThan(10);
      expect(l.flashcards.length, `${l.id} flashcards`).toBeGreaterThan(0);
      for (const f of l.flashcards) {
        expect(f.front.trim()).not.toBe('');
        expect(f.back.trim()).not.toBe('');
      }
    }
  });

  it('lesson ids are unique across files', () => {
    expect(ids.size).toBe(mdxFiles(CONTENT).length);
  });

  it('tracks.json references only existing lessons, each exactly once, in the right track', () => {
    const listed = tracks.flatMap((t) => t.chapters.flatMap((c) => c.lessons.map((id) => ({ id, track: t.id, chapter: c.id }))));
    expect(new Set(listed.map((x) => x.id)).size).toBe(listed.length);
    for (const x of listed) {
      const l = lessons.find((l) => l.id === x.id);
      expect(l, `missing lesson ${x.id}`).toBeDefined();
      expect(l!.track).toBe(x.track);
      expect(l!.chapter).toBe(x.chapter);
    }
    expect(orderedLessonIds().length).toBe(lessons.length);
  });

  it('graph.json matches frontmatter prerequisites and is acyclic', () => {
    for (const l of lessons) expect(graph[l.id] ?? [], l.id).toEqual(l.prerequisites);
    for (const p of Object.values(graph).flat()) expect(ids, `unknown prerequisite ${p}`).toContain(p);
    const order = orderedLessonIds();
    for (const l of lessons) for (const p of l.prerequisites) expect(order.indexOf(p)).toBeLessThan(order.indexOf(l.id));
  });

  it('glossary has unique terms, and every <Term en> used in content exists', () => {
    const keys = glossary.map((g) => g.en.toLowerCase());
    expect(new Set(keys).size).toBe(keys.length);
    for (const f of mdxFiles(CONTENT)) {
      for (const m of readFileSync(f, 'utf8').matchAll(/<Term en="([^"]+)"/g)) {
        expect(lookupTerm(m[1]!), `${f}: term "${m[1]}" missing in glossary.json`).toBeDefined();
      }
    }
  });

  it('every lesson follows the section order of SPEC §2', () => {
    const order = ['<Why>', '<Intuition>', '<Definition|<Theorem', '<Example', '<Pitfalls>', '<Exercises', '<Summary>'];
    for (const f of mdxFiles(CONTENT)) {
      const src = readFileSync(f, 'utf8');
      let last = -1;
      for (const tag of order) {
        const pos = Math.min(...tag.split('|').map((t) => (src.indexOf(t) === -1 ? Infinity : src.indexOf(t))));
        expect(pos, `${f}: missing ${tag}`).not.toBe(Infinity);
        expect(pos, `${f}: ${tag} out of order`).toBeGreaterThan(last);
        last = pos;
      }
    }
  });

  it('nextLesson respects prerequisites', () => {
    expect(nextLesson(new Set())?.id).toBe('math.logic.proof-techniques');
    expect(nextLesson(new Set(['math.logic.proof-techniques']))?.id).toBe('math.nt.gcd-euclid');
    expect(nextLesson(new Set(['math.logic.proof-techniques', 'math.nt.gcd-euclid']))?.id).toBe('math.nt.mod-arith');
  });
});

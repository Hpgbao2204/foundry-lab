import { describe, expect, it } from 'vitest';
import { computeRedo, REDO_AFTER_DAYS } from '../src/engine/redo';
import { mixedReview, problemSet, weekKey, exercisesFor } from '../src/engine/exercises';
import type { AttemptRow } from '../src/db/db';

const DAY = 86_400_000;
const at = (exerciseId: string, correct: boolean, hintsUsed: number, ts: number): AttemptRow => ({ exerciseId, correct, hintsUsed, ts });

describe('redo queue (SPEC §3.3)', () => {
  it('flags exercises whose latest attempt used hint 3+, was wrong, or opened the solution', () => {
    const items = computeRedo([
      at('clean', true, 0, 1000),
      at('hint2', true, 2, 1000),
      at('hint3', true, 3, 1000),
      at('solution', false, 4, 1000),
      at('wrong', false, 1, 1000),
      at('fixed', false, 4, 1000),
      at('fixed', true, 1, 5 * DAY), // redone cleanly later → leaves the queue
    ]);
    expect(items.map((i) => i.exerciseId).sort()).toEqual(['hint3', 'solution', 'wrong']);
    expect(items[0]!.dueAt).toBe(1000 + REDO_AFTER_DAYS * DAY);
  });

  it('a later weak attempt puts a fixed exercise back', () => {
    const items = computeRedo([at('x', true, 0, 0), at('x', true, 4, 10 * DAY)]);
    expect(items).toHaveLength(1);
    expect(items[0]!.attempts).toBe(2);
  });
});

describe('problem sets (SPEC §3.5)', () => {
  it('number-theory: 10–15 exercises, A → B → C, mixing both lessons', () => {
    const ps = problemSet('math', 'number-theory');
    expect(ps.length).toBeGreaterThanOrEqual(10);
    expect(ps.length).toBeLessThanOrEqual(15);
    const order = { A: 0, B: 1, C: 2 };
    for (let i = 1; i < ps.length; i++) expect(order[ps[i]!.level]).toBeGreaterThanOrEqual(order[ps[i - 1]!.level]);
    expect(ps.some((e) => e.id.startsWith('math.nt.gcd-euclid.'))).toBe(true);
    expect(ps.some((e) => e.id.startsWith('math.nt.mod-arith.'))).toBe(true);
    expect(ps.some((e) => e.level === 'C')).toBe(true);
    expect(new Set(ps.map((e) => e.id)).size).toBe(ps.length);
  });

  it('logic chapter (one lesson) uses all its exercises when ≤ 15', () => {
    expect(problemSet('math', 'logic').length).toBe(exercisesFor('math.logic.proof-techniques').length);
  });

  it('unknown chapter → empty', () => {
    expect(problemSet('math', 'nope')).toEqual([]);
  });
});

describe('weekly mixed review', () => {
  const read = ['math.logic.proof-techniques', 'math.nt.mod-arith'];

  it('only uses lessons that were read, mixes them, and is stable within a week', () => {
    const a = mixedReview(read, '2026-W45');
    const b = mixedReview(read, '2026-W45');
    expect(a.map((e) => e.id)).toEqual(b.map((e) => e.id));
    expect(a).toHaveLength(10);
    expect(a.every((e) => read.some((l) => e.id.startsWith(l + '.')))).toBe(true);
    expect(read.every((l) => a.some((e) => e.id.startsWith(l + '.')))).toBe(true);
    expect(mixedReview(read, '2026-W46').map((e) => e.id)).not.toEqual(a.map((e) => e.id));
  });

  it('is empty before anything is read', () => {
    expect(mixedReview([])).toEqual([]);
  });

  it('weekKey is ISO-like', () => {
    expect(weekKey(new Date(2026, 10, 7))).toBe('2026-W45');
    expect(weekKey(new Date(2026, 0, 1))).toBe('2026-W01');
  });
});

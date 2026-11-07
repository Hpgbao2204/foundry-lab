/**
 * `npm run verify-content` — every exercise in content/ is well-formed, and every
 * computable answer is re-computed by code (SPEC §10: "Toán sai còn tệ hơn không học").
 */
import { describe, expect, it } from 'vitest';
import { allLessons } from '../src/engine/content';
import { exerciseFiles, exercisesFor } from '../src/engine/exercises';
import { grade, templateBlanks } from '../src/exercises/grade';
import { VERIFY, CHECKS } from '../src/exercises/registry';
import { GENERATORS, instantiate } from '../src/generators';
import { parseNumber } from '../src/exercises/parse';
import { shuffledOrder } from '../src/widgets/ExerciseCard';
import type { Exercise } from '../src/exercises/types';

const lessons = allLessons();
const all: { ex: Exercise; lessonId: string }[] = [...exerciseFiles()].flatMap(([lessonId, list]) => list.map((ex) => ({ ex, lessonId })));
const TYPES = ['numeric', 'expression', 'multiple-choice', 'true-false-why', 'step-fill', 'proof-order', 'proof-write', 'code-python', 'code-rust'];

describe('exercise files', () => {
  it('every exercise file belongs to an existing lesson', () => {
    const ids = new Set(lessons.map((l) => l.id));
    for (const lessonId of exerciseFiles().keys()) expect(ids, `orphan exercise file ${lessonId}.json`).toContain(lessonId);
  });

  it('every lesson has 4–6 A, 2–4 B, 1–2 C exercises (SPEC §3.1)', () => {
    for (const l of lessons) {
      const list = exercisesFor(l.id);
      const count = (lvl: string) => list.filter((e) => e.level === lvl).length;
      expect(count('A'), `${l.id} level A`).toBeGreaterThanOrEqual(4);
      expect(count('A'), `${l.id} level A`).toBeLessThanOrEqual(6);
      expect(count('B'), `${l.id} level B`).toBeGreaterThanOrEqual(2);
      expect(count('B'), `${l.id} level B`).toBeLessThanOrEqual(4);
      expect(count('C'), `${l.id} level C`).toBeGreaterThanOrEqual(1);
      expect(count('C'), `${l.id} level C`).toBeLessThanOrEqual(2);
    }
  });

  it('ids are unique and prefixed with the lesson id', () => {
    const seen = new Set<string>();
    for (const { ex, lessonId } of all) {
      expect(seen.has(ex.id), `duplicate ${ex.id}`).toBe(false);
      seen.add(ex.id);
      expect(ex.id.startsWith(lessonId + '.'), `${ex.id} should start with ${lessonId}.`).toBe(true);
    }
  });
});

describe.each(all.map(({ ex }) => [ex.id, ex] as const))('%s', (_id, ex) => {
  it('is well-formed with a full hint ladder (3 hints + solution)', () => {
    expect(TYPES).toContain(ex.type);
    expect(['A', 'B', 'C']).toContain(ex.level);
    if (ex.generator) {
      expect(GENERATORS[ex.generator], `unknown generator ${ex.generator}`).toBeDefined();
      expect(ex.level).toBe('A');
    }
    if (!ex.generator || ex.prompt) {
      expect(ex.prompt.trim()).not.toBe('');
      expect(ex.hints).toHaveLength(3);
      ex.hints.forEach((h, i) => expect(h.trim(), `hint ${i + 1}`).not.toBe(''));
      expect(ex.solution.trim()).not.toBe('');
    }
    for (const s of [ex.prompt, ex.solution, ...ex.hints]) expect((s.match(/\$/g) ?? []).length % 2, `unbalanced $ in: ${s}`).toBe(0);
  });

  it('its own answer passes the grader, and computable answers are re-computed', () => {
    const inst = instantiate(ex, 0);
    switch (inst.type) {
      case 'numeric': {
        const answers = Array.isArray(inst.answer) ? inst.answer : [inst.answer];
        answers.forEach((a) => expect(parseNumber(a), `answer “${a}” must parse`).not.toBeNull());
        expect(grade(inst, { type: 'numeric', value: answers[0]! }).correct).toBe(true);
        if (inst.check) expect(CHECKS[inst.check.fn]).toBeDefined();
        if (inst.verify) {
          const fn = VERIFY[inst.verify.fn];
          expect(fn, `unknown verify fn ${inst.verify.fn}`).toBeDefined();
          const expected = fn!(...inst.verify.args);
          expect(expected).not.toBeNull();
          expect(grade(inst, { type: 'numeric', value: String(expected) }).correct, `verify ${inst.verify.fn}(${inst.verify.args}) = ${expected}`).toBe(true);
        }
        break;
      }
      case 'expression':
        expect(grade(inst, { type: 'expression', value: inst.answer }).correct).toBe(true);
        break;
      case 'multiple-choice': {
        const want = Array.isArray(inst.answer) ? inst.answer : [inst.answer];
        want.forEach((i) => expect(i).toBeLessThan(inst.options.length));
        expect(grade(inst, { type: 'multiple-choice', selected: want }).correct).toBe(true);
        break;
      }
      case 'true-false-why':
        expect(inst.reason).toBeLessThan(inst.reasons.length);
        expect(inst.reasons.length).toBeGreaterThanOrEqual(2);
        expect(grade(inst, { type: 'true-false-why', value: inst.answer, reason: inst.reason }).correct).toBe(true);
        break;
      case 'step-fill': {
        const blanks = templateBlanks(inst.template);
        expect(blanks.length).toBeGreaterThan(0);
        expect(grade(inst, { type: 'step-fill', blanks: blanks.map((b) => b.split('|')[0]!) }).correct).toBe(true);
        break;
      }
      case 'proof-order': {
        expect(inst.steps.length).toBeGreaterThanOrEqual(3);
        expect(grade(inst, { type: 'proof-order', order: inst.steps.map((_, i) => i) }).correct).toBe(true);
        const shuffled = shuffledOrder(inst.id, inst.steps.length);
        expect(grade(inst, { type: 'proof-order', order: shuffled }).correct, 'initial shuffle must not be solved already').toBe(false);
        break;
      }
      case 'proof-write':
        expect(inst.rubric.length).toBeGreaterThanOrEqual(2);
        break;
    }
  });
});

/** Hand-checked numbers inside step-fill exercises (re-derived by code). */
describe('step-fill arithmetic', () => {
  it('Euclid for (99, 78) and 11⁻¹ mod 26', () => {
    expect([99 - 78, 78 - 3 * 21, 21 - 15, 15 - 2 * 6]).toEqual([21, 15, 6, 3]);
    expect(String(VERIFY.gcd!(99, 78))).toBe('3');
    expect(14 * 78 - 11 * 99).toBe(3);
    expect([26 - 2 * 11, 11 - 2 * 4]).toEqual([4, 3]);
    expect(3 * 26 - 7 * 11).toBe(1);
    expect(String(VERIFY.modInverse!(11, 26))).toBe('19');
  });

  it('contrapositive fill: 3(2k) + 2 = 6k + 2 = 2(3k + 1)', () => {
    for (let k = -20; k <= 20; k++) expect(3 * (2 * k) + 2).toBe(2 * (3 * k + 1));
  });

  it('odd squares: 1 + 3 + … + (2n−1) = n²', () => {
    for (let n = 1; n < 100; n++) {
      let s = 0;
      for (let i = 1; i <= n; i++) s += 2 * i - 1;
      expect(s).toBe(n * n);
    }
  });

  it('a·b = 6 in F_p has p − 1 solutions (checked for small p)', () => {
    for (const p of [7, 11, 13]) {
      let count = 0;
      for (let a = 0; a < p; a++) for (let b = 0; b < p; b++) if ((a * b) % p === 6 % p) count++;
      expect(count).toBe(p - 1);
    }
  });
});

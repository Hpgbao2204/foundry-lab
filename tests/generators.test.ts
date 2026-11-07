import { describe, expect, it } from 'vitest';
import { GENERATORS, instantiate, euclidLines } from '../src/generators';
import { grade } from '../src/exercises/grade';
import { VERIFY } from '../src/exercises/registry';
import { egcd, gcd, mod } from '../src/lib/nt';
import type { Exercise, NumericExercise } from '../src/exercises/types';

const SEEDS = Array.from({ length: 300 }, (_, i) => i * 7919 + 1);

function make(generator: string, params?: Record<string, number>): Exercise {
  return { id: `gen.${generator}`, level: 'A', type: 'numeric', prompt: '', answer: '', hints: ['', '', ''], solution: '', generator, params };
}

describe('generators', () => {
  for (const name of Object.keys(GENERATORS)) {
    describe(name, () => {
      it('produces complete, self-consistent instances (answer passes its own grader)', () => {
        for (const seed of SEEDS) {
          const ex = instantiate(make(name), seed) as NumericExercise;
          expect(ex.prompt.length).toBeGreaterThan(5);
          expect(ex.hints).toHaveLength(3);
          ex.hints.forEach((h) => expect(h.length).toBeGreaterThan(5));
          expect(ex.solution.length).toBeGreaterThan(10);
          expect(grade(ex, { type: 'numeric', value: String(ex.answer) }).correct, `${name} seed ${seed}`).toBe(true);
          if (ex.verify) {
            const expected = VERIFY[ex.verify.fn]!(...ex.verify.args);
            expect(String(expected), `${name} seed ${seed}`).toBe(String(ex.answer));
          }
          // braces balanced in LaTeX → KaTeX will not choke
          const opens = (ex.prompt + ex.solution).split('{').length;
          const closes = (ex.prompt + ex.solution).split('}').length;
          expect(opens).toBe(closes);
        }
      });

      it('is deterministic per seed and varies across seeds', () => {
        const a = instantiate(make(name), 42);
        const b = instantiate(make(name), 42);
        expect(a.prompt).toBe(b.prompt);
        const prompts = new Set(SEEDS.slice(0, 50).map((s) => instantiate(make(name), s).prompt));
        expect(prompts.size).toBeGreaterThan(20);
      });
    });
  }

  it('modInverse: a · answer ≡ 1 independently of the grader', () => {
    for (const seed of SEEDS) {
      const ex = instantiate(make('modInverse'), seed) as NumericExercise;
      const [, a, n] = /\$(\d+)\^\{-1\} \\bmod (\d+)\$/.exec(ex.prompt)!.map(Number) as [number, number, number];
      expect(Number(mod(BigInt(a) * BigInt(ex.answer as string), BigInt(n)))).toBe(1);
      // a wrong answer must be rejected
      expect(grade(ex, { type: 'numeric', value: String(Number(ex.answer) + 1) }).correct).toBe(false);
    }
  });

  it('bezout: accepted x has an integer y; shifted x is also accepted', () => {
    for (const seed of SEEDS) {
      const ex = instantiate(make('bezout'), seed) as NumericExercise;
      const [a, b] = ex.check!.args.map(BigInt) as [bigint, bigint];
      const [g] = egcd(a, b);
      const x = BigInt(ex.answer as string);
      expect((g - a * x) % b).toBe(0n);
      expect(grade(ex, { type: 'numeric', value: String(x + b / g) }).correct).toBe(true);
      expect(grade(ex, { type: 'numeric', value: String(x + 1n) }).correct).toBe(b / g === 1n);
    }
  });

  it('linearCongruence: the answer satisfies the congruence', () => {
    for (const seed of SEEDS) {
      const ex = instantiate(make('linearCongruence'), seed) as NumericExercise;
      const [, a, b, c, p] = /\$(\d+)x \+ (\d+) \\equiv (\d+) \\pmod\{(\d+)\}\$/.exec(ex.prompt)!.map(Number) as number[] as [number, number, number, number, number];
      expect((a * Number(ex.answer) + b) % p).toBe(c);
    }
  });

  it('gcd: answer divides both and is the largest such', () => {
    for (const seed of SEEDS) {
      const ex = instantiate(make('gcd'), seed) as NumericExercise;
      const [, a, b] = /gcd\((\d+), (\d+)\)/.exec(ex.prompt)!.map(Number) as [number, number, number];
      expect(String(gcd(BigInt(a), BigInt(b)))).toBe(ex.answer);
    }
  });

  it('euclidLines matches the hand example in the lesson', () => {
    expect(euclidLines(240, 46)).toEqual([
      '240 = 5 \\cdot 46 + 10',
      '46 = 4 \\cdot 10 + 6',
      '10 = 1 \\cdot 6 + 4',
      '6 = 1 \\cdot 4 + 2',
      '4 = 2 \\cdot 2 + 0',
    ]);
  });

  it('seed 0 keeps the authored version; other seeds re-roll', () => {
    const authored: Exercise = { ...make('modInverse'), prompt: 'Find $3^{-1} \\bmod 7$.', answer: '5', modulus: 7 } as Exercise;
    expect(instantiate(authored, 0).prompt).toBe(authored.prompt);
    expect(instantiate(authored, 5).prompt).not.toBe(authored.prompt);
  });
});

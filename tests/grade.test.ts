import { describe, expect, it } from 'vitest';
import { parseNumber, numbersEqual } from '../src/exercises/parse';
import { equivalent, parseExpr } from '../src/exercises/expr';
import { grade, blankMatches } from '../src/exercises/grade';
import type { Exercise } from '../src/exercises/types';

const base = { hints: ['a', 'b', 'c'], solution: 's', level: 'A' as const, prompt: 'p' };

describe('parseNumber', () => {
  it('parses integers, negatives, fractions, decimals and decorations', () => {
    expect(parseNumber('42')).toEqual({ p: 42n, q: 1n });
    expect(parseNumber(' −3 ')).toEqual({ p: -3n, q: 1n });
    expect(parseNumber('6/8')).toEqual({ p: 3n, q: 4n });
    expect(parseNumber('3/-6')).toEqual({ p: -1n, q: 2n });
    expect(parseNumber('0.25')).toEqual({ p: 1n, q: 4n });
    expect(parseNumber('x = 5')).toEqual({ p: 5n, q: 1n });
    expect(parseNumber('5 (mod 7)')).toEqual({ p: 5n, q: 1n });
    expect(parseNumber('≡ 5')).toEqual({ p: 5n, q: 1n });
    expect(parseNumber('abc')).toBeNull();
    expect(parseNumber('1/0')).toBeNull();
    expect(parseNumber('')).toBeNull();
  });

  it('compares modulo n, including fractions as inverses', () => {
    expect(numbersEqual(parseNumber('12')!, parseNumber('5')!, 7)).toBe(true);
    expect(numbersEqual(parseNumber('-2')!, parseNumber('5')!, 7)).toBe(true);
    expect(numbersEqual(parseNumber('1/3')!, parseNumber('5')!, 7)).toBe(true); // 3·5 = 15 ≡ 1
    expect(numbersEqual(parseNumber('12')!, parseNumber('5')!)).toBe(false);
  });
});

describe('expression equivalence', () => {
  it('handles implicit multiplication and precedence', () => {
    expect(equivalent('(x+1)^2', 'x^2 + 2x + 1')).toBe(true);
    expect(equivalent('(x+1)(x-1)', 'x^2 - 1')).toBe(true);
    expect(equivalent('2x(y+1)', '2xy + 2x')).toBe(true);
    expect(equivalent('-x^2', '-(x^2)')).toBe(true);
    expect(equivalent('-x^2', '(-x)^2')).toBe(false);
    expect(equivalent('2^3^2', '512')).toBe(true); // right associative
    expect(equivalent('x²+1', 'x*x + 1')).toBe(true); // unicode superscript
    expect(equivalent('(x+1)^2', 'x^2 + 1')).toBe(false);
    expect(equivalent('x/2', '0.5x')).toBe(true);
  });

  it('works over F_p (division = inverse)', () => {
    expect(equivalent('x^7', 'x', { modulus: 7 })).toBe(true); // Fermat
    expect(equivalent('x^7', 'x', {})).toBe(false);
    expect(equivalent('(x+y)^5', 'x^5 + y^5', { modulus: 5 })).toBe(true); // freshman's dream
    expect(equivalent('x/3', '5x', { modulus: 7 })).toBe(true);
    expect(equivalent('x/3', '4x', { modulus: 7 })).toBe(false);
  });

  it('reports parse errors', () => {
    expect(() => parseExpr('x +')).toThrow();
    expect(() => parseExpr('(x + 1')).toThrow();
    expect(() => parseExpr('x $ 1')).toThrow();
  });
});

describe('grade()', () => {
  it('numeric with modulus and alternatives', () => {
    const ex: Exercise = { ...base, id: 'n', type: 'numeric', answer: '5', modulus: 7 };
    expect(grade(ex, { type: 'numeric', value: '5' }).correct).toBe(true);
    expect(grade(ex, { type: 'numeric', value: '-2' }).correct).toBe(true);
    expect(grade(ex, { type: 'numeric', value: '4' }).correct).toBe(false);
    expect(grade(ex, { type: 'numeric', value: 'hello' }).correct).toBe(false);
    const multi: Exercise = { ...base, id: 'm', type: 'numeric', answer: ['2', '-2'] };
    expect(grade(multi, { type: 'numeric', value: '-2' }).correct).toBe(true);
    expect(grade(multi, { type: 'numeric', value: '3' }).correct).toBe(false);
  });

  it('numeric with a custom check (non-unique Bézout x)', () => {
    const ex: Exercise = { ...base, id: 'b', type: 'numeric', answer: '-11', check: { fn: 'bezoutX', args: [99, 78] } };
    expect(grade(ex, { type: 'numeric', value: '-11' }).correct).toBe(true);
    expect(grade(ex, { type: 'numeric', value: '15' }).correct).toBe(true); // -11 + 26
    expect(grade(ex, { type: 'numeric', value: '14' }).correct).toBe(false);
    expect(grade(ex, { type: 'numeric', value: '1/2' }).correct).toBe(false);
  });

  it('multiple choice, single and multi-select', () => {
    const one: Exercise = { ...base, id: 'c', type: 'multiple-choice', options: ['a', 'b'], answer: 1 };
    expect(grade(one, { type: 'multiple-choice', selected: [1] }).correct).toBe(true);
    expect(grade(one, { type: 'multiple-choice', selected: [0] }).correct).toBe(false);
    const many: Exercise = { ...base, id: 'd', type: 'multiple-choice', options: ['a', 'b', 'c'], answer: [0, 2] };
    expect(grade(many, { type: 'multiple-choice', selected: [2, 0] }).correct).toBe(true);
    expect(grade(many, { type: 'multiple-choice', selected: [0] }).correct).toBe(false);
    expect(grade(many, { type: 'multiple-choice', selected: [0, 1, 2] }).correct).toBe(false);
  });

  it('true-false-why needs both the value and the reason', () => {
    const ex: Exercise = { ...base, id: 't', type: 'true-false-why', answer: false, reasons: ['r0', 'r1'], reason: 0 };
    expect(grade(ex, { type: 'true-false-why', value: false, reason: 0 }).correct).toBe(true);
    const halfway = grade(ex, { type: 'true-false-why', value: false, reason: 1 });
    expect(halfway.correct).toBe(false);
    expect(halfway.parts).toEqual([true, false]);
    expect(grade(ex, { type: 'true-false-why', value: null, reason: 0 }).correct).toBe(false);
  });

  it('step-fill blanks: numbers by value, alternatives, text', () => {
    expect(blankMatches('-5', '-5|38')).toBe(true);
    expect(blankMatches('38', '-5|38')).toBe(true);
    expect(blankMatches('2*k', '2k|2*k')).toBe(true);
    expect(blankMatches('2·k', '2k|2*k')).toBe(true);
    expect(blankMatches('Even', 'even')).toBe(true);
    expect(blankMatches('', 'even')).toBe(false);
    const ex: Exercise = { ...base, id: 's', type: 'step-fill', template: ['a {{1}} b {{2}}', 'c {{x|y}}'] };
    const r = grade(ex, { type: 'step-fill', blanks: ['1', '3', 'y'] });
    expect(r.correct).toBe(false);
    expect(r.parts).toEqual([true, false, true]);
    expect(grade(ex, { type: 'step-fill', blanks: ['1', '2', 'x'] }).correct).toBe(true);
  });

  it('proof-order and proof-write', () => {
    const po: Exercise = { ...base, id: 'o', type: 'proof-order', steps: ['a', 'b', 'c'] };
    expect(grade(po, { type: 'proof-order', order: [0, 1, 2] }).correct).toBe(true);
    expect(grade(po, { type: 'proof-order', order: [1, 0, 2] }).parts).toEqual([false, false, true]);
    const pw: Exercise = { ...base, id: 'w', type: 'proof-write', rubric: ['x', 'y'] };
    expect(grade(pw, { type: 'proof-write', text: 'short', checked: [true, true] }).correct).toBe(false);
    expect(grade(pw, { type: 'proof-write', text: 'a long enough proof text here', checked: [true, false] }).correct).toBe(false);
    expect(grade(pw, { type: 'proof-write', text: 'a long enough proof text here', checked: [true, true] }).correct).toBe(true);
  });
});

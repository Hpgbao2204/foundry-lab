import type { Exercise, GradeResult, Response } from './types';
import { normalizeInput, numbersEqual, parseNumber } from './parse';
import { equivalent } from './expr';
import { CHECKS } from './registry';

const ok = (message = 'Correct.'): GradeResult => ({ correct: true, message });
const no = (message = 'Not yet — try again or open a hint.'): GradeResult => ({ correct: false, message });

/** Compare one blank of a step-fill against "a|b|c" alternatives. Numbers compare by value. */
export function blankMatches(input: string, spec: string): boolean {
  const norm = (s: string) => normalizeInput(s).replace(/\s+/g, '').toLowerCase();
  return spec.split('|').some((alt) => {
    const a = parseNumber(input);
    const b = parseNumber(alt);
    if (a && b) return numbersEqual(a, b);
    return norm(input) === norm(alt) && norm(input) !== '';
  });
}

export const BLANK_RE = /\{\{([^}]+)\}\}/g;

export function templateBlanks(template: string[]): string[] {
  return template.flatMap((line) => [...line.matchAll(BLANK_RE)].map((m) => m[1]!));
}

export function grade(ex: Exercise, r: Response): GradeResult {
  if (ex.type !== r.type) throw new Error(`response type ${r.type} ≠ exercise type ${ex.type}`);

  switch (ex.type) {
    case 'numeric': {
      const v = (r as Extract<Response, { type: 'numeric' }>).value;
      const n = parseNumber(v);
      if (!n) return no('Enter a number (integer, decimal or fraction like 3/4).');
      if (ex.check) {
        const fn = CHECKS[ex.check.fn];
        if (!fn) throw new Error(`unknown check ${ex.check.fn}`);
        return fn(n, ...ex.check.args) ? ok() : no();
      }
      const answers = Array.isArray(ex.answer) ? ex.answer : [ex.answer];
      const hit = answers.some((a) => {
        const exp = parseNumber(a);
        if (!exp) throw new Error(`${ex.id}: bad answer ${a}`);
        return numbersEqual(n, exp, ex.modulus);
      });
      if (hit) {
        const canonical = answers[0]!;
        const shown = normalizeInput(v).replace(/\s/g, '');
        return ok(ex.modulus && shown !== canonical ? `Correct (≡ ${canonical} mod ${ex.modulus}).` : 'Correct.');
      }
      return no();
    }

    case 'expression': {
      const v = (r as Extract<Response, { type: 'expression' }>).value;
      try {
        return equivalent(v, ex.answer, { modulus: ex.modulus }) ? ok() : no('Not equivalent to the expected expression.');
      } catch (e) {
        return no(`Cannot parse: ${(e as Error).message}`);
      }
    }

    case 'multiple-choice': {
      const sel = [...(r as Extract<Response, { type: 'multiple-choice' }>).selected].sort();
      const want = (Array.isArray(ex.answer) ? [...ex.answer] : [ex.answer]).sort();
      if (sel.length === 0) return no('Pick an option.');
      return sel.length === want.length && sel.every((x, i) => x === want[i]) ? ok() : no();
    }

    case 'true-false-why': {
      const { value, reason } = r as Extract<Response, { type: 'true-false-why' }>;
      if (value === null || reason === null) return no('Choose True/False and a reason.');
      const parts = [value === ex.answer, reason === ex.reason];
      if (parts.every(Boolean)) return { correct: true, message: 'Correct — right answer and right reason.', parts };
      if (parts[0]) return { correct: false, message: 'True/False is right, but the reason is not.', parts };
      return { correct: false, message: 'Not yet.', parts };
    }

    case 'step-fill': {
      const { blanks } = r as Extract<Response, { type: 'step-fill' }>;
      const specs = templateBlanks(ex.template);
      const parts = specs.map((s, i) => blankMatches(blanks[i] ?? '', s));
      const right = parts.filter(Boolean).length;
      return parts.every(Boolean)
        ? { correct: true, message: 'All blanks correct.', parts }
        : { correct: false, message: `${right}/${specs.length} blanks correct.`, parts };
    }

    case 'proof-order': {
      const { order } = r as Extract<Response, { type: 'proof-order' }>;
      const parts = order.map((stepIdx, pos) => stepIdx === pos);
      return parts.every(Boolean)
        ? { correct: true, message: 'Correct order.', parts }
        : { correct: false, message: `${parts.filter(Boolean).length}/${parts.length} steps in the right place.`, parts };
    }

    case 'proof-write': {
      const { text, checked } = r as Extract<Response, { type: 'proof-write' }>;
      if (text.trim().length < 20) return no('Write your proof first, then self-check against the rubric.');
      const parts = ex.rubric.map((_, i) => !!checked[i]);
      return parts.every(Boolean)
        ? { correct: true, message: 'Self-graded: every rubric point covered.', parts }
        : { correct: false, message: `Self-graded: ${parts.filter(Boolean).length}/${parts.length} rubric points. Fix the missing ones.`, parts };
    }

    case 'code-python':
    case 'code-rust':
      return no('Code runners arrive in M6 (Rust) and M7 (Python).');
  }
}

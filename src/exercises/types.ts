export type Level = 'A' | 'B' | 'C';

export type ExerciseType =
  | 'numeric'
  | 'expression'
  | 'multiple-choice'
  | 'true-false-why'
  | 'step-fill'
  | 'proof-order'
  | 'proof-write'
  | 'code-python'
  | 'code-rust';

/** A call into the function registry, e.g. { fn: "modInverse", args: [3, 7] }. */
export interface FnCall {
  fn: string;
  args: number[];
}

interface Base {
  id: string;
  level: Level;
  type: ExerciseType;
  prompt: string;
  /** Exactly 3 hints: direction → tool/formula → first step. The 4th rung is `solution`. */
  hints: string[];
  solution: string;
  /** If set, the exercise can be re-rolled with fresh numbers. */
  generator?: string;
  params?: Record<string, number>;
}

export interface NumericExercise extends Base {
  type: 'numeric';
  /** One accepted answer, or several. Integers, decimals or fractions "a/b". */
  answer: string | string[];
  /** Compare modulo this number (answers 5 and 12 are equal mod 7). */
  modulus?: number;
  /** Custom acceptance test for non-unique answers: fn(input, ...args) → boolean. */
  check?: FnCall;
  /** For verify-content: fn(...args) must equal the answer. */
  verify?: FnCall;
}

export interface ExpressionExercise extends Base {
  type: 'expression';
  answer: string;
  /** Evaluate over F_p instead of the reals. */
  modulus?: number;
}

export interface MultipleChoiceExercise extends Base {
  type: 'multiple-choice';
  options: string[];
  /** Index of the correct option, or indices when several are correct (checkbox mode). */
  answer: number | number[];
}

export interface TrueFalseWhyExercise extends Base {
  type: 'true-false-why';
  answer: boolean;
  reasons: string[];
  reason: number;
}

export interface StepFillExercise extends Base {
  type: 'step-fill';
  /** Lines with blanks like {{9}} or {{-5|38}} (alternatives separated by |). */
  template: string[];
}

export interface ProofOrderExercise extends Base {
  type: 'proof-order';
  /** Steps in the CORRECT order; the UI shuffles them. */
  steps: string[];
}

export interface ProofWriteExercise extends Base {
  type: 'proof-write';
  rubric: string[];
}

export interface CodePythonExercise extends Base {
  type: 'code-python';
  starter: string;
  tests: string;
}

export interface CodeRustExercise extends Base {
  type: 'code-rust';
  kata: string;
}

export type Exercise =
  | NumericExercise
  | ExpressionExercise
  | MultipleChoiceExercise
  | TrueFalseWhyExercise
  | StepFillExercise
  | ProofOrderExercise
  | ProofWriteExercise
  | CodePythonExercise
  | CodeRustExercise;

/** What the learner submits, per type. */
export type Response =
  | { type: 'numeric'; value: string }
  | { type: 'expression'; value: string }
  | { type: 'multiple-choice'; selected: number[] }
  | { type: 'true-false-why'; value: boolean | null; reason: number | null }
  | { type: 'step-fill'; blanks: string[] }
  | { type: 'proof-order'; order: number[] } // indices into exercise.steps
  | { type: 'proof-write'; text: string; checked: boolean[] }
  | { type: 'code-python'; code: string }
  | { type: 'code-rust'; code: string };

export interface GradeResult {
  correct: boolean;
  /** Short feedback (English UI). */
  message: string;
  /** Per-blank / per-part correctness when useful. */
  parts?: boolean[];
}

export const LEVEL_LABEL: Record<Level, string> = {
  A: 'Compute',
  B: 'Understand',
  C: 'Prove',
};

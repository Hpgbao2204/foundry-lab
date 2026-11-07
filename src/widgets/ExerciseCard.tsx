import { useMemo, useState, type KeyboardEvent } from 'react';
import type { Exercise, GradeResult, Response } from '../exercises/types';
import { LEVEL_LABEL } from '../exercises/types';
import { grade, BLANK_RE, templateBlanks } from '../exercises/grade';
import { instantiate } from '../generators';
import { hashString, mulberry32, shuffle } from '../generators/rng';
import { recordAttempt } from '../engine/redo';
import { db } from '../db/db';
import { MathText } from './MathText';

const TYPE_LABEL: Record<Exercise['type'], string> = {
  numeric: 'numeric',
  expression: 'expression',
  'multiple-choice': 'multiple choice',
  'true-false-why': 'true / false + why',
  'step-fill': 'fill the steps',
  'proof-order': 'order the proof',
  'proof-write': 'write a proof',
  'code-python': 'Python',
  'code-rust': 'Rust kata',
};

interface Props {
  exercise: Exercise;
  /** 0 = authored numbers; other values re-roll generator exercises. */
  initialSeed?: number;
  index?: number;
}

export function ExerciseCard({ exercise, initialSeed = 0, index }: Props) {
  const [seed, setSeed] = useState(initialSeed);
  // remount the inner card on re-roll so every piece of state resets
  return (
    <ExerciseInner
      key={`${exercise.id}:${seed}`}
      exercise={exercise}
      seed={seed}
      index={index}
      onReroll={exercise.generator ? () => setSeed((Date.now() % 2_147_483_647) || 1) : undefined}
    />
  );
}

function ExerciseInner({ exercise, seed, index, onReroll }: { exercise: Exercise; seed: number; index?: number; onReroll?: () => void }) {
  const ex = useMemo(() => instantiate(exercise, seed), [exercise, seed]);
  const [hints, setHints] = useState(0); // 0..3 hints shown
  const [solution, setSolution] = useState<'hidden' | 'confirm' | 'shown'>('hidden');
  const [result, setResult] = useState<GradeResult | null>(null);
  const [solved, setSolved] = useState(false);
  const [response, setResponse] = useState<Response>(() => initialResponse(ex));

  const hintsUsed = hints + (solution === 'shown' && !solved ? 1 : 0);

  const submit = async () => {
    if (ex.type === 'code-python' || ex.type === 'code-rust') return;
    const r = grade(ex, response);
    setResult(r);
    if (r.correct) setSolved(true);
    await recordAttempt(db, exercise.id, r.correct, hintsUsed);
  };

  const nextHint = () => setHints((h) => Math.min(h + 1, ex.hints.length));

  const revealSolution = async () => {
    if (solution === 'hidden') return setSolution('confirm');
    setSolution('shown');
    if (!solved) await recordAttempt(db, exercise.id, false, ex.hints.length + 1);
  };

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    const t = e.target as HTMLElement;
    const typing = t instanceof HTMLTextAreaElement || (t instanceof HTMLInputElement && t.type === 'text');
    if (e.key === 'Enter' && !(t instanceof HTMLTextAreaElement && !e.ctrlKey) && !(t instanceof HTMLButtonElement)) {
      e.preventDefault();
      void submit();
    } else if ((e.key === 'h' || e.key === 'H') && !typing && !e.ctrlKey && !e.metaKey) {
      e.preventDefault();
      nextHint();
    }
  };

  return (
    <div
      tabIndex={-1}
      onKeyDown={onKeyDown}
      className={`my-6 rounded-lg border bg-white px-5 py-4 font-sans outline-none focus-within:border-neutral-400 dark:bg-neutral-900/40 ${solved ? 'border-emerald-600/50' : 'border-neutral-200 dark:border-neutral-800'}`}
    >
      <div className="mb-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-neutral-500">
        {index !== undefined && <span className="font-mono">#{index + 1}</span>}
        <span className="rounded border border-neutral-300 px-1.5 py-0.5 font-semibold text-neutral-700 dark:border-neutral-700 dark:text-neutral-300">
          {ex.level} · {LEVEL_LABEL[ex.level]}
        </span>
        <span>{TYPE_LABEL[ex.type]}</span>
        {solved && <span className="text-emerald-700 dark:text-emerald-400">✓ solved</span>}
        {onReroll && (
          <button className="ml-auto underline-offset-2 hover:underline" onClick={onReroll} title="Same exercise, new numbers">
            ↻ new numbers
          </button>
        )}
      </div>

      <MathText block text={ex.prompt} className="font-serif text-[1.05rem] leading-relaxed" />

      <div className="mt-4">
        <Inputs ex={ex} response={response} setResponse={setResponse} result={result} />
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        {ex.type !== 'code-python' && ex.type !== 'code-rust' && (
          <button className="btn-accent" onClick={() => void submit()}>
            Check <kbd className="ml-1 border-white/40 dark:border-neutral-900/40">Enter</kbd>
          </button>
        )}
        <button className="btn" onClick={nextHint} disabled={hints >= ex.hints.length}>
          Hint {hints}/{ex.hints.length} <kbd className="ml-1">H</kbd>
        </button>
        {(hints >= ex.hints.length || solved) && solution !== 'shown' && (
          <button className="btn" onClick={() => void revealSolution()}>
            {solved ? 'See worked solution' : solution === 'confirm' ? 'Sure? Show the full solution' : "I've tried — show solution"}
          </button>
        )}
        {result && (
          <span className={`text-sm ${result.correct ? 'text-emerald-700 dark:text-emerald-400' : 'text-rose-700 dark:text-rose-400'}`}>
            {result.message}
          </span>
        )}
      </div>

      {solution === 'confirm' && !solved && (
        <p className="mt-2 text-xs text-neutral-500">Opening the solution puts this exercise in your redo queue (back in 3 days). Click again to open it.</p>
      )}

      {hints > 0 && (
        <ol className="mt-4 space-y-2 border-l-2 border-accent/60 pl-4 text-sm">
          {ex.hints.slice(0, hints).map((h, i) => (
            <li key={i}>
              <span className="label mr-2">{['Direction', 'Tool', 'First step'][i] ?? `Hint ${i + 1}`}</span>
              <MathText text={h} className="font-serif text-[0.98rem]" />
            </li>
          ))}
        </ol>
      )}

      {solution === 'shown' && (
        <div className="mt-4 rounded-md bg-neutral-100 px-4 py-3 dark:bg-neutral-900">
          <div className="label mb-1">Solution</div>
          <MathText block text={ex.solution} className="font-serif leading-relaxed" />
        </div>
      )}
    </div>
  );
}

function initialResponse(ex: Exercise): Response {
  switch (ex.type) {
    case 'numeric':
    case 'expression':
      return { type: ex.type, value: '' };
    case 'multiple-choice':
      return { type: 'multiple-choice', selected: [] };
    case 'true-false-why':
      return { type: 'true-false-why', value: null, reason: null };
    case 'step-fill':
      return { type: 'step-fill', blanks: templateBlanks(ex.template).map(() => '') };
    case 'proof-order':
      return { type: 'proof-order', order: shuffledOrder(ex.id, ex.steps.length) };
    case 'proof-write':
      return { type: 'proof-write', text: '', checked: ex.rubric.map(() => false) };
    default:
      return { type: 'numeric', value: '' };
  }
}

/** Deterministic shuffle that is never already in the correct order. */
export function shuffledOrder(id: string, n: number): number[] {
  const rng = mulberry32(hashString(id));
  const idx = [...Array(n).keys()];
  for (let i = 0; i < 20; i++) {
    const s = shuffle(rng, idx);
    if (s.some((v, j) => v !== j)) return s;
  }
  return idx.reverse();
}

type InputsProps = { ex: Exercise; response: Response; setResponse: (r: Response) => void; result: GradeResult | null };

function Inputs({ ex, response, setResponse, result }: InputsProps) {
  const [selfCheck, setSelfCheck] = useState(false);
  const partClass = (i: number) =>
    result?.parts ? (result.parts[i] ? 'border-emerald-600' : 'border-rose-500') : '';

  switch (ex.type) {
    case 'numeric':
    case 'expression': {
      const r = response as Extract<Response, { type: 'numeric' | 'expression' }>;
      return (
        <input
          type="text"
          autoComplete="off"
          spellCheck={false}
          className="field w-full max-w-sm"
          placeholder={ex.type === 'numeric' ? 'Your answer, e.g. 5 or -3 or 3/4' : 'e.g. x^2 - 2x + 1   (implicit 2x ok)'}
          value={r.value}
          onChange={(e) => setResponse({ ...r, value: e.target.value })}
        />
      );
    }

    case 'multiple-choice': {
      const r = response as Extract<Response, { type: 'multiple-choice' }>;
      const multi = Array.isArray(ex.answer);
      return (
        <div className="space-y-1.5">
          {multi && <p className="text-xs text-neutral-500">Select all that apply.</p>}
          {ex.options.map((o, i) => (
            <label key={i} className="flex cursor-pointer items-start gap-2 font-serif">
              <input
                type={multi ? 'checkbox' : 'radio'}
                className="mt-1.5 accent-[rgb(var(--accent))]"
                checked={r.selected.includes(i)}
                onChange={() =>
                  setResponse({
                    ...r,
                    selected: multi ? (r.selected.includes(i) ? r.selected.filter((x) => x !== i) : [...r.selected, i]) : [i],
                  })
                }
              />
              <MathText text={o} />
            </label>
          ))}
        </div>
      );
    }

    case 'true-false-why': {
      const r = response as Extract<Response, { type: 'true-false-why' }>;
      return (
        <div className="space-y-3">
          <div className={`inline-flex gap-2 rounded-md border-2 border-transparent p-0.5 ${partClass(0)}`}>
            {[true, false].map((v) => (
              <button key={String(v)} className={r.value === v ? 'btn-accent' : 'btn'} onClick={() => setResponse({ ...r, value: v })}>
                {v ? 'True' : 'False'}
              </button>
            ))}
          </div>
          <div className={`space-y-1.5 rounded-md border-2 border-transparent p-1 ${partClass(1)}`}>
            <p className="label">Because…</p>
            {ex.reasons.map((o, i) => (
              <label key={i} className="flex cursor-pointer items-start gap-2 font-serif">
                <input type="radio" className="mt-1.5 accent-[rgb(var(--accent))]" checked={r.reason === i} onChange={() => setResponse({ ...r, reason: i })} />
                <MathText text={o} />
              </label>
            ))}
          </div>
        </div>
      );
    }

    case 'step-fill': {
      const r = response as Extract<Response, { type: 'step-fill' }>;
      let k = 0;
      return (
        <div className="space-y-2 font-serif">
          {ex.template.map((line, li) => {
            const segs = line.split(BLANK_RE); // even = text, odd = blank spec
            return (
              <div key={li} className="flex flex-wrap items-center gap-1">
                {segs.map((s, si) => {
                  if (si % 2 === 0) return s ? <MathText key={si} text={s} /> : null;
                  const idx = k++;
                  return (
                    <input
                      key={si}
                      type="text"
                      autoComplete="off"
                      spellCheck={false}
                      aria-label={`blank ${idx + 1}`}
                      className={`field w-20 px-2 py-0.5 text-center ${partClass(idx)}`}
                      value={r.blanks[idx] ?? ''}
                      onChange={(e) => {
                        const blanks = [...r.blanks];
                        blanks[idx] = e.target.value;
                        setResponse({ ...r, blanks });
                      }}
                    />
                  );
                })}
              </div>
            );
          })}
        </div>
      );
    }

    case 'proof-order': {
      const r = response as Extract<Response, { type: 'proof-order' }>;
      const move = (pos: number, d: -1 | 1) => {
        const order = [...r.order];
        const j = pos + d;
        if (j < 0 || j >= order.length) return;
        [order[pos], order[j]] = [order[j]!, order[pos]!];
        setResponse({ ...r, order });
      };
      return (
        <ol className="space-y-1.5">
          {r.order.map((stepIdx, pos) => (
            <li key={stepIdx} className={`flex items-start gap-2 rounded-md border px-3 py-2 font-serif ${partClass(pos) || 'border-neutral-200 dark:border-neutral-800'}`}>
              <span className="mt-0.5 w-5 font-mono text-xs text-neutral-500">{pos + 1}.</span>
              <MathText text={ex.steps[stepIdx]!} className="flex-1" />
              <span className="flex shrink-0 gap-1 font-sans">
                <button className="btn px-2 py-0.5" aria-label="move up" onClick={() => move(pos, -1)} disabled={pos === 0}>↑</button>
                <button className="btn px-2 py-0.5" aria-label="move down" onClick={() => move(pos, 1)} disabled={pos === r.order.length - 1}>↓</button>
              </span>
            </li>
          ))}
        </ol>
      );
    }

    case 'proof-write': {
      const r = response as Extract<Response, { type: 'proof-write' }>;
      return (
        <div className="space-y-3">
          <textarea
            className="field h-40 w-full font-mono"
            placeholder="Write your proof. Math with $...$. Ctrl+Enter to check."
            value={r.text}
            onChange={(e) => setResponse({ ...r, text: e.target.value })}
          />
          {r.text.trim() && (
            <div className="rounded-md border border-dashed border-neutral-300 px-3 py-2 dark:border-neutral-700">
              <div className="label mb-1">Preview</div>
              <MathText block text={r.text} className="whitespace-pre-wrap font-serif" />
            </div>
          )}
          {!selfCheck ? (
            <button className="btn" disabled={r.text.trim().length < 20} onClick={() => setSelfCheck(true)}>
              Done writing — show rubric
            </button>
          ) : (
            <div>
              <div className="label mb-1">Self-check rubric — tick what your proof really contains</div>
              {ex.rubric.map((item, i) => (
                <label key={i} className={`flex cursor-pointer items-start gap-2 rounded border-2 border-transparent px-1 font-serif ${partClass(i)}`}>
                  <input
                    type="checkbox"
                    className="mt-1.5 accent-[rgb(var(--accent))]"
                    checked={r.checked[i] ?? false}
                    onChange={() => {
                      const checked = [...r.checked];
                      checked[i] = !checked[i];
                      setResponse({ ...r, checked });
                    }}
                  />
                  <MathText text={item} />
                </label>
              ))}
            </div>
          )}
        </div>
      );
    }

    case 'code-python':
    case 'code-rust':
      return (
        <p className="text-sm text-neutral-500">
          {ex.type === 'code-rust' ? `Rust kata “${ex.kata}” — runner arrives in M6.` : 'Python (Pyodide) runner arrives in M7.'}
        </p>
      );
  }
}

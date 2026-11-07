import { createContext, useContext, useId, useState, type ReactNode } from 'react';
import { lookupTerm } from '../engine/content';
import type { LessonMeta } from '../content-types';
import { exercisesFor } from '../engine/exercises';
import { ExerciseCard } from './ExerciseCard';

export const LessonContext = createContext<LessonMeta | null>(null);

type P = { children?: ReactNode };

function Section({ label, children, className = '' }: P & { label: string; className?: string }) {
  return (
    <section className={`not-prose-label my-8 ${className}`}>
      <div className="mb-2 font-sans text-xs uppercase tracking-widest text-neutral-500">{label}</div>
      <div>{children}</div>
    </section>
  );
}

export function Why({ children }: P) {
  const lesson = useContext(LessonContext);
  return (
    <Section label="Why it matters">
      {children}
      {lesson?.researchBridge && (
        <p className="border-l-2 border-accent pl-3 text-[0.95em] text-neutral-600 dark:text-neutral-400">
          <span className="font-sans text-xs uppercase tracking-wider">Where it shows up · </span>
          {lesson.researchBridge}
        </p>
      )}
    </Section>
  );
}

export function Intuition({ children }: P) {
  return <Section label="Intuition">{children}</Section>;
}

function Formal({ kind, title, children }: P & { kind: string; title?: string }) {
  return (
    <div className="my-6 rounded-md border border-neutral-300 px-5 py-1 dark:border-neutral-700">
      <p className="mb-0 font-sans text-sm">
        <strong>
          {kind}
          {title ? ` (${title})` : ''}.
        </strong>
      </p>
      <div className="formal-body">{children}</div>
    </div>
  );
}

export function Definition({ title, children }: P & { title?: string }) {
  return <Formal kind="Definition" title={title}>{children}</Formal>;
}

export function Theorem({ title, kind = 'Theorem', children }: P & { title?: string; kind?: string }) {
  return <Formal kind={kind} title={title}>{children}</Formal>;
}

export function Proof({ children, title = 'Proof' }: P & { title?: string }) {
  return (
    <details className="my-4 rounded-md border border-dashed border-neutral-300 px-5 py-2 dark:border-neutral-700">
      <summary className="cursor-pointer font-sans text-sm text-neutral-500">{title} — click to expand</summary>
      <div className="mt-2">{children}</div>
      <p className="text-right">∎</p>
    </details>
  );
}

export function Example({ title, children }: P & { title?: string }) {
  return (
    <Section label={`Worked example${title ? ` — ${title}` : ''}`} className="border-l-2 border-neutral-300 pl-4 dark:border-neutral-700">
      {children}
    </Section>
  );
}

export function Pitfalls({ children }: P) {
  return <Section label="Common pitfalls">{children}</Section>;
}

export function Summary({ children }: P) {
  return (
    <Section label="Summary" className="rounded-md bg-neutral-100/80 px-5 py-1 dark:bg-neutral-900">
      {children}
    </Section>
  );
}

export function Exercises() {
  const lesson = useContext(LessonContext);
  const list = lesson ? exercisesFor(lesson.id) : [];
  return (
    <Section label={`Exercises · ${list.length}`}>
      {list.length === 0 ? (
        <p className="text-neutral-500">No exercises yet.</p>
      ) : (
        <div className="not-prose">
          <p className="font-sans text-sm text-neutral-500">
            Level A = compute, B = understand, C = prove. <kbd>Enter</kbd> to check, <kbd>H</kbd> for the next hint.
          </p>
          {list.map((ex, i) => (
            <ExerciseCard key={ex.id} exercise={ex} index={i} />
          ))}
        </div>
      )}
    </Section>
  );
}

/** English term; hover/focus shows the Vietnamese explanation from glossary.json. */
export function Term({ en, children }: P & { en: string }) {
  const entry = lookupTerm(en);
  const [open, setOpen] = useState(false);
  const id = useId();
  const label = children ?? en;
  if (!entry) {
    if (import.meta.env.DEV) console.warn(`[glossary] missing term: ${en}`);
    return <em>{label}</em>;
  }
  return (
    <span className="relative inline-block">
      <span
        tabIndex={0}
        aria-describedby={id}
        className="cursor-help border-b border-dotted border-neutral-500"
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
      >
        {label}
      </span>
      <span
        id={id}
        role="tooltip"
        className={`absolute left-0 top-full z-20 mt-1 w-72 rounded-md border border-neutral-200 bg-white p-3 font-sans text-sm leading-snug text-neutral-800 shadow-lg dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-200 ${open ? 'block' : 'hidden'}`}
      >
        <strong>{entry.en}</strong> — {entry.vi}
        <br />
        <span className="text-neutral-500 dark:text-neutral-400">{entry.explain}</span>
      </span>
    </span>
  );
}

export const mdxComponents = { Why, Intuition, Definition, Theorem, Proof, Example, Pitfalls, Exercises, Summary, Term };

import type { AttemptRow, ForgeDB } from '../db/db';

/** Hints at or above this rung (3 = first-step hint, 4 = full solution) mean "not solid yet". */
export const WEAK_HINTS = 3;
export const REDO_AFTER_DAYS = 3;
const DAY = 86_400_000;

export async function recordAttempt(db: ForgeDB, exerciseId: string, correct: boolean, hintsUsed: number, ts = Date.now()) {
  await db.attempts.add({ exerciseId, correct, hintsUsed, ts });
}

export interface RedoItem {
  exerciseId: string;
  dueAt: number;
  lastHints: number;
  /** Attempt count so far — used as the seed for fresh numbers. */
  attempts: number;
}

/**
 * An exercise needs redoing when its LATEST attempt was not solid:
 * wrong / gave up (opened the solution) or solved with hints ≥ WEAK_HINTS.
 * It comes back REDO_AFTER_DAYS after that attempt, and leaves the queue once solved cleanly.
 */
export function computeRedo(attempts: AttemptRow[]): RedoItem[] {
  const groups = new Map<string, AttemptRow[]>();
  for (const a of attempts) groups.set(a.exerciseId, [...(groups.get(a.exerciseId) ?? []), a]);
  const out: RedoItem[] = [];
  for (const [exerciseId, list] of groups) {
    list.sort((a, b) => a.ts - b.ts);
    const last = list[list.length - 1]!;
    const weak = !last.correct || last.hintsUsed >= WEAK_HINTS;
    if (weak) out.push({ exerciseId, dueAt: last.ts + REDO_AFTER_DAYS * DAY, lastHints: last.hintsUsed, attempts: list.length });
  }
  return out.sort((a, b) => a.dueAt - b.dueAt);
}

export async function redoQueue(db: ForgeDB, now = Date.now()) {
  const all = computeRedo(await db.attempts.toArray());
  return { due: all.filter((r) => r.dueAt <= now), upcoming: all.filter((r) => r.dueAt > now) };
}

/** Exercise ids that were solved at least once (any hints). */
export function solvedIds(attempts: AttemptRow[]): Set<string> {
  return new Set(attempts.filter((a) => a.correct).map((a) => a.exerciseId));
}

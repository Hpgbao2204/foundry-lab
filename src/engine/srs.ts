import { createEmptyCard, fsrs, generatorParameters, Rating, type Card, type Grade } from 'ts-fsrs';
import type { ForgeDB, CardRow } from '../db/db';
import type { LessonMeta } from '../content-types';

const scheduler = fsrs(generatorParameters({ enable_fuzz: false, request_retention: 0.9 }));

export { Rating };
export type { Grade };

export const GRADES: Grade[] = [Rating.Again, Rating.Hard, Rating.Good, Rating.Easy];

/** IndexedDB keeps Dates, but a JSON import gives strings — normalise. */
export function reviveCard(c: Card): Card {
  return {
    ...c,
    due: new Date(c.due),
    last_review: c.last_review ? new Date(c.last_review) : undefined,
  };
}

export function cardId(lessonId: string, index: number) {
  return `${lessonId}#${index}`;
}

/** Add lesson flashcards to the review queue. Existing cards keep their schedule; text is refreshed. */
export async function enqueueLessonCards(db: ForgeDB, lesson: LessonMeta, now = new Date()): Promise<number> {
  let added = 0;
  await db.transaction('rw', db.cards, async () => {
    for (const [i, fc] of lesson.flashcards.entries()) {
      const id = cardId(lesson.id, i);
      const existing = await db.cards.get(id);
      if (existing) {
        if (existing.front !== fc.front || existing.back !== fc.back) {
          await db.cards.update(id, { front: fc.front, back: fc.back });
        }
        continue;
      }
      const fsrsCard = createEmptyCard(now);
      await db.cards.put({ id, lessonId: lesson.id, front: fc.front, back: fc.back, fsrs: fsrsCard, due: fsrsCard.due.getTime() });
      added++;
    }
  });
  return added;
}

export async function dueCards(db: ForgeDB, now = new Date()): Promise<CardRow[]> {
  return db.cards.where('due').belowOrEqual(now.getTime()).sortBy('due');
}

export async function reviewCard(db: ForgeDB, id: string, grade: Grade, now = new Date()): Promise<CardRow> {
  const row = await db.cards.get(id);
  if (!row) throw new Error(`card not found: ${id}`);
  const { card } = scheduler.next(reviveCard(row.fsrs), now, grade);
  const updated: CardRow = { ...row, fsrs: card, due: card.due.getTime() };
  await db.cards.put(updated);
  return updated;
}

/** Human-readable next interval for each grade (shown on the rating buttons). */
export function previewIntervals(c: Card, now = new Date()): Record<Grade, string> {
  const preview = scheduler.repeat(reviveCard(c), now);
  const out = {} as Record<Grade, string>;
  for (const g of GRADES) out[g] = formatInterval(preview[g].card.due.getTime() - now.getTime());
  return out;
}

export function formatInterval(ms: number): string {
  const min = Math.round(ms / 60000);
  if (min < 60) return `${Math.max(1, min)} min`;
  const h = Math.round(min / 60);
  if (h < 24) return `${h} h`;
  const d = Math.round(h / 24);
  if (d < 31) return `${d} d`;
  const mo = Math.round(d / 30);
  if (mo < 12) return `${mo} mo`;
  return `${(d / 365).toFixed(1)} y`;
}

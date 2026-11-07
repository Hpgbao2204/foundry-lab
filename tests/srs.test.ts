import { beforeEach, describe, expect, it } from 'vitest';
import { ForgeDB } from '../src/db/db';
import { dueCards, enqueueLessonCards, reviewCard, Rating } from '../src/engine/srs';
import { markRead } from '../src/engine/progress';
import { exportAll, importAll } from '../src/engine/backup';
import type { LessonMeta } from '../src/content-types';

const lesson: LessonMeta = {
  id: 'test.lesson',
  track: 'math',
  chapter: 'x',
  title: 'Test',
  minutes: 1,
  prerequisites: [],
  researchBridge: '',
  flashcards: [
    { front: 'Q1', back: 'A1' },
    { front: 'Q2', back: 'A2' },
  ],
};

let db: ForgeDB;
beforeEach(async () => {
  db = new ForgeDB(`test-${Math.random()}`);
  await db.open();
});

describe('flashcard queue (FSRS)', () => {
  it('markRead enqueues cards once, and they are due immediately', async () => {
    const now = new Date('2026-01-01T20:00:00Z');
    expect(await markRead(db, lesson, now)).toBe(2);
    expect(await markRead(db, lesson, now)).toBe(0); // idempotent
    expect((await db.progress.get(lesson.id))?.status).toBe('read');
    expect(await dueCards(db, now)).toHaveLength(2);
  });

  it('re-enqueue keeps schedule but refreshes text', async () => {
    const now = new Date('2026-01-01T20:00:00Z');
    await enqueueLessonCards(db, lesson, now);
    await reviewCard(db, 'test.lesson#0', Rating.Good, now);
    const before = await db.cards.get('test.lesson#0');
    await enqueueLessonCards(db, { ...lesson, flashcards: [{ front: 'Q1 v2', back: 'A1' }, lesson.flashcards[1]!] }, now);
    const after = await db.cards.get('test.lesson#0');
    expect(after?.front).toBe('Q1 v2');
    expect(after?.due).toBe(before?.due);
  });

  it('reviewing pushes due date forward; Easy goes further than Again', async () => {
    const now = new Date('2026-01-01T20:00:00Z');
    await enqueueLessonCards(db, lesson, now);
    const again = await reviewCard(db, 'test.lesson#0', Rating.Again, now);
    const easy = await reviewCard(db, 'test.lesson#1', Rating.Easy, now);
    expect(again.due).toBeGreaterThan(now.getTime());
    expect(easy.due).toBeGreaterThan(again.due);
    expect(await dueCards(db, now)).toHaveLength(0);
    // Easy on a new card → at least a day later
    expect(easy.due - now.getTime()).toBeGreaterThanOrEqual(24 * 3600 * 1000);
  });

  it('export → import round-trips, including Date fields via JSON', async () => {
    const now = new Date('2026-01-01T20:00:00Z');
    await markRead(db, lesson, now);
    await reviewCard(db, 'test.lesson#0', Rating.Good, now);
    await db.notes.put({ lessonId: lesson.id, text: 'note', updatedAt: 1 });
    const json = JSON.parse(JSON.stringify(await exportAll(db)));

    const db2 = new ForgeDB(`test-${Math.random()}`);
    await importAll(db2, json);
    const card = await db2.cards.get('test.lesson#0');
    expect(card?.fsrs.due).toBeInstanceOf(Date);
    expect(card?.due).toBe((await db.cards.get('test.lesson#0'))?.due);
    expect((await db2.notes.get(lesson.id))?.text).toBe('note');
    // a card imported from JSON can still be reviewed
    await expect(reviewCard(db2, 'test.lesson#0', Rating.Good, new Date(card!.due))).resolves.toBeTruthy();
  });

  it('rejects a foreign backup file', async () => {
    await expect(importAll(db, { app: 'other' } as never)).rejects.toThrow();
  });
});

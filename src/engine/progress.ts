import type { ForgeDB } from '../db/db';
import type { LessonMeta } from '../content-types';
import { enqueueLessonCards } from './srs';

export async function markOpened(db: ForgeDB, lessonId: string, now = Date.now()) {
  const row = await db.progress.get(lessonId);
  if (!row) await db.progress.put({ lessonId, status: 'opened', openedAt: now });
}

/** Mark read and push the lesson's flashcards into the review queue. Returns number of new cards. */
export async function markRead(db: ForgeDB, lesson: LessonMeta, now = new Date()) {
  const row = await db.progress.get(lesson.id);
  await db.progress.put({ lessonId: lesson.id, status: 'read', openedAt: row?.openedAt ?? now.getTime(), readAt: now.getTime() });
  return enqueueLessonCards(db, lesson, now);
}

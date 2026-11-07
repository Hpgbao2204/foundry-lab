import type { Exercise, Level } from '../exercises/types';
import { tracks, getLesson } from './content';
import { hashString, mulberry32, shuffle } from '../generators/rng';

const files = import.meta.glob<Exercise[]>('/content/exercises/**/*.json', { eager: true, import: 'default' });

/** lessonId → exercises. File: content/exercises/<track>/<lessonId>.json */
const byLesson = new Map<string, Exercise[]>();
const byId = new Map<string, { ex: Exercise; lessonId: string }>();

for (const [path, list] of Object.entries(files)) {
  const lessonId = path.split('/').pop()!.replace(/\.json$/, '');
  byLesson.set(lessonId, list);
  for (const ex of list) byId.set(ex.id, { ex, lessonId });
}

const LEVEL_ORDER: Record<Level, number> = { A: 0, B: 1, C: 2 };
export const byLevel = (a: Exercise, b: Exercise) => LEVEL_ORDER[a.level] - LEVEL_ORDER[b.level];

export function exerciseFiles(): Map<string, Exercise[]> {
  return byLesson;
}

export function exercisesFor(lessonId: string): Exercise[] {
  return [...(byLesson.get(lessonId) ?? [])].sort(byLevel);
}

export function getExercise(id: string): { ex: Exercise; lessonId: string } | undefined {
  return byId.get(id);
}

/** Round-robin across lessons so a set mixes every lesson of the chapter. */
function interleave(groups: Exercise[][]): Exercise[] {
  const out: Exercise[] = [];
  const qs = groups.map((g) => [...g]);
  while (qs.some((q) => q.length)) for (const q of qs) if (q.length) out.push(q.shift()!);
  return out;
}

/**
 * Chapter problem set (SPEC §3.5): 10–15 exercises mixing all lessons of the chapter,
 * ordered A → B → C. Quotas ≈ 7 A / 5 B / 3 C, topped up from other levels if short.
 */
export function problemSet(trackId: string, chapterId: string, max = 15): Exercise[] {
  const chapter = tracks.find((t) => t.id === trackId)?.chapters.find((c) => c.id === chapterId);
  if (!chapter) return [];
  const pools = (lvl: Level) => interleave(chapter.lessons.map((l) => exercisesFor(l).filter((e) => e.level === lvl)));
  const A = pools('A'), Bs = pools('B'), C = pools('C');
  const quota = { A: Math.round(max * 0.47), B: Math.round(max * 0.33), C: max - Math.round(max * 0.47) - Math.round(max * 0.33) };
  const take = { A: Math.min(A.length, quota.A), B: Math.min(Bs.length, quota.B), C: Math.min(C.length, quota.C) };
  let spare = max - take.A - take.B - take.C;
  for (const [lvl, pool] of [['B', Bs], ['A', A], ['C', C]] as const) {
    const extra = Math.min(spare, pool.length - take[lvl]);
    take[lvl] += extra;
    spare -= extra;
  }
  return [...A.slice(0, take.A), ...Bs.slice(0, take.B), ...C.slice(0, take.C)];
}

/** ISO-ish week number; the weekly mix stays stable during a week. */
export function weekKey(d = new Date()): string {
  const t = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const day = t.getUTCDay() || 7;
  t.setUTCDate(t.getUTCDate() + 4 - day);
  const y = t.getUTCFullYear();
  const week = Math.ceil(((t.getTime() - Date.UTC(y, 0, 1)) / 86400000 + 1) / 7);
  return `${y}-W${String(week).padStart(2, '0')}`;
}

/** Weekly mixed review (SPEC §3.5): exercises from lessons already read, across chapters. */
export function mixedReview(readLessonIds: Iterable<string>, week = weekKey(), size = 10): Exercise[] {
  const lessons = [...readLessonIds].filter((id) => getLesson(id) && byLesson.has(id)).sort();
  if (lessons.length === 0) return [];
  const rng = mulberry32(hashString(week));
  const perLesson = lessons.map((l) => shuffle(rng, exercisesFor(l)));
  return interleave(perLesson).slice(0, size).sort(byLevel);
}

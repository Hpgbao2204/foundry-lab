import { Link } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../db/db';
import { nextLesson, getLesson, orderedLessonIds } from '../../engine/content';
import { redoQueue } from '../../engine/redo';
import { getExercise } from '../../engine/exercises';
import { MathText } from '../../widgets/MathText';
import { instantiate } from '../../generators';

const short = (title: string) => title.split(' — ')[0];

export function HomePage() {
  const data = useLiveQuery(async () => {
    const now = Date.now();
    const [due, total, progress, redo] = await Promise.all([
      db.cards.where('due').belowOrEqual(now).count(),
      db.cards.count(),
      db.progress.toArray(),
      redoQueue(db, now),
    ]);
    const nextDue = due === 0 ? (await db.cards.orderBy('due').first())?.due : undefined;
    return { due, total, progress, nextDue, redo };
  }, []);

  if (!data) return null;
  const read = new Set(data.progress.filter((p) => p.status === 'read').map((p) => p.lessonId));
  const inProgress = data.progress
    .filter((p) => p.status === 'opened')
    .sort((a, b) => b.openedAt - a.openedAt)
    .map((p) => getLesson(p.lessonId))
    .filter((l) => l !== undefined);
  const next = nextLesson(read);
  const totalLessons = orderedLessonIds().length;
  const redoDue = data.redo.due
    .map((r) => {
      const hit = getExercise(r.exerciseId);
      return { r, hit, prompt: hit ? instantiate(hit.ex, hit.ex.prompt ? 0 : 1).prompt : '' };
    })
    .filter((x) => x.hit);

  return (
    <div className="max-w-read">
      <h1 className="mb-1 font-sans text-3xl font-semibold tracking-tight">Tonight</h1>
      <p className="mb-10 font-sans text-sm text-neutral-500">
        {read.size}/{totalLessons} lessons read · {data.total} flashcards in the queue
      </p>

      <Block title="1 · Flashcards due">
        {data.due > 0 ? (
          <p>
            <strong>{data.due}</strong> cards due.{' '}
            <Link to="/review" className="btn-accent ml-2 inline-block">Review now</Link>
          </p>
        ) : (
          <p className="text-neutral-500">
            Nothing due.
            {data.nextDue && <> Next card: {new Date(data.nextDue).toLocaleString('en-GB', { dateStyle: 'medium', timeStyle: 'short' })}.</>}
          </p>
        )}
      </Block>

      <Block title="2 · Next lesson">
        {next ? (
          <p>
            <Link to={`/lesson/${next.id}`} className="font-serif text-lg underline decoration-accent underline-offset-4">{next.title}</Link>
            <span className="ml-2 font-sans text-sm text-neutral-500">~{next.minutes} min</span>
          </p>
        ) : (
          <p className="text-neutral-500">You have read every lesson available.</p>
        )}
        {inProgress.length > 0 && (
          <p className="mt-2 font-sans text-sm text-neutral-500">
            In progress:{' '}
            {inProgress.map((l, i) => (
              <span key={l.id}>
                {i > 0 && ', '}
                <Link to={`/lesson/${l.id}`} className="underline">{short(l.title)}</Link>
              </span>
            ))}
          </p>
        )}
      </Block>

      <Block title="3 · Exercises to redo">
        {redoDue.length === 0 ? (
          <p className="text-neutral-500">
            Nothing to redo.
            {data.redo.upcoming.length > 0 && <> {data.redo.upcoming.length} exercise(s) come back in a few days.</>}
            {' '}Exercises where you needed hint 3+ or the solution return here after 3 days.
          </p>
        ) : (
          <ul className="space-y-2">
            {redoDue.map(({ r, hit, prompt }) => (
              <li key={r.exerciseId} className="flex items-baseline gap-3">
                <span className="font-mono text-xs text-neutral-500">{hit!.ex.level}</span>
                <Link to={`/practice/${r.exerciseId}`} className="font-serif hover:underline">
                  <MathText text={prompt} />
                </Link>
                <span className="font-sans text-xs text-neutral-500">{short(getLesson(hit!.lessonId)?.title ?? '')}</span>
              </li>
            ))}
          </ul>
        )}
      </Block>

      {read.size > 0 && (
        <Block title="4 · Weekly mix">
          <p>
            <Link to="/mixed" className="underline decoration-accent underline-offset-4">Mixed review</Link>
            <span className="ml-2 font-sans text-sm text-neutral-500">10 exercises from every lesson you have read</span>
          </p>
        </Block>
      )}
    </div>
  );
}

function Block({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-9">
      <h2 className="label mb-2">{title}</h2>
      {children}
    </section>
  );
}

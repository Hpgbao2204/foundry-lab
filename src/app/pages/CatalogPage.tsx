import { Link } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../db/db';
import { getLesson, tracks } from '../../engine/content';
import { exercisesFor, problemSet } from '../../engine/exercises';
import { solvedIds } from '../../engine/redo';

export function CatalogPage() {
  const progress = useLiveQuery(() => db.progress.toArray(), [], []);
  const attempts = useLiveQuery(() => db.attempts.toArray(), [], []);
  const status = new Map(progress.map((p) => [p.lessonId, p.status]));
  const solved = solvedIds(attempts);

  return (
    <div className="max-w-read">
      <h1 className="mb-8 font-sans text-3xl font-semibold tracking-tight">Catalog</h1>
      {tracks.map((t) => (
        <section key={t.id} className="mb-10">
          <h2 className="font-sans text-lg font-semibold">{t.title}</h2>
          <p className="mb-4 font-sans text-sm text-neutral-500">{t.description}</p>
          {t.chapters.length === 0 && <p className="font-sans text-sm italic text-neutral-500">Coming soon.</p>}
          {t.chapters.map((c) => {
            const ps = problemSet(t.id, c.id);
            return (
              <div key={c.id} className="mb-5 ml-1">
                <div className="flex items-baseline gap-3">
                  <h3 className="label">{c.title}</h3>
                  {ps.length > 0 && (
                    <Link to={`/problem-set/${t.id}/${c.id}`} className="font-sans text-xs text-accent hover:underline">
                      Problem set · {ps.length}
                    </Link>
                  )}
                </div>
                <ul className="mt-2 space-y-1.5 font-serif">
                  {c.lessons.map((id) => {
                    const l = getLesson(id);
                    const s = status.get(id);
                    const exs = exercisesFor(id);
                    const done = exs.filter((e) => solved.has(e.id)).length;
                    return (
                      <li key={id} className="flex items-baseline gap-2">
                        <span className="w-4 font-sans text-sm text-accent" aria-label={s ?? 'unread'}>
                          {s === 'read' ? '✓' : s === 'opened' ? '·' : ''}
                        </span>
                        {l ? (
                          <Link to={`/lesson/${id}`} className="hover:underline">{l.title}</Link>
                        ) : (
                          <span className="text-neutral-500">{id} (missing file)</span>
                        )}
                        {l && (
                          <span className="whitespace-nowrap font-sans text-xs text-neutral-500">
                            {l.minutes} min{exs.length > 0 && ` · ${done}/${exs.length} solved`}
                          </span>
                        )}
                      </li>
                    );
                  })}
                </ul>
              </div>
            );
          })}
        </section>
      ))}
    </div>
  );
}

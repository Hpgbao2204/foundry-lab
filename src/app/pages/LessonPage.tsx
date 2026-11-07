import { useEffect, useRef, useState, type ComponentType } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../db/db';
import { getLesson, loadLessonComponent, orderedLessonIds, prerequisitesOf, lessonExists } from '../../engine/content';
import { markOpened, markRead } from '../../engine/progress';
import { LessonContext, mdxComponents } from '../../widgets/lesson-components';

type Mdx = ComponentType<{ components?: Record<string, unknown> }>;

export function LessonPage() {
  const { id = '' } = useParams();
  const lesson = getLesson(id);
  const [Content, setContent] = useState<Mdx | null>(null);
  const [flash, setFlash] = useState<string | null>(null);
  const progress = useLiveQuery(() => db.progress.get(id), [id]);

  useEffect(() => {
    let alive = true;
    setContent(null);
    setFlash(null);
    void loadLessonComponent(id).then((c) => alive && c && setContent(() => c));
    if (lesson) void markOpened(db, id);
    window.scrollTo(0, 0);
    return () => {
      alive = false;
    };
  }, [id, lesson]);

  if (!lesson) return <p>Lesson <code>{id}</code> not found.</p>;

  const order = orderedLessonIds();
  const idx = order.indexOf(id);
  const prev = idx > 0 ? getLesson(order[idx - 1]!) : undefined;
  const next = idx >= 0 && idx < order.length - 1 ? getLesson(order[idx + 1]!) : undefined;
  const prereqs = prerequisitesOf(id);

  const onDone = async () => {
    const added = await markRead(db, lesson);
    setFlash(added > 0 ? `Added ${added} flashcards to the review queue.` : 'Marked as read. Flashcards are already in the queue.');
  };

  return (
    <article>
      <header className="mb-6 max-w-read">
        <p className="font-sans text-xs uppercase tracking-widest text-neutral-500">
          {lesson.track} · {lesson.chapter} · ~{lesson.minutes} min
        </p>
        <h1 className="mt-1 font-sans text-3xl font-semibold leading-tight">{lesson.title}</h1>
        {prereqs.length > 0 && (
          <p className="mt-2 font-sans text-sm text-neutral-500">
            Prerequisites:{' '}
            {prereqs.map((p, i) => (
              <span key={p}>
                {i > 0 && ', '}
                {lessonExists(p) ? <Link className="underline" to={`/lesson/${p}`}>{getLesson(p)!.title.split(' — ')[0]}</Link> : <code>{p}</code>}
              </span>
            ))}
          </p>
        )}
      </header>

      <div className="prose prose-neutral max-w-read font-serif prose-headings:font-sans prose-code:before:content-none prose-code:after:content-none dark:prose-invert prose-pre:bg-neutral-900 prose-pre:text-neutral-200">
        <LessonContext.Provider value={lesson}>
          {Content ? <Content components={mdxComponents} /> : <p className="text-neutral-500">Loading…</p>}
        </LessonContext.Provider>
      </div>

      <div className="mt-10 max-w-read border-t border-neutral-200 pt-6 font-sans dark:border-neutral-800">
        <div className="flex flex-wrap items-center gap-3">
          <button className="btn-accent" onClick={onDone}>
            {progress?.status === 'read' ? 'Read ✓ (click again to sync flashcards)' : 'Mark as read → add flashcards'}
          </button>
          {flash && <span className="text-sm text-neutral-500">{flash} <Link className="underline" to="/review">Review</Link></span>}
        </div>
        <NoteBox lessonId={id} />
        <nav className="mt-8 flex justify-between text-sm">
          {prev ? <Link className="hover:underline" to={`/lesson/${prev.id}`}>← {prev.title.split(' — ')[0]}</Link> : <span />}
          {next ? <Link className="hover:underline" to={`/lesson/${next.id}`}>{next.title.split(' — ')[0]} →</Link> : <span />}
        </nav>
      </div>
    </article>
  );
}

function NoteBox({ lessonId }: { lessonId: string }) {
  const [text, setText] = useState<string | null>(null);
  const timer = useRef<number>();

  useEffect(() => {
    setText(null);
    void db.notes.get(lessonId).then((n) => setText(n?.text ?? ''));
  }, [lessonId]);

  const onChange = (v: string) => {
    setText(v);
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => {
      void (v.trim() ? db.notes.put({ lessonId, text: v, updatedAt: Date.now() }) : db.notes.delete(lessonId));
    }, 400);
  };

  if (text === null) return null;
  return (
    <label className="mt-6 block">
      <span className="label">Your notes (Markdown, autosaved)</span>
      <textarea
        className="mt-2 block h-28 w-full rounded-md border border-neutral-300 bg-white p-3 font-mono dark:bg-neutral-900 text-sm dark:border-neutral-700"
        value={text}
        onChange={(e) => onChange(e.target.value)}
        placeholder="What I got wrong, open questions…"
      />
    </label>
  );
}

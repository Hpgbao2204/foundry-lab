import { Link } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, type NoteRow } from '../../db/db';
import { getLesson } from '../../engine/content';
import { download } from '../../lib/download';

export function notesToMarkdown(notes: NoteRow[]): string {
  const parts = ['# forge-lab — notes', ''];
  for (const n of notes) {
    const title = getLesson(n.lessonId)?.title ?? n.lessonId;
    parts.push(`## ${title}`, '', `_${new Date(n.updatedAt).toLocaleString('en-GB')}_`, '', n.text.trim(), '');
  }
  return parts.join('\n');
}

export function NotesPage() {
  const notes = useLiveQuery(() => db.notes.orderBy('updatedAt').reverse().toArray(), [], []);

  return (
    <div className="max-w-read">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="font-sans text-3xl font-semibold tracking-tight">Notes</h1>
        <button className="btn" disabled={notes.length === 0} onClick={() => download('forge-lab-notes.md', notesToMarkdown(notes), 'text/markdown')}>
          Export Markdown
        </button>
      </div>
      {notes.length === 0 && <p className="font-sans text-neutral-500">No notes yet. Write them at the end of each lesson.</p>}
      {notes.map((n) => (
        <section key={n.lessonId} className="mb-6">
          <h2 className="font-sans font-semibold">
            <Link className="hover:underline" to={`/lesson/${n.lessonId}`}>{getLesson(n.lessonId)?.title ?? n.lessonId}</Link>
          </h2>
          <pre className="mt-1 whitespace-pre-wrap font-serif text-neutral-700 dark:text-neutral-300">{n.text}</pre>
        </section>
      ))}
    </div>
  );
}

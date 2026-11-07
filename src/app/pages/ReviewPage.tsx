import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { db, type CardRow } from '../../db/db';
import { dueCards, GRADES, previewIntervals, reviewCard, Rating, type Grade } from '../../engine/srs';
import { getLesson } from '../../engine/content';

const LABEL: Record<Grade, string> = {
  [Rating.Again]: 'Again',
  [Rating.Hard]: 'Hard',
  [Rating.Good]: 'Good',
  [Rating.Easy]: 'Easy',
};

export function ReviewPage() {
  const [queue, setQueue] = useState<CardRow[] | null>(null);
  const [shown, setShown] = useState(false);
  const [done, setDone] = useState(0);

  const refresh = useCallback(async () => setQueue(await dueCards(db)), []);
  useEffect(() => {
    void refresh();
  }, [refresh]);

  const card = queue?.[0];

  const rate = useCallback(
    async (g: Grade) => {
      if (!card) return;
      await reviewCard(db, card.id, g);
      setShown(false);
      setDone((d) => d + 1);
      await refresh();
    },
    [card, refresh],
  );

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (!card) return;
      if (!shown && (e.key === ' ' || e.key === 'Enter')) {
        e.preventDefault();
        setShown(true);
      } else if (shown && ['1', '2', '3', '4'].includes(e.key)) {
        void rate(Number(e.key) as Grade);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [card, shown, rate]);

  if (!queue) return null;

  if (!card) {
    return (
      <div className="max-w-read font-sans">
        <h1 className="mb-4 text-3xl font-semibold tracking-tight">Flashcards</h1>
        <p className="text-neutral-500">
          {done > 0 ? `Done: ${done} cards. ` : ''}No cards due. Read more lessons in the <Link className="underline" to="/catalog">Catalog</Link>.
        </p>
      </div>
    );
  }

  const intervals = previewIntervals(card.fsrs);
  const lesson = getLesson(card.lessonId);

  return (
    <div className="max-w-read">
      <p className="mb-6 font-sans text-sm text-neutral-500">
        {queue.length} left · {done} reviewed
        {lesson && (
          <> · from <Link className="underline" to={`/lesson/${lesson.id}`}>{lesson.title.split(' — ')[0]}</Link></>
        )}
      </p>
      <div className="rounded-lg border border-neutral-200 bg-white p-8 font-serif dark:border-neutral-800 dark:bg-neutral-900/40 text-xl">
        <p>{card.front}</p>
        {shown && <p className="mt-6 border-t border-neutral-200 pt-6 text-neutral-700 dark:border-neutral-800 dark:text-neutral-300">{card.back}</p>}
      </div>
      <div className="mt-6 flex flex-wrap gap-3 font-sans">
        {!shown ? (
          <button className="btn-accent" onClick={() => setShown(true)}>
            Show answer <kbd>Space</kbd>
          </button>
        ) : (
          GRADES.map((g) => (
            <button key={g} className="btn" onClick={() => void rate(g)}>
              <kbd>{g}</kbd> {LABEL[g]} <span className="ml-1 text-xs text-neutral-500">{intervals[g]}</span>
            </button>
          ))
        )}
      </div>
    </div>
  );
}

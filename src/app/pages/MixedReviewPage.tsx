import { Link } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../db/db';
import { mixedReview, weekKey } from '../../engine/exercises';
import { hashString } from '../../generators/rng';
import { ExerciseCard } from '../../widgets/ExerciseCard';

export function MixedReviewPage() {
  const read = useLiveQuery(async () => (await db.progress.where('status').equals('read').toArray()).map((p) => p.lessonId), []);
  if (!read) return null;
  const week = weekKey();
  const list = mixedReview(read, week);

  return (
    <div className="max-w-read">
      <p className="label">Week {week}</p>
      <h1 className="mt-1 font-sans text-3xl font-semibold tracking-tight">Mixed review</h1>
      <p className="mt-2 font-sans text-sm text-neutral-500">
        Exercises mixed from every lesson you marked as read, so old topics do not fade. The set changes every week.
      </p>
      {list.length === 0 ? (
        <p className="mt-6 font-sans text-neutral-500">
          Read a lesson first (press “Mark as read” at the end). <Link className="underline" to="/catalog">Catalog</Link>
        </p>
      ) : (
        list.map((ex, i) => <ExerciseCard key={ex.id} exercise={ex} index={i} initialSeed={ex.generator ? hashString(week + ex.id) : 0} />)
      )}
    </div>
  );
}

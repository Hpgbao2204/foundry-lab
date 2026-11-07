import { Link, useParams } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../db/db';
import { getExercise } from '../../engine/exercises';
import { getLesson } from '../../engine/content';
import { ExerciseCard } from '../../widgets/ExerciseCard';

/** One exercise on its own — used by the "Exercises to redo" queue. */
export function PracticePage() {
  const { id = '' } = useParams();
  const hit = getExercise(id);
  const attempts = useLiveQuery(() => db.attempts.where('exerciseId').equals(id).count(), [id]);
  if (!hit) return <p>Exercise not found.</p>;
  if (attempts === undefined) return null;
  const lesson = getLesson(hit.lessonId);

  return (
    <div className="max-w-read">
      <p className="label">Redo</p>
      <p className="mt-1 font-sans text-sm text-neutral-500">
        From <Link className="underline" to={`/lesson/${hit.lessonId}`}>{lesson?.title ?? hit.lessonId}</Link>
        {hit.ex.generator && ' — new numbers this time.'}
      </p>
      {/* generator exercises get a different seed on every redo (seed = attempts so far) */}
      <ExerciseCard exercise={hit.ex} initialSeed={hit.ex.generator ? attempts + 1 : 0} />
      <p className="font-sans text-sm">
        <Link to="/" className="underline">← Tonight</Link>
      </p>
    </div>
  );
}

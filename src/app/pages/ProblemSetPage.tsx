import { Link, useParams } from 'react-router-dom';
import { tracks } from '../../engine/content';
import { problemSet } from '../../engine/exercises';
import { ExerciseCard } from '../../widgets/ExerciseCard';

export function ProblemSetPage() {
  const { track = '', chapter = '' } = useParams();
  const t = tracks.find((x) => x.id === track);
  const c = t?.chapters.find((x) => x.id === chapter);
  const list = problemSet(track, chapter);
  if (!t || !c) return <p>Chapter not found.</p>;

  return (
    <div className="max-w-read">
      <p className="label">{t.title} · problem set</p>
      <h1 className="mt-1 font-sans text-3xl font-semibold tracking-tight">{c.title}</h1>
      <p className="mt-2 font-sans text-sm text-neutral-500">
        {list.length} exercises mixing every lesson of the chapter, from A (compute) to C (prove). Generated ones get fresh numbers each time.
      </p>
      {list.map((ex, i) => (
        <ExerciseCard key={ex.id} exercise={ex} index={i} initialSeed={ex.generator ? i + 1 + Math.floor(Date.now() / 86_400_000) : 0} />
      ))}
      <p className="mt-8 font-sans text-sm">
        <Link to="/catalog" className="underline">← Catalog</Link>
      </p>
    </div>
  );
}

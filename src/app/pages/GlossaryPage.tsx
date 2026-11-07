import { useState } from 'react';
import { glossary } from '../../engine/content';

export function GlossaryPage() {
  const [q, setQ] = useState('');
  const needle = q.trim().toLowerCase();
  const items = [...glossary]
    .sort((a, b) => a.en.localeCompare(b.en))
    .filter((g) => !needle || `${g.en} ${g.vi} ${g.explain}`.toLowerCase().includes(needle));

  return (
    <div className="max-w-read">
      <h1 className="mb-4 font-sans text-3xl font-semibold tracking-tight">Glossary</h1>
      <input
        className="mb-6 w-full rounded-md border border-neutral-300 bg-white px-3 py-2 dark:bg-neutral-900 font-sans dark:border-neutral-700"
        placeholder="Search terms (English or Vietnamese)…"
        value={q}
        onChange={(e) => setQ(e.target.value)}
      />
      <dl className="space-y-4 font-serif">
        {items.map((g) => (
          <div key={g.en}>
            <dt>
              <strong>{g.en}</strong> <span className="text-neutral-500">— {g.vi}</span>
            </dt>
            <dd className="text-neutral-700 dark:text-neutral-400">{g.explain}</dd>
          </div>
        ))}
        {items.length === 0 && <p className="text-neutral-500">No results.</p>}
      </dl>
    </div>
  );
}

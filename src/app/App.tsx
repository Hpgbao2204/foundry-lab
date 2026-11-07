import { useEffect } from 'react';
import { NavLink, Route, Routes } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { useSettings } from './settings';
import { db } from '../db/db';
import { HomePage } from './pages/HomePage';
import { CatalogPage } from './pages/CatalogPage';
import { LessonPage } from './pages/LessonPage';
import { ReviewPage } from './pages/ReviewPage';
import { GlossaryPage } from './pages/GlossaryPage';
import { NotesPage } from './pages/NotesPage';
import { SettingsPage } from './pages/SettingsPage';
import { ProblemSetPage } from './pages/ProblemSetPage';
import { MixedReviewPage } from './pages/MixedReviewPage';
import { PracticePage } from './pages/PracticePage';

const nav = [
  ['/', 'Tonight'],
  ['/catalog', 'Catalog'],
  ['/review', 'Flashcards'],
  ['/mixed', 'Mixed review'],
  ['/glossary', 'Glossary'],
  ['/notes', 'Notes'],
  ['/settings', 'Settings'],
] as const;

export function App() {
  const { theme, fontSize, load } = useSettings();
  useEffect(() => {
    void load();
  }, [load]);
  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
    document.documentElement.dataset.size = fontSize;
  }, [theme, fontSize]);

  const dueCount = useLiveQuery(() => db.cards.where('due').belowOrEqual(Date.now()).count(), [], 0);

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-30 border-b border-neutral-200 bg-paper/90 backdrop-blur dark:border-neutral-800">
        <nav className="mx-auto flex max-w-4xl flex-wrap items-center gap-x-5 gap-y-1 px-5 py-3 font-sans text-sm">
          <span className="mr-3 font-semibold tracking-tight">
            forge<span className="text-accent">·</span>lab
          </span>
          {nav.map(([to, label]) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              className={({ isActive }) =>
                isActive
                  ? 'text-neutral-950 underline decoration-accent decoration-2 underline-offset-[6px] dark:text-white'
                  : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-200'
              }
            >
              {label}
              {to === '/review' && dueCount > 0 && <span className="ml-1 text-accent">{dueCount}</span>}
            </NavLink>
          ))}
        </nav>
      </header>
      <main className="mx-auto max-w-4xl px-5 py-10">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/catalog" element={<CatalogPage />} />
          <Route path="/lesson/:id" element={<LessonPage />} />
          <Route path="/review" element={<ReviewPage />} />
          <Route path="/mixed" element={<MixedReviewPage />} />
          <Route path="/problem-set/:track/:chapter" element={<ProblemSetPage />} />
          <Route path="/practice/:id" element={<PracticePage />} />
          <Route path="/glossary" element={<GlossaryPage />} />
          <Route path="/notes" element={<NotesPage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="*" element={<p>Page not found.</p>} />
        </Routes>
      </main>
    </div>
  );
}

import { useRef, useState } from 'react';
import { useSettings, type FontSize } from '../settings';
import { db } from '../../db/db';
import { exportAll, importAll, type Backup } from '../../engine/backup';
import { download } from '../../lib/download';

const SIZES: [FontSize, string][] = [
  ['sm', 'Small'],
  ['md', 'Medium'],
  ['lg', 'Large'],
  ['xl', 'Extra large'],
];

export function SettingsPage() {
  const { fontSize, theme, set } = useSettings();
  const [msg, setMsg] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const onExport = async () => {
    const data = await exportAll(db);
    download(`forge-lab-backup-${new Date().toISOString().slice(0, 10)}.json`, JSON.stringify(data, null, 2));
  };

  const onImport = async (file: File) => {
    try {
      const backup = JSON.parse(await file.text()) as Backup;
      if (!window.confirm('Import will OVERWRITE all progress, flashcards, attempts and notes. Continue?')) return;
      await importAll(db, backup);
      await useSettings.getState().load();
      setMsg('Import done.');
    } catch (e) {
      setMsg(`Error: ${(e as Error).message}`);
    }
  };

  return (
    <div className="max-w-read space-y-8 font-sans">
      <h1 className="text-3xl font-semibold tracking-tight">Settings</h1>

      <Row title="Font size">
        <div className="flex gap-2">
          {SIZES.map(([v, label]) => (
            <button key={v} className={fontSize === v ? 'btn-accent' : 'btn'} onClick={() => void set('fontSize', v)}>
              {label}
            </button>
          ))}
        </div>
      </Row>

      <Row title="Theme">
        <div className="flex gap-2">
          <button className={theme === 'dark' ? 'btn-accent' : 'btn'} onClick={() => void set('theme', 'dark')}>Dark</button>
          <button className={theme === 'light' ? 'btn-accent' : 'btn'} onClick={() => void set('theme', 'light')}>Light</button>
        </div>
      </Row>

      <Row title="Data (stored locally in IndexedDB)">
        <div className="flex flex-wrap gap-2">
          <button className="btn" onClick={() => void onExport()}>Export JSON</button>
          <button className="btn" onClick={() => fileRef.current?.click()}>Import JSON…</button>
          <input
            ref={fileRef}
            type="file"
            accept="application/json"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) void onImport(f);
              e.target.value = '';
            }}
          />
        </div>
        {msg && <p className="mt-2 text-sm text-neutral-500">{msg}</p>}
      </Row>

      <Row title="AI Tutor">
        <p className="text-sm text-neutral-500">Off. Arrives in M9 (optional; the API key stays local).</p>
      </Row>
    </div>
  );
}

function Row({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="mb-2 text-xs uppercase tracking-widest text-neutral-500">{title}</h2>
      {children}
    </section>
  );
}

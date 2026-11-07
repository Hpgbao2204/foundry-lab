import { STORES, type ForgeDB } from '../db/db';
import { reviveCard } from './srs';
import type { Card } from 'ts-fsrs';

export interface Backup {
  app: 'forge-lab';
  version: 1;
  exportedAt: string;
  data: Record<(typeof STORES)[number], unknown[]>;
}

export async function exportAll(db: ForgeDB): Promise<Backup> {
  const data = {} as Backup['data'];
  for (const s of STORES) data[s] = await db.table(s).toArray();
  return { app: 'forge-lab', version: 1, exportedAt: new Date().toISOString(), data };
}

export async function importAll(db: ForgeDB, backup: Backup) {
  if (backup?.app !== 'forge-lab' || backup.version !== 1) throw new Error('Not a forge-lab backup file.');
  await db.transaction('rw', STORES.map((s) => db.table(s)), async () => {
    for (const s of STORES) {
      const rows = backup.data[s] ?? [];
      await db.table(s).clear();
      const fixed =
        s === 'cards'
          ? rows.map((r) => {
              const row = r as { fsrs: Card };
              const fsrs = reviveCard(row.fsrs);
              return { ...row, fsrs, due: fsrs.due.getTime() };
            })
          : rows;
      await db.table(s).bulkPut(fixed);
    }
  });
}

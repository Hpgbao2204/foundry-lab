import Dexie, { type Table } from 'dexie';
import type { Card as FsrsCard } from 'ts-fsrs';

export interface ProgressRow {
  lessonId: string;
  status: 'opened' | 'read';
  openedAt: number;
  readAt?: number;
}

export interface AttemptRow {
  id?: number;
  exerciseId: string;
  correct: boolean;
  hintsUsed: number;
  ts: number;
}

export interface CardRow {
  id: string; // `${lessonId}#${index}`
  lessonId: string;
  front: string;
  back: string;
  fsrs: FsrsCard;
  due: number; // ms epoch, indexed copy of fsrs.due
}

export interface NoteRow {
  lessonId: string;
  text: string;
  updatedAt: number;
}

export interface SettingRow {
  key: string;
  value: unknown;
}

export class ForgeDB extends Dexie {
  progress!: Table<ProgressRow, string>;
  attempts!: Table<AttemptRow, number>;
  cards!: Table<CardRow, string>;
  notes!: Table<NoteRow, string>;
  settings!: Table<SettingRow, string>;

  constructor(name = 'forge-lab') {
    super(name);
    this.version(1).stores({
      progress: 'lessonId, status',
      attempts: '++id, exerciseId, ts',
      cards: 'id, lessonId, due',
      notes: 'lessonId, updatedAt',
      settings: 'key',
    });
  }
}

export const db = new ForgeDB();

export const STORES = ['progress', 'attempts', 'cards', 'notes', 'settings'] as const;

import type { ComponentType } from 'react';
import type { GlossaryEntry, LessonMeta, Track } from '../content-types';
import tracksJson from '../../content/tracks.json';
import graphJson from '../../content/graph.json';
import glossaryJson from '../../content/glossary.json';

type MdxModule = { default: ComponentType<{ components?: Record<string, unknown> }>; frontmatter: LessonMeta };

const metaModules = import.meta.glob<LessonMeta>('/content/**/*.mdx', { eager: true, import: 'frontmatter' });
const lazyModules = import.meta.glob<MdxModule>('/content/**/*.mdx');

export const tracks = tracksJson as Track[];
export const graph = graphJson as Record<string, string[]>;
export const glossary = glossaryJson as GlossaryEntry[];

const byId = new Map<string, { meta: LessonMeta; path: string }>();
for (const [path, meta] of Object.entries(metaModules)) {
  if (!meta?.id) continue;
  byId.set(meta.id, { meta: { ...meta, prerequisites: meta.prerequisites ?? [], flashcards: meta.flashcards ?? [] }, path });
}

export function allLessons(): LessonMeta[] {
  return [...byId.values()].map((x) => x.meta);
}

export function getLesson(id: string): LessonMeta | undefined {
  return byId.get(id)?.meta;
}

export function lessonExists(id: string): boolean {
  return byId.has(id);
}

export async function loadLessonComponent(id: string): Promise<MdxModule['default'] | undefined> {
  const entry = byId.get(id);
  if (!entry) return undefined;
  const loader = lazyModules[entry.path];
  if (!loader) return undefined;
  return (await loader()).default;
}

/** Lesson ids in reading order: track order → chapter order → lesson order. */
export function orderedLessonIds(): string[] {
  return tracks.flatMap((t) => t.chapters.flatMap((c) => c.lessons)).filter((id) => byId.has(id));
}

const glossaryIndex = new Map(glossary.map((g) => [g.en.toLowerCase(), g]));
export function lookupTerm(en: string): GlossaryEntry | undefined {
  return glossaryIndex.get(en.toLowerCase());
}

export function prerequisitesOf(id: string): string[] {
  return graph[id] ?? getLesson(id)?.prerequisites ?? [];
}

/** First lesson (in reading order) not yet read whose existing prerequisites are all read. */
export function nextLesson(readIds: Set<string>): LessonMeta | undefined {
  for (const id of orderedLessonIds()) {
    if (readIds.has(id)) continue;
    const ready = prerequisitesOf(id).every((p) => readIds.has(p) || !byId.has(p));
    if (ready) return getLesson(id);
  }
  return undefined;
}

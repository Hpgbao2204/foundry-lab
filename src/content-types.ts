export interface Flashcard {
  front: string;
  back: string;
}

export interface LessonMeta {
  id: string;
  track: string;
  chapter: string;
  title: string;
  minutes: number;
  prerequisites: string[];
  researchBridge: string;
  flashcards: Flashcard[];
}

export interface Chapter {
  id: string;
  title: string;
  lessons: string[];
}

export interface Track {
  id: string;
  title: string;
  description: string;
  chapters: Chapter[];
}

export interface GlossaryEntry {
  en: string;
  vi: string;
  explain: string;
}

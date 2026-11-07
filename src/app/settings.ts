import { create } from 'zustand';
import { db } from '../db/db';

export type FontSize = 'sm' | 'md' | 'lg' | 'xl';
export type Theme = 'dark' | 'light';

interface SettingsState {
  fontSize: FontSize;
  theme: Theme;
  loaded: boolean;
  load: () => Promise<void>;
  set: <K extends 'fontSize' | 'theme'>(key: K, value: SettingsState[K]) => Promise<void>;
}

export const useSettings = create<SettingsState>((setState) => ({
  fontSize: 'lg',
  theme: 'light',
  loaded: false,
  load: async () => {
    const [fontSize, theme] = await db.settings.bulkGet(['fontSize', 'theme']);
    setState({
      fontSize: (fontSize?.value as FontSize) ?? 'lg',
      theme: (theme?.value as Theme) ?? 'light',
      loaded: true,
    });
  },
  set: async (key, value) => {
    setState({ [key]: value } as Partial<SettingsState>);
    await db.settings.put({ key, value });
  },
}));

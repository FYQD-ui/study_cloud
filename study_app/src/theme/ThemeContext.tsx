import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';

import type { ThemeMode } from '../types/study';
import { palettes } from './colors';

const THEME_KEY = 'study_app:theme_mode';

type ThemeContextValue = {
  mode: ThemeMode;
  colors: typeof palettes.light;
  ready: boolean;
  toggleTheme: () => Promise<void>;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function StudyThemeProvider({ children }: { children: ReactNode }) {
  const [mode, setMode] = useState<ThemeMode>('light');
  const [ready, setReady] = useState(false);

  useEffect(() => {
    async function loadTheme() {
      const savedMode = await AsyncStorage.getItem(THEME_KEY);

      if (savedMode === 'light' || savedMode === 'dark') {
        setMode(savedMode);
      }

      setReady(true);
    }

    loadTheme();
  }, []);

  const toggleTheme = useCallback(async () => {
    const nextMode = mode === 'light' ? 'dark' : 'light';
    setMode(nextMode);
    await AsyncStorage.setItem(THEME_KEY, nextMode);
  }, [mode]);

  const value = useMemo(
    () => ({
      mode,
      colors: palettes[mode],
      ready,
      toggleTheme,
    }),
    [mode, ready, toggleTheme]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useStudyTheme() {
  const value = useContext(ThemeContext);

  if (!value) {
    throw new Error('useStudyTheme must be used inside StudyThemeProvider');
  }

  return value;
}

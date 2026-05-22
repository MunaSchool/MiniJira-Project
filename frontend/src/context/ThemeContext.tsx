import { createContext, useCallback, useContext, useEffect, useLayoutEffect, useMemo, useState, type ReactNode } from 'react';

type ThemeMode = 'light' | 'dark';

interface ThemeContextValue {
  theme: ThemeMode;
  setTheme: (next: ThemeMode) => void;
  toggleTheme: () => void;
  useSystemTheme: boolean;
  setUseSystemTheme: (next: boolean) => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

const THEME_STORAGE_KEY = 'mini_jira_theme';
const THEME_SYSTEM_KEY = 'mini_jira_theme_system';

function applyThemeClass(theme: ThemeMode) {
  const root = document.documentElement;
  root.dataset.theme = theme;
  root.classList.toggle('dark', theme === 'dark');
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<ThemeMode>('light');
  const [useSystemTheme, setUseSystemThemeState] = useState(false);

  useLayoutEffect(() => {
    const stored = localStorage.getItem(THEME_STORAGE_KEY) as ThemeMode | null;
    const system = localStorage.getItem(THEME_SYSTEM_KEY) === 'true';
    const preferred =
      stored ?? (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    const nextTheme = system
      ? window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches
        ? 'dark'
        : 'light'
      : preferred;
    setUseSystemThemeState(system);
    setThemeState(nextTheme);
    applyThemeClass(nextTheme);
  }, []);

  const setTheme = useCallback((next: ThemeMode) => {
    setThemeState(next);
    setUseSystemThemeState(false);
    localStorage.setItem(THEME_STORAGE_KEY, next);
    localStorage.setItem(THEME_SYSTEM_KEY, 'false');
    applyThemeClass(next);
  }, []);

  const toggleTheme = useCallback(() => {
    setThemeState((prev) => {
      const next = prev === 'dark' ? 'light' : 'dark';
      localStorage.setItem(THEME_SYSTEM_KEY, 'false');
      setUseSystemThemeState(false);
      localStorage.setItem(THEME_STORAGE_KEY, next);
      applyThemeClass(next);
      return next;
    });
  }, []);

  useEffect(() => {
    const matcher = window.matchMedia?.('(prefers-color-scheme: dark)');
    if (!matcher) return;
    const handler = (event: MediaQueryListEvent) => {
      const system = localStorage.getItem(THEME_SYSTEM_KEY) === 'true';
      if (!system) return;
      const next = event.matches ? 'dark' : 'light';
      setThemeState(next);
      applyThemeClass(next);
    };
    matcher.addEventListener?.('change', handler);
    return () => matcher.removeEventListener?.('change', handler);
  }, []);

  const setUseSystemTheme = useCallback((next: boolean) => {
    setUseSystemThemeState(next);
    localStorage.setItem(THEME_SYSTEM_KEY, String(next));
    if (!next) return;
    const systemTheme =
      window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    setThemeState(systemTheme);
    applyThemeClass(systemTheme);
  }, []);

  const value = useMemo(
    () => ({
      theme,
      setTheme,
      toggleTheme,
      useSystemTheme,
      setUseSystemTheme
    }),
    [theme, setTheme, toggleTheme, useSystemTheme, setUseSystemTheme]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('useTheme must be used within ThemeProvider');
  return context;
}

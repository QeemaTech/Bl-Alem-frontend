import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

type Theme = 'light' | 'dark' | 'system';

interface ThemeContextValue {
  theme: Theme;
  resolvedTheme: 'light' | 'dark';
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);
const STORAGE_KEY = 'bi-alem-theme';

function getSystemTheme(): 'light' | 'dark' {
  if (typeof window === 'undefined') return 'light';
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>(() => {
    const stored = localStorage.getItem(STORAGE_KEY) as Theme | null;
    return stored || 'light';
  });

  const resolvedTheme = theme === 'system' ? getSystemTheme() : theme;

  const applyTheme = useCallback((next: 'light' | 'dark') => {
    const root = document.documentElement;
    root.classList.add('theme-transition');
    root.classList.toggle('dark', next === 'dark');
    root.style.colorScheme = next;
    window.setTimeout(() => root.classList.remove('theme-transition'), 280);
  }, []);

  useEffect(() => {
    applyTheme(resolvedTheme);
  }, [resolvedTheme, applyTheme]);

  useEffect(() => {
    if (theme !== 'system') return undefined;
    const media = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = () => applyTheme(getSystemTheme());
    media.addEventListener('change', handler);
    return () => media.removeEventListener('change', handler);
  }, [theme, applyTheme]);

  const setTheme = useCallback((next: Theme) => {
    setThemeState(next);
    localStorage.setItem(STORAGE_KEY, next);
  }, []);

  const toggleTheme = useCallback(() => {
    setTheme(resolvedTheme === 'dark' ? 'light' : 'dark');
  }, [resolvedTheme, setTheme]);

  const value = useMemo(
    () => ({ theme, resolvedTheme, setTheme, toggleTheme }),
    [theme, resolvedTheme, setTheme, toggleTheme],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx;
}

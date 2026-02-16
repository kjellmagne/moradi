import { createContext, useContext, useEffect, useState } from 'react';

const STORAGE_KEY = 'moradi.colorScheme';
const THEMES = ['violet', 'ocean', 'sunset'];
const THEME_LABELS = { violet: 'Violet', ocean: 'Ocean', sunset: 'Sunset' };
const THEME_COLORS = {
  violet: ['#7c3aed', '#a78bfa'],
  ocean: ['#2563eb', '#60a5fa'],
  sunset: ['#ea580c', '#fb923c']
};
const DEFAULT_THEME = 'violet';

const ThemeContext = createContext({ theme: DEFAULT_THEME, setTheme: () => {} });

export function ThemeProvider({ children }) {
  const [theme, setThemeState] = useState(() => {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    return THEMES.includes(stored) ? stored : DEFAULT_THEME;
  });

  useEffect(() => {
    const html = document.documentElement;
    if (theme === DEFAULT_THEME) {
      html.removeAttribute('data-theme');
    } else {
      html.setAttribute('data-theme', theme);
    }
    window.localStorage.setItem(STORAGE_KEY, theme);
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme: setThemeState }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}

export { THEMES, THEME_LABELS, THEME_COLORS, DEFAULT_THEME };

import React, { createContext, useContext, useMemo, useState } from 'react';

const ThemeContext = createContext(null);

export const ThemeProvider = ({ children, defaultTheme = 'light' }) => {
  const [theme, setTheme] = useState(() => localStorage.getItem('theme') || defaultTheme);
  const value = useMemo(() => ({
    theme,
    setTheme: (nextTheme) => {
      localStorage.setItem('theme', nextTheme);
      document.documentElement.dataset.theme = nextTheme;
      setTheme(nextTheme);
    },
    toggleTheme: () => setTheme((current) => {
      const next = current === 'dark' ? 'light' : 'dark';
      localStorage.setItem('theme', next);
      document.documentElement.dataset.theme = next;
      return next;
    }),
  }), [theme]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};

export const useThemeContext = () => {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('useThemeContext must be used inside ThemeProvider');
  return context;
};

export { ThemeContext };
export default ThemeProvider;

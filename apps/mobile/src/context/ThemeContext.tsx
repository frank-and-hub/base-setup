import React, { createContext, useContext, useState } from 'react';

export interface ThemeColors {
  bg: string;
  surface: string;
  surfaceHover: string;
  card: string;
  border: string;
  text: string;
  textMuted: string;
  primary: string;
  primaryHover: string;
  success: string;
  warning: string;
  danger: string;
}

const darkColors: ThemeColors = {
  bg: '#090d16',
  surface: '#0f172a',
  surfaceHover: '#1e293b',
  card: '#1e293b',
  border: '#334155',
  text: '#f8fafc',
  textMuted: '#94a3b8',
  primary: '#6366f1',
  primaryHover: '#4f46e5',
  success: '#10b981',
  warning: '#f59e0b',
  danger: '#ef4444',
};

const lightColors: ThemeColors = {
  bg: '#f8fafc',
  surface: '#ffffff',
  surfaceHover: '#f1f5f9',
  card: '#ffffff',
  border: '#e2e8f0',
  text: '#0f172a',
  textMuted: '#64748b',
  primary: '#4f46e5',
  primaryHover: '#4338ca',
  success: '#10b981',
  warning: '#f59e0b',
  danger: '#ef4444',
};

interface ThemeContextType {
  isDark: boolean;
  colors: ThemeColors;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType>({
  isDark: true,
  colors: darkColors,
  toggleTheme: () => {},
});

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isDark, setIsDark] = useState<boolean>(true);

  const toggleTheme = () => setIsDark((prev) => !prev);
  const colors = isDark ? darkColors : lightColors;

  return (
    <ThemeContext.Provider value={{ isDark, colors, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);


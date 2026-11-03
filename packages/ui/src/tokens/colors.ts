/**
 * Design Tokens: Color Palette & Themes
 * Shared across Next.js (web) and React Native (mobile).
 */

export const palette = {
  // Slate (Neutrals)
  slate: {
    50: '#f8fafc',
    100: '#f1f5f9',
    200: '#e2e8f0',
    300: '#cbd5e1',
    400: '#94a3b8',
    500: '#64748b',
    600: '#475569',
    700: '#334155',
    800: '#1e293b',
    900: '#0f172a',
    950: '#020617',
  },
  // Indigo (Primary Brand)
  indigo: {
    50: '#eef2ff',
    100: '#e0e7ff',
    200: '#c7d2fe',
    300: '#a5b4fc',
    400: '#818cf8',
    500: '#6366f1',
    600: '#4f46e5',
    700: '#4338ca',
    800: '#3730a3',
    900: '#312e81',
    950: '#1e1b4b',
  },
  // Emerald (Success)
  emerald: {
    50: '#ecfdf5',
    100: '#d1fae5',
    200: '#a7f3d0',
    300: '#6ee7b7',
    400: '#34d399',
    500: '#10b981',
    600: '#059669',
    700: '#047857',
    800: '#065f46',
    900: '#064e3b',
    950: '#022c22',
  },
  // Amber (Warning)
  amber: {
    50: '#fffbeb',
    100: '#fef3c7',
    200: '#fde68a',
    300: '#fcd34d',
    400: '#fbbf24',
    500: '#f59e0b',
    600: '#d97706',
    700: '#b45309',
    800: '#92400e',
    900: '#78350f',
    950: '#451a03',
  },
  // Rose (Danger / Error)
  rose: {
    50: '#fff1f2',
    100: '#ffe4e6',
    200: '#fecdd3',
    300: '#fda4af',
    400: '#fb7185',
    500: '#f43f5e',
    600: '#e11d48',
    700: '#be123c',
    800: '#9f1239',
    900: '#881337',
    950: '#4c0519',
  },
  // Blue (Info)
  blue: {
    50: '#eff6ff',
    100: '#dbeafe',
    200: '#bfdbfe',
    300: '#93c5fd',
    400: '#60a5fa',
    500: '#3b82f6',
    600: '#2563eb',
    700: '#1d4ed8',
    800: '#1e40af',
    900: '#1e3a8a',
    950: '#172554',
  },
  white: '#ffffff',
  black: '#000000',
  transparent: 'transparent',
} as const;

export interface ThemeColors {
  bg: string;
  surface: string;
  surfaceHover: string;
  card: string;
  border: string;
  borderMuted: string;
  text: string;
  textMuted: string;
  textInverse: string;
  primary: string;
  primaryHover: string;
  primaryText: string;
  success: string;
  warning: string;
  danger: string;
  info: string;
}

export const lightThemeColors: ThemeColors = {
  bg: palette.slate[50],
  surface: palette.white,
  surfaceHover: palette.slate[100],
  card: palette.white,
  border: palette.slate[200],
  borderMuted: palette.slate[100],
  text: palette.slate[900],
  textMuted: palette.slate[500],
  textInverse: palette.white,
  primary: palette.indigo[600],
  primaryHover: palette.indigo[700],
  primaryText: palette.white,
  success: palette.emerald[500],
  warning: palette.amber[500],
  danger: palette.rose[500],
  info: palette.blue[500],
};

export const darkThemeColors: ThemeColors = {
  bg: '#090d16',
  surface: palette.slate[900],
  surfaceHover: palette.slate[800],
  card: palette.slate[800],
  border: palette.slate[700],
  borderMuted: palette.slate[800],
  text: palette.slate[50],
  textMuted: palette.slate[400],
  textInverse: palette.slate[900],
  primary: palette.indigo[500],
  primaryHover: palette.indigo[600],
  primaryText: palette.white,
  success: palette.emerald[500],
  warning: palette.amber[500],
  danger: palette.rose[500],
  info: palette.blue[500],
};


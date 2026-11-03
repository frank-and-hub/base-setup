import { palette, lightThemeColors, darkThemeColors, type ThemeColors } from './colors';
import { spacing } from './spacing';
import { radii } from './radii';
import { fontSizes, fontWeights, lineHeights } from './typography';
import { shadows } from './shadows';

export const tokens = {
  palette,
  lightTheme: lightThemeColors,
  darkTheme: darkThemeColors,
  spacing,
  radii,
  typography: {
    fontSizes,
    fontWeights,
    lineHeights,
  },
  shadows,
} as const;

export type DesignTokens = typeof tokens;
export type { ThemeColors };


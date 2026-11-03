import { palette } from '../tokens/colors';
import { spacing } from '../tokens/spacing';
import { radii } from '../tokens/radii';
import { fontSizes } from '../tokens/typography';

export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'danger' | 'ghost';
export type ButtonSize = 'sm' | 'md' | 'lg';

/**
 * Universal props for Button across Web and Mobile
 */
export interface BaseButtonProps {
  /** Visual variant of the button */
  variant?: ButtonVariant;
  /** Size dimension of the button */
  size?: ButtonSize;
  /** Whether the button is in a loading state */
  isLoading?: boolean;
  /** Backward-compatible alias for isLoading */
  loading?: boolean;
  /** Whether the button is disabled */
  disabled?: boolean;
  /** Optional text title (often used in React Native) */
  title?: string;
  /** Inner content or React children */
  children?: any;
  /** Universal click/press handler */
  onPress?: () => void;
  /** Additional styling or class name (if applicable) */
  className?: string;
}

/**
 * Design tokens specific to Button
 */
export const buttonTokens = {
  sizes: {
    sm: {
      paddingVertical: spacing[2], // 8px
      paddingHorizontal: spacing[3], // 12px
      fontSize: fontSizes.xs, // 12px
      gap: spacing[1.5], // 6px
      borderRadius: radii.md, // 6px
      minHeight: 32,
    },
    md: {
      paddingVertical: spacing[2.5], // 10px
      paddingHorizontal: spacing[4], // 16px
      fontSize: fontSizes.sm, // 14px
      gap: spacing[2], // 8px
      borderRadius: radii.lg, // 8px
      minHeight: 40,
    },
    lg: {
      paddingVertical: spacing[3.5], // 14px
      paddingHorizontal: spacing[6], // 24px
      fontSize: fontSizes.base, // 16px
      gap: spacing[2.5], // 10px
      borderRadius: radii.lg, // 8px
      minHeight: 48,
    },
  },
  variants: {
    light: {
      primary: {
        bg: palette.indigo[600],
        hoverBg: palette.indigo[700],
        text: palette.white,
        border: palette.indigo[600],
      },
      secondary: {
        bg: palette.slate[100],
        hoverBg: palette.slate[200],
        text: palette.slate[800],
        border: palette.slate[200],
      },
      outline: {
        bg: 'transparent',
        hoverBg: palette.slate[50],
        text: palette.indigo[600],
        border: palette.indigo[600],
      },
      danger: {
        bg: palette.rose[600],
        hoverBg: palette.rose[700],
        text: palette.white,
        border: palette.rose[600],
      },
      ghost: {
        bg: 'transparent',
        hoverBg: palette.slate[100],
        text: palette.slate[600],
        border: 'transparent',
      },
    },
    dark: {
      primary: {
        bg: palette.indigo[500],
        hoverBg: palette.indigo[600],
        text: palette.white,
        border: palette.indigo[500],
      },
      secondary: {
        bg: palette.slate[800],
        hoverBg: palette.slate[700],
        text: palette.slate[100],
        border: palette.slate[700],
      },
      outline: {
        bg: 'transparent',
        hoverBg: palette.slate[800],
        text: palette.indigo[400],
        border: palette.indigo[500],
      },
      danger: {
        bg: palette.rose[500],
        hoverBg: palette.rose[600],
        text: palette.white,
        border: palette.rose[500],
      },
      ghost: {
        bg: 'transparent',
        hoverBg: palette.slate[800],
        text: palette.slate[300],
        border: 'transparent',
      },
    },
  },
} as const;


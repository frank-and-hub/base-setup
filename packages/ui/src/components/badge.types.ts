import { palette } from '../tokens/colors';
import { spacing } from '../tokens/spacing';
import { radii } from '../tokens/radii';
import { fontSizes } from '../tokens/typography';

export type BadgeVariant =
  | 'slate'
  | 'emerald'
  | 'amber'
  | 'rose'
  | 'indigo'
  | 'blue'
  | 'default'
  | 'success'
  | 'warning'
  | 'danger';

export type BadgeSize = 'sm' | 'md';

/**
 * Universal props for Badge across Web and Mobile
 */
export interface BaseBadgeProps {
  /** Visual color theme of the badge */
  variant?: BadgeVariant;
  /** Size dimension of the badge */
  size?: BadgeSize;
  /** String label of the badge */
  label?: string;
  /** Content children (alternative to label) */
  children?: any;
  /** Additional styling or class name */
  className?: string;
}

/**
 * Normalize badge variants (e.g., alias 'success' to 'emerald')
 */
export function normalizeBadgeVariant(
  variant: BadgeVariant = 'slate',
): 'slate' | 'emerald' | 'amber' | 'rose' | 'indigo' | 'blue' {
  switch (variant) {
    case 'success':
      return 'emerald';
    case 'warning':
      return 'amber';
    case 'danger':
      return 'rose';
    case 'default':
      return 'slate';
    default:
      return variant;
  }
}

/**
 * Design tokens specific to Badge
 */
export const badgeTokens = {
  sizes: {
    sm: {
      paddingVertical: spacing[0.5], // 2px
      paddingHorizontal: spacing[2], // 8px
      fontSize: fontSizes.xs - 1, // 11px
      borderRadius: radii.full,
    },
    md: {
      paddingVertical: spacing[1], // 4px
      paddingHorizontal: spacing[2.5], // 10px
      fontSize: fontSizes.xs, // 12px
      borderRadius: radii.full,
    },
  },
  variants: {
    light: {
      slate: {
        bg: palette.slate[100],
        text: palette.slate[700],
        border: palette.slate[200],
      },
      emerald: {
        bg: palette.emerald[50],
        text: palette.emerald[700],
        border: palette.emerald[200],
      },
      amber: {
        bg: palette.amber[50],
        text: palette.amber[700],
        border: palette.amber[200],
      },
      rose: {
        bg: palette.rose[50],
        text: palette.rose[700],
        border: palette.rose[200],
      },
      indigo: {
        bg: palette.indigo[50],
        text: palette.indigo[700],
        border: palette.indigo[200],
      },
      blue: {
        bg: palette.blue[50],
        text: palette.blue[700],
        border: palette.blue[200],
      },
    },
    dark: {
      slate: {
        bg: '#1e293b',
        text: '#94a3b8',
        border: '#475569',
      },
      emerald: {
        bg: '#064e3b',
        text: '#34d399',
        border: '#059669',
      },
      amber: {
        bg: '#78350f',
        text: '#fcd34d',
        border: '#d97706',
      },
      rose: {
        bg: '#881337',
        text: '#fda4af',
        border: '#e11d48',
      },
      indigo: {
        bg: '#312e81',
        text: '#a5b4fc',
        border: '#4f46e5',
      },
      blue: {
        bg: '#1e3a8a',
        text: '#93c5fd',
        border: '#2563eb',
      },
    },
  },
} as const;


import { palette } from '../tokens/colors';
import { spacing } from '../tokens/spacing';
import { radii } from '../tokens/radii';
import { fontSizes, fontWeights } from '../tokens/typography';

export type CardVariant = 'default' | 'outlined' | 'elevated' | 'flat';

/**
 * Universal props for Card across Web and Mobile
 */
export interface BaseCardProps {
  /** Optional header title */
  title?: string;
  /** Optional header subtitle/description */
  subtitle?: string;
  /** Visual presentation style */
  variant?: CardVariant;
  /** Content children */
  children?: any;
  /** Additional styling or class name */
  className?: string;
}

export interface CardHeaderProps {
  title?: string;
  subtitle?: string;
  children?: any;
  className?: string;
}

export interface CardTitleProps {
  children?: any;
  className?: string;
}

export interface CardDescriptionProps {
  children?: any;
  className?: string;
}

export interface CardContentProps {
  children?: any;
  className?: string;
}

export interface CardFooterProps {
  children?: any;
  className?: string;
}

/**
 * Design tokens specific to Card
 */
export const cardTokens = {
  borderRadius: radii.xl, // 12px
  padding: {
    sm: spacing[3], // 12px
    md: spacing[4], // 16px
    lg: spacing[6], // 24px
  },
  typography: {
    titleSize: fontSizes.lg, // 18px
    titleWeight: fontWeights.bold,
    subtitleSize: fontSizes.xs, // 12px
    subtitleWeight: fontWeights.normal,
  },
  variants: {
    light: {
      default: {
        bg: palette.white,
        border: palette.slate[200],
        shadow: 'sm',
      },
      outlined: {
        bg: 'transparent',
        border: palette.slate[300],
        shadow: 'none',
      },
      elevated: {
        bg: palette.white,
        border: palette.slate[100],
        shadow: 'md',
      },
      flat: {
        bg: palette.slate[50],
        border: 'transparent',
        shadow: 'none',
      },
    },
    dark: {
      default: {
        bg: palette.slate[800],
        border: palette.slate[700],
        shadow: 'none',
      },
      outlined: {
        bg: 'transparent',
        border: palette.slate[600],
        shadow: 'none',
      },
      elevated: {
        bg: palette.slate[800],
        border: palette.slate[700],
        shadow: 'md',
      },
      flat: {
        bg: palette.slate[900],
        border: 'transparent',
        shadow: 'none',
      },
    },
  },
} as const;


import { palette } from '../tokens/colors';
import { spacing } from '../tokens/spacing';
import { radii } from '../tokens/radii';
import { fontSizes } from '../tokens/typography';

export type InputSize = 'sm' | 'md' | 'lg';
export type InputStatus = 'default' | 'error' | 'success';

/**
 * Universal props for Input across Web and Mobile
 */
export interface BaseInputProps {
  /** Label displayed above the input field */
  label?: string;
  /** Error message to display (triggers error styling) */
  error?: string;
  /** Helper description text displayed below the field */
  helperText?: string;
  /** Placeholder text */
  placeholder?: string;
  /** Disabled state */
  disabled?: boolean;
  /** Input size dimension */
  size?: InputSize;
  /** Field identifier */
  id?: string;
  /** Field name */
  name?: string;
  /** Current value */
  value?: string;
  /** Default value */
  defaultValue?: string;
  /** Text change handler compatible with React Native & Web */
  onChangeText?: (text: string) => void;
  /** Additional styling or class name */
  className?: string;
}

/**
 * Design tokens specific to Input
 */
export const inputTokens = {
  sizes: {
    sm: {
      height: 36,
      paddingHorizontal: spacing[2.5], // 10px
      fontSize: fontSizes.xs, // 12px
      labelSize: fontSizes.xs - 1, // 11px
      borderRadius: radii.md, // 6px
    },
    md: {
      height: 44,
      paddingHorizontal: spacing[3], // 12px
      fontSize: fontSizes.sm, // 14px
      labelSize: fontSizes.xs, // 12px
      borderRadius: radii.lg, // 8px
    },
    lg: {
      height: 52,
      paddingHorizontal: spacing[4], // 16px
      fontSize: fontSizes.base, // 16px
      labelSize: fontSizes.sm, // 14px
      borderRadius: radii.lg, // 8px
    },
  },
  states: {
    light: {
      default: {
        bg: palette.white,
        border: palette.slate[300],
        text: palette.slate[900],
        placeholder: palette.slate[400],
        focusBorder: palette.indigo[500],
        focusRing: palette.indigo[100],
      },
      error: {
        bg: palette.white,
        border: palette.rose[300],
        text: palette.rose[900],
        placeholder: palette.rose[300],
        focusBorder: palette.rose[500],
        focusRing: palette.rose[100],
      },
      disabled: {
        bg: palette.slate[100],
        border: palette.slate[200],
        text: palette.slate[400],
        placeholder: palette.slate[300],
      },
    },
    dark: {
      default: {
        bg: palette.slate[800],
        border: palette.slate[700],
        text: palette.slate[50],
        placeholder: palette.slate[400],
        focusBorder: palette.indigo[500],
        focusRing: palette.indigo[900],
      },
      error: {
        bg: palette.slate[800],
        border: palette.rose[500],
        text: palette.rose[200],
        placeholder: palette.rose[400],
        focusBorder: palette.rose[500],
        focusRing: palette.rose[900],
      },
      disabled: {
        bg: palette.slate[900],
        border: palette.slate[800],
        text: palette.slate[600],
        placeholder: palette.slate[600],
      },
    },
  },
} as const;


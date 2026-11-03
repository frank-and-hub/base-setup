import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { useTheme } from '../context/ThemeContext';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'danger' | 'outline';
  disabled?: boolean;
  loading?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export const Button: React.FC<ButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  disabled = false,
  loading = false,
  size = 'md',
}) => {
  const { colors } = useTheme();

  const getStyle = () => {
    switch (variant) {
      case 'secondary':
        return { bg: colors.surfaceHover, text: colors.text, border: colors.border };
      case 'danger':
        return { bg: colors.danger, text: '#ffffff', border: colors.danger };
      case 'outline':
        return { bg: 'transparent', text: colors.primary, border: colors.primary };
      case 'primary':
      default:
        return { bg: colors.primary, text: '#ffffff', border: colors.primary };
    }
  };

  const st = getStyle();

  const paddingV = size === 'sm' ? 8 : size === 'lg' ? 16 : 12;
  const paddingH = size === 'sm' ? 12 : size === 'lg' ? 24 : 16;
  const fontSize = size === 'sm' ? 13 : size === 'lg' ? 16 : 14;

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={onPress}
      disabled={disabled || loading}
      style={[
        styles.button,
        {
          backgroundColor: disabled ? colors.border : st.bg,
          borderColor: disabled ? colors.border : st.border,
          paddingVertical: paddingV,
          paddingHorizontal: paddingH,
        },
      ]}
    >
      {loading ? (
        <ActivityIndicator color={st.text} size="small" />
      ) : (
        <Text
          style={[
            styles.text,
            {
              color: disabled ? colors.textMuted : st.text,
              fontSize,
            },
          ]}
        >
          {title}
        </Text>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    fontWeight: '600',
  },
});


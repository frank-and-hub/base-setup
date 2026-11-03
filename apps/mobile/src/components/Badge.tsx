import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export interface BadgeProps {
  label: string;
  variant?: 'indigo' | 'emerald' | 'amber' | 'rose' | 'slate' | 'blue';
}

export const Badge: React.FC<BadgeProps> = ({ label, variant = 'indigo' }) => {
  const getColors = () => {
    switch (variant) {
      case 'emerald':
        return { bg: '#064e3b', text: '#34d399', border: '#059669' };
      case 'amber':
        return { bg: '#78350f', text: '#fcd34d', border: '#d97706' };
      case 'rose':
        return { bg: '#881337', text: '#fda4af', border: '#e11d48' };
      case 'blue':
        return { bg: '#1e3a8a', text: '#93c5fd', border: '#2563eb' };
      case 'slate':
        return { bg: '#1e293b', text: '#94a3b8', border: '#475569' };
      case 'indigo':
      default:
        return { bg: '#312e81', text: '#a5b4fc', border: '#4f46e5' };
    }
  };

  const c = getColors();

  return (
    <View style={[styles.badge, { backgroundColor: c.bg, borderColor: c.border }]}>
      <Text style={[styles.text, { color: c.text }]}>{label}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    alignSelf: 'flex-start',
  },
  text: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
});


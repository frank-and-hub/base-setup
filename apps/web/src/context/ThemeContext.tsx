'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { api } from '@/lib/api';
import { Setting } from '@monorepo/shared-types';

export type ResolvedTheme = 'light' | 'dark';
export type ThemePreference = 'light' | 'dark' | 'system';

interface ThemeContextType {
  theme: ResolvedTheme;
  preference: ThemePreference;
  systemDefault: ThemePreference;
  setPreference: (pref: ThemePreference) => void;
  toggleTheme: () => void;
  reloadSystemSettings: () => Promise<void>;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  // Always default to 'light'
  const [theme, setTheme] = useState<ResolvedTheme>('light');
  const [preference, setPreferenceState] = useState<ThemePreference>('light');
  const [systemDefault, setSystemDefault] = useState<ThemePreference>('light');

  // Precedence order resolver
  const resolveEffectiveTheme = useCallback(
    (pref: ThemePreference, defaultTheme: ThemePreference): ResolvedTheme => {
      // 1. Explicit user preference takes top priority
      if (pref === 'light') return 'light';
      if (pref === 'dark') return 'dark';

      // If user selected 'system' preference
      if (pref === 'system') {
        if (typeof window !== 'undefined') {
          return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
        }
        return 'light';
      }

      // 2. Super Admin-configured system default
      if (defaultTheme === 'dark') return 'dark';
      if (defaultTheme === 'light') return 'light';
      if (defaultTheme === 'system' && typeof window !== 'undefined') {
        return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
      }

      // 3. Fallback default to light mode
      return 'light';
    },
    [],
  );

  const applyThemeToDom = useCallback((resolved: ResolvedTheme) => {
    if (typeof document !== 'undefined') {
      const root = document.documentElement;
      if (resolved === 'dark') {
        root.classList.add('dark');
        root.classList.remove('light');
        root.style.colorScheme = 'dark';
      } else {
        root.classList.remove('dark');
        root.classList.add('light');
        root.style.colorScheme = 'light';
      }
    }
  }, []);

  // Fetch public system default setting from API
  const fetchSystemDefault = useCallback(async (): Promise<ThemePreference> => {
    try {
      const publicSettings = await api.get<Setting[]>('/settings/public');
      const themeSetting = publicSettings.find((s) => s.key === 'ui.theme.default');
      if (themeSetting && themeSetting.value) {
        const val = themeSetting.value.toLowerCase() as ThemePreference;
        if (['light', 'dark', 'system'].includes(val)) {
          setSystemDefault(val);
          return val;
        }
      }
    } catch {
      // Fail-safe fallback to 'light'
    }
    return 'light';
  }, []);

  // Initialize theme on mount
  useEffect(() => {
    async function initTheme() {
      const savedPref = localStorage.getItem('user_theme') as ThemePreference | null;
      const initialPref: ThemePreference =
        savedPref && ['light', 'dark', 'system'].includes(savedPref) ? savedPref : 'light';

      setPreferenceState(initialPref);

      const defaultSetting = await fetchSystemDefault();
      const resolved = resolveEffectiveTheme(initialPref, defaultSetting);
      setTheme(resolved);
      applyThemeToDom(resolved);
    }

    initTheme();
  }, [fetchSystemDefault, resolveEffectiveTheme, applyThemeToDom]);

  // Set explicit user preference
  const setPreference = (newPref: ThemePreference) => {
    setPreferenceState(newPref);
    if (typeof window !== 'undefined') {
      localStorage.setItem('user_theme', newPref);
    }

    const resolved = resolveEffectiveTheme(newPref, systemDefault);
    setTheme(resolved);
    applyThemeToDom(resolved);
  };

  // Quick toggle between light and dark
  const toggleTheme = () => {
    const nextTheme: ResolvedTheme = theme === 'dark' ? 'light' : 'dark';
    setPreference(nextTheme);
  };

  const reloadSystemSettings = async () => {
    const updated = await fetchSystemDefault();
    const resolved = resolveEffectiveTheme(preference, updated);
    setTheme(resolved);
    applyThemeToDom(resolved);
  };

  return (
    <ThemeContext.Provider
      value={{
        theme,
        preference,
        systemDefault,
        setPreference,
        toggleTheme,
        reloadSystemSettings,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}


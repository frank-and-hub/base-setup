'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, LoginDto, RegisterDto, AuthResponse } from '@monorepo/shared-types';
import { api } from '@/lib/api';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (dto: LoginDto) => Promise<void>;
  register: (dto: RegisterDto) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadUser() {
      const token = api.getAccessToken();
      if (!token) {
        setIsLoading(false);
        return;
      }

      try {
        const profile = await api.get<User>('/auth/me');
        setUser(profile);
      } catch {
        api.clearTokens();
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    }

    loadUser();
  }, []);

  const login = async (dto: LoginDto) => {
    const res = await api.post<AuthResponse>('/auth/login', dto);
    api.setTokens(res.tokens.accessToken, res.tokens.refreshToken);
    setUser(res.user);
  };

  const register = async (dto: RegisterDto) => {
    const res = await api.post<AuthResponse>('/auth/register', dto);
    api.setTokens(res.tokens.accessToken, res.tokens.refreshToken);
    setUser(res.user);
  };

  const logout = async () => {
    try {
      await api.post('/auth/logout');
    } catch {
      // Continue cleanup even if server logout errored
    } finally {
      api.clearTokens();
      setUser(null);
      window.location.href = '/login';
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        register,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}


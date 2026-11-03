import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, UserRole, LoginDto, RegisterDto } from '@monorepo/shared-types';
import { api } from '../lib/api';

interface AuthContextType {
  user: User | null;
  role: UserRole | null;
  permissions: string[];
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (dto: LoginDto) => Promise<void>;
  register: (dto: RegisterDto) => Promise<void>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  role: null,
  permissions: [],
  isAuthenticated: false,
  isLoading: true,
  login: async () => {},
  register: async () => {},
  logout: async () => {},
  refreshProfile: async () => {},
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const initAuth = async () => {
    try {
      await api.loadTokens();
      if (api.getAccessToken()) {
        const profile = await api.auth.me();
        setUser(profile);
      }
    } catch {
      await api.clearTokens();
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    initAuth();
  }, []);

  const login = async (dto: LoginDto) => {
    setIsLoading(true);
    try {
      const authData = await api.auth.login(dto);
      if (authData.tokens?.accessToken && authData.tokens?.refreshToken) {
        await api.setTokens(authData.tokens.accessToken, authData.tokens.refreshToken);
      }
      setUser(authData.user);
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (dto: RegisterDto) => {
    setIsLoading(true);
    try {
      const authData = await api.auth.register(dto);
      if (authData.tokens?.accessToken && authData.tokens?.refreshToken) {
        await api.setTokens(authData.tokens.accessToken, authData.tokens.refreshToken);
      }
      setUser(authData.user);
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      await api.auth.logout();
    } catch {
      // Ignore network errors on logout
    } finally {
      await api.clearTokens();
      setUser(null);
    }
  };

  const refreshProfile = async () => {
    try {
      const profile = await api.auth.me();
      setUser(profile);
    } catch {
      // Ignore
    }
  };

  const role = user?.role || null;
  const permissions =
    user?.permissions?.map((p: any) => (typeof p === 'string' ? p : p.name || p)) || [];

  return (
    <AuthContext.Provider
      value={{
        user,
        role,
        permissions,
        isAuthenticated: !!user,
        isLoading,
        login,
        register,
        logout,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);

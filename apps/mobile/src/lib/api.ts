import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import {
  ApiResponse,
  ApiErrorResponse,
  LoginDto,
  RegisterDto,
  AuthResponse,
  User,
  Role,
  Permission,
} from '@monorepo/shared-types';
import { normalizeEntity } from '@monorepo/shared-utils';

// Determine default host based on platform
const getDefaultBaseUrl = () => {
  if (Platform.OS === 'android') {
    // Android emulator loops back to host via 10.0.2.2
    return 'http://10.0.2.2:4000/api';
  }
  // iOS simulator or desktop browser uses localhost
  return 'http://localhost:4000/api';
};

class MobileApiClient {
  private baseUrl: string = getDefaultBaseUrl();
  private accessToken: string | null = null;
  private refreshToken: string | null = null;
  private isRefreshing = false;
  private refreshSubscribers: Array<(token: string) => void> = [];

  constructor() {
    this.loadTokens();
  }

  setBaseUrl(url: string) {
    this.baseUrl = url.trim().replace(/\/+$/, '');
  }

  getBaseUrl() {
    return this.baseUrl;
  }

  async loadTokens() {
    try {
      if (Platform.OS !== 'web') {
        const at = await SecureStore.getItemAsync('accessToken');
        const rt = await SecureStore.getItemAsync('refreshToken');
        if (at) this.accessToken = at;
        if (rt) this.refreshToken = rt;
      }
    } catch {
      // SecureStore error fallback
    }
  }

  async setTokens(accessToken: string, refreshToken: string) {
    this.accessToken = accessToken;
    this.refreshToken = refreshToken;
    try {
      if (Platform.OS !== 'web') {
        await SecureStore.setItemAsync('accessToken', accessToken);
        await SecureStore.setItemAsync('refreshToken', refreshToken);
      }
    } catch {
      // SecureStore error fallback
    }
  }

  async clearTokens() {
    this.accessToken = null;
    this.refreshToken = null;
    try {
      if (Platform.OS !== 'web') {
        await SecureStore.deleteItemAsync('accessToken');
        await SecureStore.deleteItemAsync('refreshToken');
      }
    } catch {
      // SecureStore error fallback
    }
  }

  getAccessToken() {
    return this.accessToken;
  }

  private onTokenRefreshed(token: string) {
    this.refreshSubscribers.forEach((cb) => cb(token));
    this.refreshSubscribers = [];
  }

  private addRefreshSubscriber(cb: (token: string) => void) {
    this.refreshSubscribers.push(cb);
  }

  private async refreshAccessToken(): Promise<string | null> {
    if (!this.refreshToken) {
      await this.clearTokens();
      return null;
    }

    try {
      const response = await fetch(`${this.baseUrl}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken: this.refreshToken }),
      });

      if (!response.ok) {
        throw new Error('Refresh failed');
      }

      const resData: ApiResponse<{ accessToken: string; refreshToken: string }> = await response.json();
      const newTokens = resData.data;
      await this.setTokens(newTokens.accessToken, newTokens.refreshToken);
      return newTokens.accessToken;
    } catch {
      await this.clearTokens();
      return null;
    }
  }

  async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = endpoint.startsWith('http') ? endpoint : `${this.baseUrl}${endpoint.startsWith('/') ? '' : '/'}${endpoint}`;
    const headers = new Headers(options.headers || {});

    if (!headers.has('Content-Type') && !(options.body instanceof FormData)) {
      headers.set('Content-Type', 'application/json');
    }

    if (this.accessToken && !headers.has('Authorization')) {
      headers.set('Authorization', `Bearer ${this.accessToken}`);
    }

    let response: Response;
    try {
      response = await fetch(url, {
        ...options,
        headers,
      });
    } catch (err: any) {
      throw new Error(`Network request failed: ${err.message || 'Cannot connect to ' + this.baseUrl}`);
    }

    // Handle 401 Unauthorized -> Token Refresh
    if (response.status === 401 && !endpoint.includes('/auth/login') && !endpoint.includes('/auth/refresh')) {
      if (!this.isRefreshing) {
        this.isRefreshing = true;
        const newToken = await this.refreshAccessToken();
        this.isRefreshing = false;

        if (newToken) {
          this.onTokenRefreshed(newToken);
          headers.set('Authorization', `Bearer ${newToken}`);
          response = await fetch(url, {
            ...options,
            headers,
          });
        }
      } else {
        const retryPromise = new Promise<T>((resolve, reject) => {
          this.addRefreshSubscriber(async (newToken) => {
            headers.set('Authorization', `Bearer ${newToken}`);
            try {
              const res = await fetch(url, { ...options, headers });
              const data = await this.parseResponse<T>(res);
              resolve(data);
            } catch (err) {
              reject(err);
            }
          });
        });
        return retryPromise;
      }
    }

    return this.parseResponse<T>(response);
  }

  private async parseResponse<T>(response: Response): Promise<T> {
    const contentType = response.headers.get('content-type');
    const isJson = contentType && contentType.includes('application/json');

    if (!response.ok) {
      if (isJson) {
        const errorData: ApiErrorResponse = await response.json();
        const errorMsg = Array.isArray(errorData.message)
          ? errorData.message.join(', ')
          : errorData.message || 'Request failed';
        throw new Error(errorMsg);
      }
      throw new Error(`HTTP Error ${response.status}: ${response.statusText}`);
    }

    if (isJson) {
      const data: ApiResponse<T> = await response.json();
      const rawData = data && typeof data === 'object' && 'data' in data ? (data as any).data : data;
      return normalizeEntity(rawData) as T;
    }

    return (await response.text()) as unknown as T;
  }

  get<T>(endpoint: string, options: RequestInit = {}) {
    return this.request<T>(endpoint, { ...options, method: 'GET' });
  }

  post<T>(endpoint: string, body?: unknown, options: RequestInit = {}) {
    return this.request<T>(endpoint, {
      ...options,
      method: 'POST',
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  patch<T>(endpoint: string, body?: unknown, options: RequestInit = {}) {
    return this.request<T>(endpoint, {
      ...options,
      method: 'PATCH',
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  delete<T>(endpoint: string, options: RequestInit = {}) {
    return this.request<T>(endpoint, { ...options, method: 'DELETE' });
  }

  // === Typed Domain Endpoints (Identical to Web) ===

  auth = {
    login: (dto: LoginDto) => this.post<AuthResponse>('/auth/login', dto),
    register: (dto: RegisterDto) => this.post<AuthResponse>('/auth/register', dto),
    me: () => this.get<User>('/auth/me'),
    logout: () => this.post('/auth/logout'),
  };

  users = {
    getDashboardMetrics: () => this.get<any>('/users/dashboard/metrics'),
    getUsers: (params?: { page?: number; limit?: number; search?: string; role?: string; status?: string }) => {
      const qs = new URLSearchParams();
      if (params?.page) qs.append('page', String(params.page));
      if (params?.limit) qs.append('limit', String(params.limit));
      if (params?.search) qs.append('search', params.search);
      if (params?.role) qs.append('role', params.role);
      if (params?.status) qs.append('status', params.status);
      const q = qs.toString();
      return this.get<any>(`/users${q ? '?' + q : ''}`);
    },
    updateUser: (id: string, dto: any) => this.patch<User>(`/users/${id}`, dto),
    deleteUser: (id: string) => this.delete(`/users/${id}`),
  };

  roles = {
    getRoles: () => this.get<Role[]>('/roles'),
    getPermissions: () => this.get<Permission[]>('/roles/permissions'),
  };

  navigation = {
    getMenu: () => this.get<any[]>('/navigation/menu'),
  };

  audit = {
    getAuditLogs: (params?: any) => this.get<any>('/audit-logs'),
    getActivityLogs: (params?: any) => this.get<any>('/activity-logs'),
    getMyActivity: () => this.get<any[]>('/activity-logs/me'),
  };

  health = {
    check: () => this.get<any>('/health'),
  };

  graphify = {
    getStats: () => this.get<any>('/graphify/stats'),
  };
}

export const api = new MobileApiClient();

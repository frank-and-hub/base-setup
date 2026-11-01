import { User, UserRole } from './user';

export interface LoginDto {
  email: string;
  password: string;
}

export interface RegisterDto {
  email: string;
  password: string;
  first_name: string;
  last_name: string;
  phone_number?: string;
}

export interface ChangePasswordDto {
  currentPassword: string;
  newPassword: string;
}

export interface JwtTokens {
  accessToken: string;
  refreshToken: string;
}

export interface AuthResponse {
  user: User;
  tokens: JwtTokens;
}

export interface TokenPayload {
  sub: string; // user_uuid
  email: string;
  role: UserRole;
  permissions?: string[];
  tokenId?: string;
}

export interface RefreshTokenDto {
  refreshToken: string;
}

export interface SocialAuthDto {
  provider: 'google' | 'facebook' | 'apple' | 'instagram';
  token: string;
  state?: string;
  redirectUri?: string;
}

import { User, UserRole } from './user';

export interface LoginDto {
  email: string;
  password: string;
}

export interface RegisterDto {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
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
  sub: string;
  email: string;
  role: UserRole;
  tokenId?: string;
}

export interface RefreshTokenDto {
  refreshToken: string;
}


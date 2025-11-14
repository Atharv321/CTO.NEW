import type { UserRole } from '@shared/types';

export type Role = UserRole;

export interface RegisterInput {
  email: string;
  password: string;
  name: string;
  role?: Role;
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface AuthenticatedUser {
  id: string;
  email: string;
  name: string;
  role: Role;
}

export interface UserResponse extends AuthenticatedUser {
  createdAt: string;
  updatedAt?: string | null;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface AuthResult {
  user: UserResponse;
  tokens: AuthTokens;
}

export interface StoredUser extends AuthenticatedUser {
  passwordHash: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface RefreshTokenPayload {
  sub: string;
  type: 'refresh';
}

export interface AccessTokenPayload {
  sub: string;
  email: string;
  name: string;
  role: Role;
  type: 'access';
}

export interface RefreshTokenRecord {
  token: string;
  userId: string;
  expiresAt: number;
  issuedAt: number;
}

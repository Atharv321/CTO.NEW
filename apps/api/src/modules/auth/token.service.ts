import jwt, { JwtPayload } from 'jsonwebtoken';

import { env } from '../../config/env';
import { HttpError } from '../../errors/http-error';
import type {
  AccessTokenPayload,
  AuthenticatedUser,
  AuthTokens,
  RefreshTokenPayload,
  RefreshTokenRecord,
} from './auth.types';

export class TokenService {
  private refreshTokens = new Map<string, RefreshTokenRecord>();

  generateAuthTokens(user: AuthenticatedUser): AuthTokens {
    this.purgeExpiredRefreshTokens();
    const accessToken = this.createAccessToken(user);
    const refreshToken = this.createRefreshToken(user);

    return { accessToken, refreshToken };
  }

  createAccessToken(user: AuthenticatedUser): string {
    const payload: AccessTokenPayload = {
      sub: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      type: 'access',
    };

    return jwt.sign(payload, env.jwtAccessSecret, {
      expiresIn: env.jwtAccessExpiresIn,
    });
  }

  createRefreshToken(user: AuthenticatedUser): string {
    const payload: RefreshTokenPayload = {
      sub: user.id,
      type: 'refresh',
    };

    const token = jwt.sign(payload, env.jwtRefreshSecret, {
      expiresIn: env.jwtRefreshExpiresIn,
    });

    const decoded = jwt.decode(token) as JwtPayload | null;
    const expiresAt = decoded?.exp ? decoded.exp * 1000 : Date.now();

    const record: RefreshTokenRecord = {
      token,
      userId: user.id,
      issuedAt: Date.now(),
      expiresAt,
    };

    this.refreshTokens.set(token, record);

    return token;
  }

  verifyAccessToken(token: string): AccessTokenPayload {
    try {
      const payload = jwt.verify(token, env.jwtAccessSecret) as JwtPayload;
      if (!payload || typeof payload.sub !== 'string') {
        throw new HttpError(401, 'Invalid access token');
      }

      if (payload.type !== 'access') {
        throw new HttpError(401, 'Invalid access token type');
      }

      return payload as AccessTokenPayload;
    } catch (error) {
      throw new HttpError(401, 'Invalid or expired access token', (error as Error).message);
    }
  }

  verifyRefreshToken(token: string): RefreshTokenRecord {
    const record = this.refreshTokens.get(token);
    if (!record) {
      throw new HttpError(401, 'Refresh token has been revoked');
    }

    try {
      const payload = jwt.verify(token, env.jwtRefreshSecret) as JwtPayload;
      if (!payload || typeof payload.sub !== 'string') {
        throw new HttpError(401, 'Invalid refresh token');
      }

      if (payload.type !== 'refresh') {
        throw new HttpError(401, 'Invalid refresh token type');
      }

      if (payload.sub !== record.userId) {
        this.refreshTokens.delete(token);
        throw new HttpError(401, 'Refresh token subject mismatch');
      }

      return record;
    } catch (error) {
      this.refreshTokens.delete(token);
      throw new HttpError(401, 'Invalid or expired refresh token', (error as Error).message);
    }
  }

  revokeRefreshToken(token: string): void {
    this.refreshTokens.delete(token);
  }

  revokeTokensForUser(userId: string): void {
    for (const [token, record] of this.refreshTokens.entries()) {
      if (record.userId === userId) {
        this.refreshTokens.delete(token);
      }
    }
  }

  private purgeExpiredRefreshTokens(): void {
    const now = Date.now();
    for (const [token, record] of this.refreshTokens.entries()) {
      if (record.expiresAt <= now) {
        this.refreshTokens.delete(token);
      }
    }
  }

  clear(): void {
    this.refreshTokens.clear();
  }
}

export const tokenService = new TokenService();

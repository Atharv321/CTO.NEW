import { describe, expect, beforeEach, it } from 'vitest';

import { HttpError } from '../../errors/http-error';
import { AuthService } from './auth.service';
import type { AuthenticatedUser } from './auth.types';
import { tokenService, TokenService } from './token.service';
import { userRepository, UserRepository } from '../users/user.repository';

describe('AuthService', () => {
  let service: AuthService;
  let users: UserRepository;
  let tokens: TokenService;

  beforeEach(() => {
    users = userRepository;
    tokens = tokenService;
    users.clear();
    tokens.clear();
    service = new AuthService(users, tokens);
  });

  it('registers the first user as an administrator', async () => {
    const result = await service.register({
      email: 'admin@example.com',
      password: 'Str0ngPass!',
      name: 'Initial Admin',
    });

    expect(result.user.role).toBe('admin');
    expect(result.tokens.accessToken).toBeTruthy();
    expect(result.tokens.refreshToken).toBeTruthy();
  });

  it('prevents duplicate registrations for the same email', async () => {
    await service.register({
      email: 'admin@example.com',
      password: 'Str0ngPass!',
      name: 'Initial Admin',
    });

    await expect(
      service.register({
        email: 'admin@example.com',
        password: 'AnotherPass123',
        name: 'Duplicate',
      }),
    ).rejects.toBeInstanceOf(HttpError);
  });

  it('requires an administrator to create additional users', async () => {
    await service.register({
      email: 'admin@example.com',
      password: 'Str0ngPass!',
      name: 'Initial Admin',
    });

    await expect(
      service.register({
        email: 'user@example.com',
        password: 'Password123!',
        name: 'Standard User',
      }),
    ).rejects.toMatchObject({ status: 403 });
  });

  it('allows administrators to create staff accounts', async () => {
    const adminResult = await service.register({
      email: 'admin@example.com',
      password: 'Str0ngPass!',
      name: 'Initial Admin',
    });

    const adminContext: AuthenticatedUser = {
      id: adminResult.user.id,
      email: adminResult.user.email,
      name: adminResult.user.name,
      role: adminResult.user.role,
    };

    const staffResult = await service.register(
      {
        email: 'staff@example.com',
        password: 'Password123!',
        name: 'Staff Member',
        role: 'staff',
      },
      adminContext,
    );

    expect(staffResult.user.role).toBe('staff');
  });

  it('logs in users with valid credentials', async () => {
    await service.register({
      email: 'admin@example.com',
      password: 'Str0ngPass!',
      name: 'Initial Admin',
    });

    const loginResult = await service.login({
      email: 'admin@example.com',
      password: 'Str0ngPass!',
    });

    expect(loginResult.user.email).toBe('admin@example.com');
    expect(loginResult.tokens.accessToken).toBeTruthy();
    expect(loginResult.tokens.refreshToken).toBeTruthy();
  });

  it('refreshes tokens and revokes old refresh token', async () => {
    await service.register({
      email: 'admin@example.com',
      password: 'Str0ngPass!',
      name: 'Initial Admin',
    });

    const loginResult = await service.login({
      email: 'admin@example.com',
      password: 'Str0ngPass!',
    });

    const refreshed = await service.refresh(loginResult.tokens.refreshToken);
    expect(refreshed.tokens.accessToken).toBeTruthy();
    expect(refreshed.tokens.refreshToken).toBeTruthy();

    await expect(service.refresh(loginResult.tokens.refreshToken)).rejects.toBeInstanceOf(HttpError);
  });
});

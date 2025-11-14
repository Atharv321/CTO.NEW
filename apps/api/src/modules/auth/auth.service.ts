import bcrypt from 'bcryptjs';

import { HttpError } from '../../errors/http-error';
import { userRepository, UserRepository } from '../users/user.repository';
import type {
  AuthResult,
  AuthenticatedUser,
  LoginInput,
  RegisterInput,
  Role,
  StoredUser,
  UserResponse,
} from './auth.types';
import { tokenService, TokenService } from './token.service';

const BCRYPT_SALT_ROUNDS = 10;

export class AuthService {
  constructor(
    private readonly users: UserRepository = userRepository,
    private readonly tokens: TokenService = tokenService,
  ) {}

  async register(input: RegisterInput, actor?: AuthenticatedUser | null): Promise<AuthResult> {
    const email = input.email.trim().toLowerCase();
    const existing = await this.users.findByEmail(email);
    if (existing) {
      throw new HttpError(409, 'Email is already registered');
    }

    const role = await this.resolveRoleForRegistration(actor ?? undefined, input.role);
    const passwordHash = await bcrypt.hash(input.password, BCRYPT_SALT_ROUNDS);

    let user: StoredUser;
    try {
      user = await this.users.create({
        email,
        name: input.name.trim(),
        role,
        passwordHash,
      });
    } catch (error) {
      if ((error as Error).message === 'User already exists') {
        throw new HttpError(409, 'Email is already registered');
      }
      throw error;
    }

    const authUser = this.toAuthenticatedUser(user);
    const tokens = this.tokens.generateAuthTokens(authUser);

    return {
      user: this.toUserResponse(user),
      tokens,
    };
  }

  async login(input: LoginInput): Promise<AuthResult> {
    const email = input.email.trim().toLowerCase();
    const user = await this.users.findByEmail(email);

    if (!user) {
      throw new HttpError(401, 'Invalid email or password');
    }

    const passwordIsValid = await bcrypt.compare(input.password, user.passwordHash);
    if (!passwordIsValid) {
      throw new HttpError(401, 'Invalid email or password');
    }

    const authUser = this.toAuthenticatedUser(user);
    const tokens = this.tokens.generateAuthTokens(authUser);

    return {
      user: this.toUserResponse(user),
      tokens,
    };
  }

  async refresh(refreshToken: string | undefined): Promise<AuthResult> {
    if (!refreshToken) {
      throw new HttpError(400, 'Refresh token is required');
    }

    const record = this.tokens.verifyRefreshToken(refreshToken);
    const user = await this.users.findById(record.userId);

    if (!user) {
      this.tokens.revokeRefreshToken(refreshToken);
      throw new HttpError(401, 'User for refresh token no longer exists');
    }

    this.tokens.revokeRefreshToken(refreshToken);

    const authUser = this.toAuthenticatedUser(user);
    const tokens = this.tokens.generateAuthTokens(authUser);

    return {
      user: this.toUserResponse(user),
      tokens,
    };
  }

  async logout(refreshToken: string | undefined): Promise<void> {
    if (!refreshToken) {
      return;
    }

    this.tokens.revokeRefreshToken(refreshToken);
  }

  async getProfile(userId: string): Promise<UserResponse> {
    const user = await this.users.findById(userId);

    if (!user) {
      throw new HttpError(404, 'User not found');
    }

    return this.toUserResponse(user);
  }

  private async resolveRoleForRegistration(actor: AuthenticatedUser | undefined, requestedRole?: Role): Promise<Role> {
    const userCount = await this.users.count();

    if (userCount === 0) {
      return 'admin';
    }

    if (!actor) {
      throw new HttpError(403, 'Administrator authentication required to create users');
    }

    if (actor.role !== 'admin') {
      throw new HttpError(403, 'Only administrators can create new users');
    }

    return requestedRole ?? 'staff';
  }

  private toAuthenticatedUser(user: StoredUser): AuthenticatedUser {
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    };
  }

  private toUserResponse(user: StoredUser): UserResponse {
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      createdAt: user.createdAt.toISOString(),
      updatedAt: user.updatedAt?.toISOString() ?? null,
    };
  }
}

export const authService = new AuthService();

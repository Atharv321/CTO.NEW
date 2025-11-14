import { randomUUID } from 'crypto';

import type { Role, StoredUser } from '../auth/auth.types';

interface CreateUserInput {
  email: string;
  name: string;
  role: Role;
  passwordHash: string;
}

function cloneUser(user: StoredUser): StoredUser {
  return {
    ...user,
    createdAt: new Date(user.createdAt),
    updatedAt: new Date(user.updatedAt),
  };
}

export class UserRepository {
  private usersById = new Map<string, StoredUser>();
  private usersByEmail = new Map<string, StoredUser>();

  async create(input: CreateUserInput): Promise<StoredUser> {
    const id = randomUUID();
    const timestamp = new Date();
    const normalizedEmail = input.email.toLowerCase();

    if (this.usersByEmail.has(normalizedEmail)) {
      throw new Error('User already exists');
    }

    const user: StoredUser = {
      id,
      email: normalizedEmail,
      name: input.name,
      role: input.role,
      passwordHash: input.passwordHash,
      createdAt: timestamp,
      updatedAt: timestamp,
    };

    this.usersById.set(id, user);
    this.usersByEmail.set(user.email, user);

    return cloneUser(user);
  }

  async findByEmail(email: string): Promise<StoredUser | null> {
    const normalized = email.toLowerCase();
    const user = this.usersByEmail.get(normalized);
    return user ? cloneUser(user) : null;
  }

  async findById(id: string): Promise<StoredUser | null> {
    const user = this.usersById.get(id);
    return user ? cloneUser(user) : null;
  }

  async list(): Promise<StoredUser[]> {
    return Array.from(this.usersById.values()).map(user => cloneUser(user));
  }

  async count(): Promise<number> {
    return this.usersById.size;
  }

  async updatePassword(id: string, passwordHash: string): Promise<StoredUser> {
    const existing = this.usersById.get(id);
    if (!existing) {
      throw new Error('User not found');
    }

    const updated: StoredUser = {
      ...existing,
      passwordHash,
      updatedAt: new Date(),
    };

    this.usersById.set(id, updated);
    this.usersByEmail.set(updated.email, updated);

    return cloneUser(updated);
  }

  async delete(id: string): Promise<void> {
    const existing = this.usersById.get(id);
    if (!existing) {
      return;
    }

    this.usersById.delete(id);
    this.usersByEmail.delete(existing.email);
  }

  clear(): void {
    this.usersByEmail.clear();
    this.usersById.clear();
  }
}

export const userRepository = new UserRepository();

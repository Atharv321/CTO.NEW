import { z } from 'zod';

const roleEnum = ['admin', 'manager', 'staff'] as const;

export const registerSchema = z.object({
  email: z.string().email().transform(value => value.trim().toLowerCase()),
  password: z.string().min(8, 'Password must be at least 8 characters').max(128),
  name: z.string().min(1, 'Name is required').max(120),
  role: z.enum(roleEnum).optional(),
});

export const loginSchema = z.object({
  email: z.string().email().transform(value => value.trim().toLowerCase()),
  password: z.string().min(1, 'Password is required'),
});

export type RegisterSchema = z.infer<typeof registerSchema>;
export type LoginSchema = z.infer<typeof loginSchema>;

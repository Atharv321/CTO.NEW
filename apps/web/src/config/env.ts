import { z } from 'zod';

type ImportMetaEnv = Record<string, string | undefined>;

const envSchema = z.object({
  VITE_API_URL: z
    .string()
    .url()
    .or(z.string().length(0))
    .transform(value => value || 'http://localhost:3000'),
  VITE_APP_NAME: z.string().min(1).default('Barber Booking'),
  VITE_APP_VERSION: z.string().min(1).default('0.0.1'),
  VITE_ENV: z
    .enum(['production', 'development', 'test', 'staging'])
    .default('development'),
});

const coerceEnv = (env: ImportMetaEnv) => ({
  VITE_API_URL: env.VITE_API_URL ?? '',
  VITE_APP_NAME: env.VITE_APP_NAME ?? 'Barber Booking',
  VITE_APP_VERSION: env.VITE_APP_VERSION ?? '0.0.1',
  VITE_ENV: env.VITE_ENV ?? 'development',
});

const parsedEnv = envSchema.safeParse(coerceEnv(import.meta.env));

if (!parsedEnv.success) {
  console.error('❌ Invalid environment configuration', parsedEnv.error.flatten().fieldErrors);
  throw new Error('Invalid environment configuration');
}

const hydratedEnv = parsedEnv.data;

export const appConfig = {
  apiUrl: hydratedEnv.VITE_API_URL,
  appName: hydratedEnv.VITE_APP_NAME,
  appVersion: hydratedEnv.VITE_APP_VERSION,
  environment: hydratedEnv.VITE_ENV,
};

type AppConfig = typeof appConfig;

declare global {
  interface ImportMetaEnv {
    readonly VITE_API_URL: string;
    readonly VITE_APP_NAME: string;
    readonly VITE_APP_VERSION: string;
    readonly VITE_ENV: 'production' | 'development' | 'test' | 'staging';
  }

  interface ImportMeta {
    readonly env: ImportMetaEnv;
  }
}

export type { AppConfig };

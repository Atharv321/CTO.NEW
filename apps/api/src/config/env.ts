import 'dotenv/config';

const DEFAULT_ACCESS_SECRET = 'dev-access-secret';
const DEFAULT_REFRESH_SECRET = 'dev-refresh-secret';

function toNumber(value: string | undefined, fallback: number): number {
  if (!value) {
    return fallback;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

export const env = {
  nodeEnv: process.env.NODE_ENV ?? 'development',
  port: toNumber(process.env.API_PORT, 3000),
  jwtAccessSecret: process.env.JWT_ACCESS_SECRET ?? DEFAULT_ACCESS_SECRET,
  jwtRefreshSecret: process.env.JWT_REFRESH_SECRET ?? DEFAULT_REFRESH_SECRET,
  jwtAccessExpiresIn: process.env.JWT_ACCESS_EXPIRES_IN ?? '15m',
  jwtRefreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN ?? '7d',
};

env.port = env.port || 3000;

env.nodeEnv === 'production' &&
  ['JWT_ACCESS_SECRET', 'JWT_REFRESH_SECRET'].forEach(key => {
    if (!process.env[key]) {
      throw new Error(`${key} must be defined in production environment`);
    }
  });

type EnvConfig = typeof env;

export type { EnvConfig };

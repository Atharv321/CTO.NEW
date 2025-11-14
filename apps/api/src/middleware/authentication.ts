import type { NextFunction, Request, Response } from 'express';

import { HttpError } from '../errors/http-error';
import type { Role } from '../modules/auth/auth.types';
import { tokenService } from '../modules/auth/token.service';
import { userRepository } from '../modules/users/user.repository';

async function attachUserFromAuthorizationHeader(
  req: Request,
  _res: Response,
  next: NextFunction,
  { optional }: { optional: boolean },
): Promise<void> {
  const header = req.headers.authorization;

  if (!header) {
    if (optional) {
      next();
      return;
    }

    next(new HttpError(401, 'Authorization header is missing'));
    return;
  }

  const [scheme, token] = header.split(' ');
  if (scheme?.toLowerCase() !== 'bearer' || !token) {
    next(new HttpError(401, 'Authorization header must be a Bearer token'));
    return;
  }

  try {
    const payload = tokenService.verifyAccessToken(token);
    const user = await userRepository.findById(payload.sub);

    if (!user) {
      throw new HttpError(401, 'User associated with token no longer exists');
    }

    req.user = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    };

    next();
  } catch (error) {
    next(error);
  }
}

export function authenticate(req: Request, res: Response, next: NextFunction): void {
  void attachUserFromAuthorizationHeader(req, res, next, { optional: false });
}

export function resolveUser(req: Request, res: Response, next: NextFunction): void {
  void attachUserFromAuthorizationHeader(req, res, next, { optional: true });
}

export function requireRole(roles: Role[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      next(new HttpError(401, 'Authentication required'));
      return;
    }

    if (!roles.includes(req.user.role)) {
      next(new HttpError(403, 'You do not have permission to perform this action'));
      return;
    }

    next();
  };
}

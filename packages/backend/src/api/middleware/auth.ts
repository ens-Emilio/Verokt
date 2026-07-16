import { createMiddleware } from 'hono/factory';
import { verify } from 'hono/jwt';
import { env } from '../../config/env.js';

export interface AuthVariables {
  userId: string;
}

export const authMiddleware = createMiddleware<{ Variables: AuthVariables }>(async (c, next) => {
  const authHeader = c.req.header('Authorization');
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;

  if (token) {
    try {
      const payload = await verify(token, env.JWT_SECRET, 'HS256');
      const userId = typeof payload.sub === 'string' ? payload.sub : 'unknown';
      c.set('userId', userId);
    } catch {
      c.set('userId', 'anonymous');
    }
  } else {
    c.set('userId', 'anonymous');
  }

  await next();
});

import { Hono } from 'hono';
import { sign } from 'hono/jwt';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { env } from '../../config/env.js';

const auth = new Hono();

const guestSchema = z.object({
  userId: z.string().min(3).max(64),
});

auth.post('/guest', zValidator('json', guestSchema), async (c) => {
  const { userId } = c.req.valid('json');

  const token = await sign(
    {
      sub: userId,
      iat: Math.floor(Date.now() / 1000),
    },
    env.JWT_SECRET,
  );

  return c.json({ token, userId });
});

export { auth };

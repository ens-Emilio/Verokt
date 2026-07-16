import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { research } from './routes/research.js';
import { auth } from './routes/auth.js';
import { authMiddleware } from './middleware/auth.js';
import { rateLimit } from './middleware/rate-limit.js';
import { DEFAULT_RATE_LIMIT, DEFAULT_RATE_WINDOW_MS } from '@verokt/shared';

const app = new Hono();

app.use('*', logger());
app.use('*', cors({ origin: '*' }));
app.use('*', rateLimit({ windowMs: DEFAULT_RATE_WINDOW_MS, maxRequests: DEFAULT_RATE_LIMIT }));
app.use('*', authMiddleware);

app.route('/api/auth', auth);
app.route('/api/research', research);

app.get('/health', (c) => c.json({ status: 'ok', timestamp: new Date().toISOString() }));

export default app;

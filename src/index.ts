import './load-env';
import express from 'express';
import type { Request, Response } from 'express'; 
import cors from 'cors';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import authRouter from './routes/auth.routes'
import userRouter from './routes/user.routes'
import waterRoutes from './routes/water.routes'
import achievementRoutes from './routes/achievements.routes'
import itemsRoutes from './routes/items.routes'

export const app = express();
const PORT = parseInt(process.env.PORT || '3000', 10);
const isProd = process.env.NODE_ENV === 'production';

const allowedOrigins = (process.env.CORS_ORIGINS || '')
  .split(',')
  .map((o) => o.trim())
  .filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    // React Native / server-to-server often omit Origin
    if (!origin) return callback(null, true);

    if (allowedOrigins.length === 0) {
      if (isProd) {
        return callback(null, false);
      }
      return callback(null, true);
    }

    if (allowedOrigins.includes(origin) || allowedOrigins.includes('*')) {
      return callback(null, true);
    }
    return callback(null, false);
  },
  credentials: true,
}));

app.use(express.json({ limit: '100kb' }));

if (!isProd) {
  app.use(morgan('dev'));
}

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: isProd ? 100 : 1000,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, please try again later' },
});

app.get('/', (req: Request, res: Response) => {
  res.json({ status: 'HydraFlow API is running 💧' });
});

app.use('/auth', authLimiter, authRouter);
app.use('/user', userRouter);
app.use('/water', waterRoutes);
app.use('/achievements', achievementRoutes);
app.use('/shop', itemsRoutes);

app.use((err: Error, _req: Request, res: Response, _next: (err?: unknown) => void) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

if (require.main === module) {
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Server running on http://0.0.0.0:${PORT}`);
  });
}

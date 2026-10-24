import 'dotenv/config';
import express, { type Request, type Response, type NextFunction } from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import healthHandler from './api/health.ts';
import reportsHandler from './api/reports.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '10mb' }));

  // API routes
  app.all('/api/health', async (req: Request, res: Response, next: NextFunction) => {
    try {
      await healthHandler(req, res);
    } catch (err) {
      next(err);
    }
  });

  app.all('/api/reports', async (req: Request, res: Response, next: NextFunction) => {
    try {
      await reportsHandler(req, res);
    } catch (err) {
      next(err);
    }
  });

  // Database / network fallback error middleware
  app.use((err: any, req: Request, res: Response, next: NextFunction) => {
    if (
      err?.name === 'MongooseError' ||
      err?.name === 'MongoNetworkError' ||
      err?.name === 'MongoServerSelectionError' ||
      err?.message?.includes('buffering timed out')
    ) {
      console.warn('[AI Studio] Database offline — returning mock response');
      if (req.method === 'GET') {
        res.json(req.path.endsWith('s') || req.path.endsWith('s/') ? [] : {});
        return;
      }
      res.status(503).json({ error: 'Service temporarily unavailable (database offline)' });
      return;
    }
    next(err);
  });

  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();

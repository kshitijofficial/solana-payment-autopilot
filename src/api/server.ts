import express from 'express';
import cors from 'cors';
import * as dotenv from 'dotenv';
import { logger } from '../utils/logger';
import routes from './routes';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Request logging
app.use((req, res, next) => {
  logger.debug(`${req.method} ${req.path}`);
  next();
});

// API routes
app.use('/api', routes);

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    name: 'Solana Payment Autopilot API',
    version: '0.1.0',
    status: 'running',
    endpoints: {
      health: '/api/health',
      merchants: '/api/merchants',
      transactions: '/api/transactions/:signature',
      qr: '/api/payments/qr',
    }
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Not found' });
});

// Error handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  logger.error('API error', err);
  res.status(500).json({ error: 'Internal server error' });
});

// Start server
app.listen(PORT, () => {
  logger.info(`API server listening on http://localhost:${PORT}`);
  console.log(`\n✅ API server running on http://localhost:${PORT}`);
  console.log(`   Health check: http://localhost:${PORT}/api/health\n`);
});

export default app;

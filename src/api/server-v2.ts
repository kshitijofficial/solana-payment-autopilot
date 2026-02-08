import express from 'express';
import cors from 'cors';
import * as dotenv from 'dotenv';
import { logger } from '../utils/logger';
import routes from './routes';
import { monitorService } from '../services/MonitorService';

// Load environment variables first
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Request logging
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.path}`);
  next();
});

// Routes
app.use('/api', routes);

// Error handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  logger.error('API error', err);
  res.status(500).json({ 
    success: false, 
    error: err.message || 'Internal server error' 
  });
});

// Start server
app.listen(PORT, async () => {
  logger.info(`🚀 API server running on http://localhost:${PORT}`);
  logger.info(`📋 Endpoints:`);
  logger.info(`   GET  /api/health`);
  logger.info(`   GET  /api/merchants`);
  logger.info(`   POST /api/merchants`);
  logger.info(`   GET  /api/merchants/:merchantId/transactions`);
  logger.info(`   POST /api/payments/qr`);
  
  // Start payment monitor
  try {
    await monitorService.start();
    console.log(`\n✅ Payment monitor started (polling every 15s)\n`);
  } catch (error) {
    logger.error('Failed to start payment monitor', error);
    console.log(`\n⚠️  Payment monitor failed to start (check logs)\n`);
  }
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n\n👋 Shutting down...');
  monitorService.stop();
  process.exit(0);
});

export default app;

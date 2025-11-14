import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';

// Import routes
import analyticsRoutes from './routes/analytics.js';
import authRoutes from './routes/auth.js';
import schedulerRoutes from './routes/scheduler.js';

// Import services
import cacheService from './services/cache.js';
import schedulerService from './services/scheduler.js';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.API_PORT || 3000;

// Security middleware
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: { success: false, error: 'Too many requests, please try again later' }
});
app.use('/api', limiter);

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// API routes
app.use('/api/analytics', analyticsRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/scheduler', schedulerRoutes);

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'Restaurant Inventory Analytics API',
    version: '1.0.0',
    endpoints: {
      health: '/health',
      analytics: '/api/analytics',
      auth: '/api/auth',
      scheduler: '/api/scheduler'
    }
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ success: false, error: 'Endpoint not found' });
});

// Global error handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ success: false, error: 'Internal server error' });
});

// Initialize services and start server
async function startServer() {
  try {
    // Connect to Redis cache
    await cacheService.connect();
    
    // Initialize scheduler
    await schedulerService.initialize();
    
    // Start server
    app.listen(PORT, () => {
      console.log(`Analytics API server running on port ${PORT}`);
      console.log(`Health check: http://localhost:${PORT}/health`);
      console.log(`API docs: http://localhost:${PORT}/`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, shutting down gracefully...');
  await schedulerService.stopAll();
  await cacheService.disconnect();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('SIGINT received, shutting down gracefully...');
  await schedulerService.stopAll();
  await cacheService.disconnect();
  process.exit(0);
});

// Start the server
if (import.meta.url === `file://${process.argv[1]}`) {
  startServer();
}

export default app;

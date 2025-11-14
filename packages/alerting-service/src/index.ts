import express from 'express';
import { AlertWorker } from '@/workers/alert-worker';
import { NotificationService } from '@/services/notification-service';
import { config } from '@/config';
import apiRoutes from '@/api/routes';

const app = express();
const worker = new AlertWorker();
const notificationService = new NotificationService();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// CORS middleware
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
  } else {
    next();
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    service: 'alerting-service'
  });
});

// API routes
app.use('/api/v1', apiRoutes);

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'Barber Booking Alerting Service',
    version: '1.0.0',
    endpoints: {
      health: '/health',
      api: '/api/v1',
      notifications: '/api/v1/notifications',
      alerts: '/api/v1/alerts'
    }
  });
});

// Error handling middleware
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

async function startServer() {
  try {
    // Validate all notification adapters
    console.log('Validating notification adapters...');
    const adaptersValid = await notificationService.validateAllAdapters();
    if (!adaptersValid) {
      console.warn('Some notification adapters failed validation');
    }

    // Start the background worker
    console.log('Starting background worker...');
    await worker.start();

    // Start the server
    app.listen(config.port, () => {
      console.log(`Alerting service started on port ${config.port}`);
      console.log(`Health check: http://localhost:${config.port}/health`);
      console.log(`API documentation: http://localhost:${config.port}/api/v1`);
    });

    // Graceful shutdown
    process.on('SIGTERM', async () => {
      console.log('SIGTERM received, shutting down gracefully...');
      await worker.stop();
      process.exit(0);
    });

    process.on('SIGINT', async () => {
      console.log('SIGINT received, shutting down gracefully...');
      await worker.stop();
      process.exit(0);
    });

  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Start the server
if (require.main === module) {
  startServer();
}

export default app;
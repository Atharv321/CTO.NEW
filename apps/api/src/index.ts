import express from 'express';
import { getNotificationWorker } from '@shared/utils';
import alertsRouter from './routes/alerts';

const app = express();
const PORT = process.env.API_PORT || 3000;

app.use(express.json());

// Routes
app.use('/api/alerts', alertsRouter);

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Start notification worker
const worker = getNotificationWorker();
worker.start();

app.listen(PORT, () => {
  console.log(`API server running on port ${PORT}`);
  console.log(`Notification worker started`);
});

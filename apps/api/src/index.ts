import express from 'express';
import dotenv from 'dotenv';
import { connect, disconnect } from './db';
import { initializeSchema } from './schema';
import categoryRoutes from './routes/categories';
import locationRoutes from './routes/locations';
import supplierRoutes from './routes/suppliers';
import itemRoutes from './routes/items';
import stockRoutes from './routes/stock';

dotenv.config();

const app = express();
const PORT = process.env.API_PORT || 3000;

app.use(express.json());

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// API routes
app.use('/api/categories', categoryRoutes);
app.use('/api/locations', locationRoutes);
app.use('/api/suppliers', supplierRoutes);
app.use('/api/items', itemRoutes);
app.use('/api/stock', stockRoutes);

// Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

const start = async () => {
  try {
    await connect();
    await initializeSchema();
    app.listen(PORT, () => {
      console.log(`API server running on port ${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

if (require.main === module) {
  start();
}

export default app;
export { disconnect };

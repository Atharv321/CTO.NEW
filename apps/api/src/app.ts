import express from 'express';
import swaggerUi from 'swagger-ui-express';

import { openApiDocument } from './docs/openapi';
import { errorHandler } from './middleware/error-handler';
import { registerRoutes } from './routes';

const app = express();

app.use(express.json());

app.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

app.use('/docs', swaggerUi.serve, swaggerUi.setup(openApiDocument));

registerRoutes(app);

app.use(errorHandler);

export { app };
export default app;

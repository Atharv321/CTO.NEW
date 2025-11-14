import app from './app';
import { env } from './config/env';

app.listen(env.port, () => {
  if (env.nodeEnv !== 'test') {
    // eslint-disable-next-line no-console
    console.log(`API server running on port ${env.port}`);
  }
});

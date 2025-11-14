import { Suspense } from 'react';
import { RouterProvider } from 'react-router-dom';
import { AppProvider } from './app/providers/AppProvider';
import { router } from './app/router';
import { LoadingSpinner } from '@components/common/LoadingSpinner';
import '@mantine/core/styles.css';
import '@mantine/notifications/styles.css';

function App() {
  return (
    <AppProvider>
      <Suspense fallback={<LoadingSpinner fullPage />}>
        <RouterProvider router={router} />
      </Suspense>
    </AppProvider>
  );
}

export default App;

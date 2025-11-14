import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClientProvider, QueryClient } from '@tanstack/react-query';
import { MantineProvider } from '@mantine/core';
import { theme } from '@/theme/theme';
import { BaseLayout } from '@/components/layouts/BaseLayout';
import { Dashboard } from '@/pages/Dashboard';
import { NotFound } from '@/pages/NotFound';
import { InventoryItemList } from '@/pages/InventoryItemList';
import { InventoryItemDetail } from '@/pages/InventoryItemDetail';
import '@mantine/core/styles.css';

/**
 * Create a client for React Query
 */
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      gcTime: 1000 * 60 * 10, // 10 minutes (formerly cacheTime)
    },
  },
});

function App(): JSX.Element {
  return (
    <QueryClientProvider client={queryClient}>
      <MantineProvider theme={theme}>
        <BrowserRouter>
          <BaseLayout>
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/bookings" element={<Dashboard />} />
              <Route path="/barbers" element={<Dashboard />} />
              <Route path="/customers" element={<Dashboard />} />
              <Route path="/settings" element={<Dashboard />} />
              <Route path="/inventory" element={<Navigate to="/inventory/items" replace />} />
              <Route path="/inventory/items" element={<InventoryItemList />} />
              <Route path="/inventory/items/:id" element={<InventoryItemDetail />} />
              <Route path="/404" element={<NotFound />} />
              <Route path="*" element={<Navigate to="/404" replace />} />
            </Routes>
          </BaseLayout>
        </BrowserRouter>
      </MantineProvider>
    </QueryClientProvider>
  );
}

export default App;

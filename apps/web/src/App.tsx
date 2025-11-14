import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClientProvider, QueryClient } from '@tanstack/react-query';
import { MantineProvider } from '@mantine/core';
import { theme } from '@/theme/theme';
import { BaseLayout } from '@/components/layouts/BaseLayout';
import { Dashboard } from '@/pages/Dashboard';
import { NotFound } from '@/pages/NotFound';
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
              <Route path="/404" element={<NotFound />} />
              <Route path="*" element={<Navigate to="/404" replace />} />
            </Routes>
          </BaseLayout>
        </BrowserRouter>
      </MantineProvider>
    </QueryClientProvider>
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from './components/Layout';
import { SupplierDirectory } from './components/suppliers/SupplierDirectory';
import { SupplierDetail } from './components/suppliers/SupplierDetail';
import { PurchaseOrderList } from './components/purchase-orders/PurchaseOrderList';
import { PurchaseOrderDetail } from './components/purchase-orders/PurchaseOrderDetail';
import { CreatePurchaseOrder } from './components/purchase-orders/CreatePurchaseOrder';
import { Notifications } from './components/notifications/Notifications';
import { Dashboard } from './components/Dashboard';

import { Routes, Route } from 'react-router-dom';
import { Layout } from '@components/Layout/Layout';
import { HomePage } from '@pages/HomePage';
import { NotFoundPage } from '@pages/NotFoundPage';

function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </Layout>
function App() {
  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/suppliers" element={<SupplierDirectory />} />
          <Route path="/suppliers/:id" element={<SupplierDetail />} />
          <Route path="/purchase-orders" element={<PurchaseOrderList />} />
          <Route path="/purchase-orders/new" element={<CreatePurchaseOrder />} />
          <Route path="/purchase-orders/:id" element={<PurchaseOrderDetail />} />
          <Route path="/notifications" element={<Notifications />} />
        </Routes>
      </Layout>
    </Router>
  );
}

export default App;

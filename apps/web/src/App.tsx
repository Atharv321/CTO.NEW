import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from './components/Layout';
import { SupplierDirectory } from './components/suppliers/SupplierDirectory';
import { SupplierDetail } from './components/suppliers/SupplierDetail';
import { PurchaseOrderList } from './components/purchase-orders/PurchaseOrderList';
import { PurchaseOrderDetail } from './components/purchase-orders/PurchaseOrderDetail';
import { CreatePurchaseOrder } from './components/purchase-orders/CreatePurchaseOrder';
import { Notifications } from './components/notifications/Notifications';
import { Dashboard } from './components/Dashboard';

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

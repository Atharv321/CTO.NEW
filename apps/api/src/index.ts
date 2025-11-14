import express from 'express';
// Types would be imported from shared package in production
// For now, defining basic types inline
interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  createdAt: Date;
}

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

enum UserRole {
  ADMIN = 'admin',
  MANAGER = 'manager',
  STAFF = 'staff'
}

enum PurchaseOrderStatus {
  DRAFT = 'draft',
  SUBMITTED = 'submitted',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  PARTIALLY_RECEIVED = 'partially_received',
  RECEIVED = 'received',
  CANCELLED = 'cancelled'
}

enum NotificationType {
  SUPPLIER_UPDATE = 'supplier_update',
  ORDER_STATUS_CHANGE = 'order_status_change',
  LOW_STOCK = 'low_stock',
  DELIVERY_DELAY = 'delivery_delay'
}

const app = express();
const PORT = process.env.API_PORT || 3000;

app.use(express.json());

// Mock data
const mockSuppliers: Supplier[] = [
  {
    id: '1',
    name: 'ABC Food Supplies',
    contactEmail: 'contact@abcfoods.com',
    contactPhone: '+1-555-0123',
    address: '123 Supply St',
    city: 'New York',
    state: 'NY',
    country: 'USA',
    isActive: true,
    leadTimeDays: 3,
    minimumOrder: 500,
    rating: 4.5,
    createdAt: new Date('2023-01-15'),
    updatedAt: new Date('2023-10-20')
  },
  {
    id: '2',
    name: 'Fresh Produce Co',
    contactEmail: 'orders@freshproduce.com',
    contactPhone: '+1-555-0456',
    address: '456 Farm Road',
    city: 'Los Angeles',
    state: 'CA',
    country: 'USA',
    isActive: true,
    leadTimeDays: 2,
    minimumOrder: 300,
    rating: 4.8,
    createdAt: new Date('2023-02-20'),
    updatedAt: new Date('2023-10-15')
  }
];

const mockPurchaseOrders: PurchaseOrder[] = [
  {
    id: '1',
    orderNumber: 'PO-2023-001',
    supplierId: '1',
    locationId: '1',
    status: PurchaseOrderStatus.DRAFT,
    items: [
      {
        id: '1',
        productId: 'prod-1',
        productName: 'Tomatoes',
        sku: 'TOM-001',
        quantity: 50,
        unitPrice: 2.50,
        totalPrice: 125.00,
        receivedQuantity: 0
      }
    ],
    totalAmount: 125.00,
    expectedDeliveryDate: new Date('2023-11-15'),
    notes: 'Urgent order for kitchen supplies',
    createdBy: 'user-1',
    createdAt: new Date('2023-11-01'),
    updatedAt: new Date('2023-11-01')
  }
];

const mockNotifications: Notification[] = [
  {
    id: '1',
    userId: 'user-1',
    type: NotificationType.ORDER_STATUS_CHANGE,
    title: 'Purchase Order Approved',
    message: 'Your purchase order PO-2023-001 has been approved by Manager.',
    isRead: false,
    data: { orderId: '1', orderNumber: 'PO-2023-001' },
    createdAt: new Date('2023-11-14T10:30:00')
  }
];

const mockLocations: Location[] = [
  {
    id: '1',
    name: 'Main Restaurant',
    address: '123 Main St',
    city: 'New York',
    state: 'NY',
    country: 'USA',
    isActive: true
  }
];

// Middleware for basic auth simulation
const simulateAuth = (req: any, res: any, next: any) => {
  req.user = {
    id: 'user-1',
    email: 'user@example.com',
    name: 'Test User',
    role: UserRole.MANAGER,
    createdAt: new Date()
  };
  next();
};

app.use(simulateAuth);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Supplier endpoints
app.get('/api/suppliers', (req, res) => {
  const { search, location, status, rating } = req.query;
  
  let filteredSuppliers = mockSuppliers;
  
  if (search) {
    filteredSuppliers = filteredSuppliers.filter(supplier =>
      supplier.name.toLowerCase().includes((search as string).toLowerCase()) ||
      supplier.contactEmail.toLowerCase().includes((search as string).toLowerCase())
    );
  }
  
  if (location) {
    filteredSuppliers = filteredSuppliers.filter(supplier => supplier.city === location);
  }
  
  if (status) {
    const isActive = status === 'active';
    filteredSuppliers = filteredSuppliers.filter(supplier => supplier.isActive === isActive);
  }
  
  if (rating) {
    filteredSuppliers = filteredSuppliers.filter(supplier => supplier.rating >= Number(rating));
  }
  
  res.json({ success: true, data: filteredSuppliers });
});

app.get('/api/suppliers/:id', (req, res) => {
  const supplier = mockSuppliers.find(s => s.id === req.params.id);
  if (!supplier) {
    return res.status(404).json({ success: false, error: 'Supplier not found' });
  }
  res.json({ success: true, data: supplier });
});

app.post('/api/suppliers', (req, res) => {
  const newSupplier: Supplier = {
    id: Date.now().toString(),
    ...req.body,
    createdAt: new Date(),
    updatedAt: new Date()
  };
  mockSuppliers.push(newSupplier);
  res.json({ success: true, data: newSupplier });
});

app.patch('/api/suppliers/:id', (req, res) => {
  const index = mockSuppliers.findIndex(s => s.id === req.params.id);
  if (index === -1) {
    return res.status(404).json({ success: false, error: 'Supplier not found' });
  }
  
  mockSuppliers[index] = {
    ...mockSuppliers[index],
    ...req.body,
    updatedAt: new Date()
  };
  
  res.json({ success: true, data: mockSuppliers[index] });
});

// Purchase Order endpoints
app.get('/api/purchase-orders', (req, res) => {
  const { search, status, supplierId, locationId } = req.query;
  
  let filteredOrders = mockPurchaseOrders;
  
  if (search) {
    filteredOrders = filteredOrders.filter(order =>
      order.orderNumber.toLowerCase().includes((search as string).toLowerCase())
    );
  }
  
  if (status) {
    filteredOrders = filteredOrders.filter(order => order.status === status);
  }
  
  if (supplierId) {
    filteredOrders = filteredOrders.filter(order => order.supplierId === supplierId);
  }
  
  if (locationId) {
    filteredOrders = filteredOrders.filter(order => order.locationId === locationId);
  }
  
  res.json({ success: true, data: filteredOrders });
});

app.get('/api/purchase-orders/:id', (req, res) => {
  const order = mockPurchaseOrders.find(o => o.id === req.params.id);
  if (!order) {
    return res.status(404).json({ success: false, error: 'Purchase order not found' });
  }
  res.json({ success: true, data: order });
});

app.post('/api/purchase-orders', (req, res) => {
  const newOrder: PurchaseOrder = {
    id: Date.now().toString(),
    orderNumber: `PO-${new Date().getFullYear()}-${String(mockPurchaseOrders.length + 1).padStart(3, '0')}`,
    ...req.body,
    status: PurchaseOrderStatus.DRAFT,
    createdBy: req.user.id,
    createdAt: new Date(),
    updatedAt: new Date()
  };
  mockPurchaseOrders.push(newOrder);
  res.json({ success: true, data: newOrder });
});

app.patch('/api/purchase-orders/:id', (req, res) => {
  const index = mockPurchaseOrders.findIndex(o => o.id === req.params.id);
  if (index === -1) {
    return res.status(404).json({ success: false, error: 'Purchase order not found' });
  }
  
  mockPurchaseOrders[index] = {
    ...mockPurchaseOrders[index],
    ...req.body,
    updatedAt: new Date()
  };
  
  res.json({ success: true, data: mockPurchaseOrders[index] });
});

app.patch('/api/purchase-orders/:id/status', (req, res) => {
  const { status } = req.body;
  const index = mockPurchaseOrders.findIndex(o => o.id === req.params.id);
  if (index === -1) {
    return res.status(404).json({ success: false, error: 'Purchase order not found' });
  }
  
  mockPurchaseOrders[index] = {
    ...mockPurchaseOrders[index],
    status,
    approvedBy: status === PurchaseOrderStatus.APPROVED ? req.user.id : mockPurchaseOrders[index].approvedBy,
    actualDeliveryDate: status === PurchaseOrderStatus.RECEIVED ? new Date() : mockPurchaseOrders[index].actualDeliveryDate,
    updatedAt: new Date()
  };
  
  res.json({ success: true, data: mockPurchaseOrders[index] });
});

// Notification endpoints
app.get('/api/notifications', (req, res) => {
  const userId = req.user.id;
  const userNotifications = mockNotifications.filter(n => n.userId === userId);
  res.json({ success: true, data: userNotifications });
});

app.patch('/api/notifications/:id/read', (req, res) => {
  const notification = mockNotifications.find(n => n.id === req.params.id);
  if (!notification) {
    return res.status(404).json({ success: false, error: 'Notification not found' });
  }
  
  notification.isRead = true;
  res.json({ success: true, data: notification });
});

app.patch('/api/notifications/read-all', (req, res) => {
  const userId = req.user.id;
  mockNotifications.forEach(n => {
    if (n.userId === userId) {
      n.isRead = true;
    }
  });
  res.json({ success: true, data: { message: 'All notifications marked as read' } });
});

app.delete('/api/notifications/:id', (req, res) => {
  const index = mockNotifications.findIndex(n => n.id === req.params.id);
  if (index === -1) {
    return res.status(404).json({ success: false, error: 'Notification not found' });
  }
  
  mockNotifications.splice(index, 1);
  res.json({ success: true, data: { message: 'Notification deleted' } });
});

// Location endpoints
app.get('/api/locations', (req, res) => {
  res.json({ success: true, data: mockLocations });
});

// Export endpoints
app.post('/api/export/suppliers', (req, res) => {
  const { format, filters } = req.body;
  // In a real implementation, this would generate and return a file
  res.json({ 
    success: true, 
    data: { 
      message: `Exporting suppliers as ${format}`,
      downloadUrl: `/api/downloads/suppliers.${format}`,
      filters
    } 
  });
});

app.post('/api/export/purchase-orders', (req, res) => {
  const { format, filters } = req.body;
  // In a real implementation, this would generate and return a file
  res.json({ 
    success: true, 
    data: { 
      message: `Exporting purchase orders as ${format}`,
      downloadUrl: `/api/downloads/purchase-orders.${format}`,
      filters
    } 
  });
});

app.listen(PORT, () => {
  console.log(`API server running on port ${PORT}`);
});

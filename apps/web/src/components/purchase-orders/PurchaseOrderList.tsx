import { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  Search, 
  Filter, 
  Plus, 
  Download,
  Calendar,
  DollarSign,
  User,
  MoreHorizontal
} from 'lucide-react';
import { PurchaseOrder, PurchaseOrderStatus, PurchaseOrderFilters } from '../../types';

// Mock data
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
  },
  {
    id: '2',
    orderNumber: 'PO-2023-002',
    supplierId: '2',
    locationId: '2',
    status: PurchaseOrderStatus.SUBMITTED,
    items: [
      {
        id: '1',
        productId: 'prod-2',
        productName: 'Lettuce',
        sku: 'LET-001',
        quantity: 30,
        unitPrice: 1.75,
        totalPrice: 52.50,
        receivedQuantity: 0
      }
    ],
    totalAmount: 52.50,
    expectedDeliveryDate: new Date('2023-11-12'),
    createdBy: 'user-2',
    createdAt: new Date('2023-10-28'),
    updatedAt: new Date('2023-10-29')
  },
  {
    id: '3',
    orderNumber: 'PO-2023-003',
    supplierId: '1',
    locationId: '1',
    status: PurchaseOrderStatus.APPROVED,
    items: [
      {
        id: '1',
        productId: 'prod-3',
        productName: 'Chicken Breast',
        sku: 'CHK-001',
        quantity: 100,
        unitPrice: 5.50,
        totalPrice: 550.00,
        receivedQuantity: 0
      }
    ],
    totalAmount: 550.00,
    expectedDeliveryDate: new Date('2023-11-10'),
    approvedBy: 'manager-1',
    createdBy: 'user-1',
    createdAt: new Date('2023-10-25'),
    updatedAt: new Date('2023-10-26')
  },
  {
    id: '4',
    orderNumber: 'PO-2023-004',
    supplierId: '3',
    locationId: '3',
    status: PurchaseOrderStatus.RECEIVED,
    items: [
      {
        id: '1',
        productId: 'prod-4',
        productName: 'Rice',
        sku: 'RIC-001',
        quantity: 200,
        unitPrice: 1.25,
        totalPrice: 250.00,
        receivedQuantity: 200
      }
    ],
    totalAmount: 250.00,
    expectedDeliveryDate: new Date('2023-11-05'),
    actualDeliveryDate: new Date('2023-11-04'),
    approvedBy: 'manager-2',
    createdBy: 'user-3',
    createdAt: new Date('2023-10-20'),
    updatedAt: new Date('2023-11-04')
  }
];

const mockSuppliers = [
  { id: '1', name: 'ABC Food Supplies' },
  { id: '2', name: 'Fresh Produce Co' },
  { id: '3', name: 'Global Ingredients Ltd' }
];

const mockLocations = [
  { id: '1', name: 'Main Restaurant' },
  { id: '2', name: 'Downtown Branch' },
  { id: '3', name: 'Airport Location' }
];

export function PurchaseOrderList() {
  const [purchaseOrders] = useState<PurchaseOrder[]>(mockPurchaseOrders);
  const [filters, setFilters] = useState<PurchaseOrderFilters>({});
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  const filteredOrders = purchaseOrders.filter(order => {
    const matchesSearch = !searchTerm || 
      order.orderNumber.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = !filters.status || order.status === filters.status;
    const matchesSupplier = !filters.supplierId || order.supplierId === filters.supplierId;
    const matchesLocation = !filters.locationId || order.locationId === filters.locationId;

    return matchesSearch && matchesStatus && matchesSupplier && matchesLocation;
  });

  const handleExport = (format: 'csv' | 'pdf') => {
    console.log(`Exporting purchase orders as ${format}`, { filters, searchTerm });
    // Implementation would call API endpoint
  };

  const getStatusColor = (status: PurchaseOrderStatus) => {
    switch (status) {
      case PurchaseOrderStatus.DRAFT:
        return 'status-draft';
      case PurchaseOrderStatus.SUBMITTED:
        return 'status-submitted';
      case PurchaseOrderStatus.APPROVED:
        return 'status-approved';
      case PurchaseOrderStatus.REJECTED:
        return 'status-rejected';
      case PurchaseOrderStatus.PARTIALLY_RECEIVED:
        return 'status-partially_received';
      case PurchaseOrderStatus.RECEIVED:
        return 'status-received';
      case PurchaseOrderStatus.CANCELLED:
        return 'status-cancelled';
      default:
        return 'status-draft';
    }
  };

  const getStatusLabel = (status: PurchaseOrderStatus) => {
    return status.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Purchase Orders</h1>
          <p className="text-gray-600">Manage your purchase orders and track deliveries</p>
        </div>
        <div className="flex gap-3">
          <div className="relative">
            <button
              className="btn btn-secondary"
              onClick={() => setShowFilters(!showFilters)}
            >
              <Filter className="h-4 w-4" />
              Filters
            </button>
          </div>
          <div className="relative group">
            <button className="btn btn-secondary">
              <Download className="h-4 w-4" />
              Export
            </button>
            <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-10">
              <button
                onClick={() => handleExport('csv')}
                className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
              >
                Export as CSV
              </button>
              <button
                onClick={() => handleExport('pdf')}
                className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
              >
                Export as PDF
              </button>
            </div>
          </div>
          <Link to="/purchase-orders/new" className="btn btn-primary">
            <Plus className="h-4 w-4" />
            Create Order
          </Link>
        </div>
      </div>

      {/* Filters */}
      {showFilters && (
        <div className="card bg-gray-50">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="form-label">Status</label>
              <select
                className="input"
                value={filters.status || ''}
                onChange={(e) => setFilters({ ...filters, status: e.target.value as PurchaseOrderStatus | undefined })}
              >
                <option value="">All Status</option>
                <option value={PurchaseOrderStatus.DRAFT}>Draft</option>
                <option value={PurchaseOrderStatus.SUBMITTED}>Submitted</option>
                <option value={PurchaseOrderStatus.APPROVED}>Approved</option>
                <option value={PurchaseOrderStatus.RECEIVED}>Received</option>
                <option value={PurchaseOrderStatus.CANCELLED}>Cancelled</option>
              </select>
            </div>
            <div>
              <label className="form-label">Supplier</label>
              <select
                className="input"
                value={filters.supplierId || ''}
                onChange={(e) => setFilters({ ...filters, supplierId: e.target.value })}
              >
                <option value="">All Suppliers</option>
                {mockSuppliers.map(supplier => (
                  <option key={supplier.id} value={supplier.id}>
                    {supplier.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="form-label">Location</label>
              <select
                className="input"
                value={filters.locationId || ''}
                onChange={(e) => setFilters({ ...filters, locationId: e.target.value })}
              >
                <option value="">All Locations</option>
                {mockLocations.map(location => (
                  <option key={location.id} value={location.id}>
                    {location.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-end">
              <button
                className="btn btn-secondary w-full"
                onClick={() => setFilters({})}
              >
                Clear Filters
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
        <input
          type="text"
          placeholder="Search purchase orders by number..."
          className="input pl-10"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* Purchase Orders List */}
      <div className="card">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead>
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Order Number
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Supplier
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Location
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total Amount
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Expected Delivery
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Created By
                </th>
                <th className="relative px-6 py-3">
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredOrders.map((order) => (
                <tr key={order.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <Link
                      to={`/purchase-orders/${order.id}`}
                      className="text-sm font-medium text-blue-600 hover:text-blue-900"
                    >
                      {order.orderNumber}
                    </Link>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {mockSuppliers.find(s => s.id === order.supplierId)?.name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {mockLocations.find(l => l.id === order.locationId)?.name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`status-badge ${getStatusColor(order.status)}`}>
                      {getStatusLabel(order.status)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    ${order.totalAmount.toFixed(2)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <div className="flex items-center">
                      <Calendar className="h-4 w-4 mr-1 text-gray-400" />
                      {order.expectedDeliveryDate.toLocaleDateString()}
                    </div>
                    {order.actualDeliveryDate && (
                      <div className="text-xs text-green-600">
                        Delivered {order.actualDeliveryDate.toLocaleDateString()}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <div className="flex items-center">
                      <User className="h-4 w-4 mr-1 text-gray-400" />
                      User {order.createdBy.slice(-4)}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button className="text-gray-400 hover:text-gray-600">
                      <MoreHorizontal className="h-5 w-5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
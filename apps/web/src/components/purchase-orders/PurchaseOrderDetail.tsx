import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { 
  ArrowLeft,
  Edit,
  Send,
  Check,
  X,
  Package,
  Calendar,
  DollarSign,
  User,
  MapPin,
  FileText,
  Truck
} from 'lucide-react';
import { PurchaseOrder, PurchaseOrderStatus } from '../../types';

// Mock data
const mockPurchaseOrder: PurchaseOrder = {
  id: '1',
  orderNumber: 'PO-2023-001',
  supplierId: '1',
  locationId: '1',
  status: PurchaseOrderStatus.APPROVED,
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
    },
    {
      id: '2',
      productId: 'prod-2',
      productName: 'Lettuce',
      sku: 'LET-001',
      quantity: 30,
      unitPrice: 1.75,
      totalPrice: 52.50,
      receivedQuantity: 0
    },
    {
      id: '3',
      productId: 'prod-3',
      productName: 'Chicken Breast',
      sku: 'CHK-001',
      quantity: 25,
      unitPrice: 5.50,
      totalPrice: 137.50,
      receivedQuantity: 25
    }
  ],
  totalAmount: 315.00,
  expectedDeliveryDate: new Date('2023-11-15'),
  actualDeliveryDate: new Date('2023-11-14'),
  notes: 'Urgent order for kitchen supplies. Please ensure fresh produce.',
  createdBy: 'user-1',
  approvedBy: 'manager-1',
  createdAt: new Date('2023-11-01'),
  updatedAt: new Date('2023-11-14')
};

const mockSuppliers = [
  { id: '1', name: 'ABC Food Supplies', email: 'contact@abcfoods.com', phone: '+1-555-0123' }
];

const mockLocations = [
  { id: '1', name: 'Main Restaurant', address: '123 Main St, New York, NY' }
];

export function PurchaseOrderDetail() {
  const { id } = useParams<{ id: string }>();
  const [purchaseOrder, setPurchaseOrder] = useState<PurchaseOrder | null>(null);
  const [isReceiving, setIsReceiving] = useState(false);
  const [receivedQuantities, setReceivedQuantities] = useState<Record<string, number>>({});

  useEffect(() => {
    // In real app, fetch data based on id
    setPurchaseOrder(mockPurchaseOrder);
    // Initialize received quantities
    const initialQuantities: Record<string, number> = {};
    mockPurchaseOrder.items.forEach(item => {
      initialQuantities[item.id] = item.receivedQuantity;
    });
    setReceivedQuantities(initialQuantities);
  }, [id]);

  if (!purchaseOrder) {
    return <div>Loading...</div>;
  }

  const supplier = mockSuppliers.find(s => s.id === purchaseOrder.supplierId);
  const location = mockLocations.find(l => l.id === purchaseOrder.locationId);

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

  const handleStatusChange = (newStatus: PurchaseOrderStatus) => {
    console.log(`Changing status to ${newStatus}`);
    // Implementation would call API
    setPurchaseOrder({ ...purchaseOrder, status: newStatus });
  };

  const handleReceiveItems = () => {
    console.log('Receiving items:', receivedQuantities);
    // Implementation would call API to update received quantities
    const updatedItems = purchaseOrder.items.map(item => ({
      ...item,
      receivedQuantity: receivedQuantities[item.id] || 0
    }));
    
    const allReceived = updatedItems.every(item => item.receivedQuantity >= item.quantity);
    const newStatus = allReceived ? PurchaseOrderStatus.RECEIVED : PurchaseOrderStatus.PARTIALLY_RECEIVED;
    
    setPurchaseOrder({
      ...purchaseOrder,
      items: updatedItems,
      status: newStatus,
      actualDeliveryDate: new Date()
    });
    setIsReceiving(false);
  };

  const updateReceivedQuantity = (itemId: string, quantity: number) => {
    setReceivedQuantities({
      ...receivedQuantities,
      [itemId]: Math.max(0, Math.min(quantity, purchaseOrder.items.find(item => item.id === itemId)?.quantity || 0))
    });
  };

  const canReceive = purchaseOrder.status === PurchaseOrderStatus.APPROVED;
  const canEdit = purchaseOrder.status === PurchaseOrderStatus.DRAFT;
  const canSubmit = purchaseOrder.status === PurchaseOrderStatus.DRAFT;
  const canApprove = purchaseOrder.status === PurchaseOrderStatus.SUBMITTED;
  const canReject = purchaseOrder.status === PurchaseOrderStatus.SUBMITTED;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link to="/purchase-orders" className="text-gray-500 hover:text-gray-700">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{purchaseOrder.orderNumber}</h1>
            <p className="text-gray-600">Purchase Order Details</p>
          </div>
        </div>
        <div className="flex items-center space-x-4">
          <span className={`status-badge ${getStatusColor(purchaseOrder.status)}`}>
            {getStatusLabel(purchaseOrder.status)}
          </span>
          <div className="flex space-x-3">
            {canEdit && (
              <button className="btn btn-secondary">
                <Edit className="h-4 w-4" />
                Edit
              </button>
            )}
            {canSubmit && (
              <button 
                onClick={() => handleStatusChange(PurchaseOrderStatus.SUBMITTED)}
                className="btn btn-primary"
              >
                <Send className="h-4 w-4" />
                Submit for Approval
              </button>
            )}
            {canApprove && (
              <button 
                onClick={() => handleStatusChange(PurchaseOrderStatus.APPROVED)}
                className="btn btn-success"
              >
                <Check className="h-4 w-4" />
                Approve
              </button>
            )}
            {canReject && (
              <button 
                onClick={() => handleStatusChange(PurchaseOrderStatus.REJECTED)}
                className="btn btn-error"
              >
                <X className="h-4 w-4" />
                Reject
              </button>
            )}
            {canReceive && !isReceiving && (
              <button 
                onClick={() => setIsReceiving(true)}
                className="btn btn-primary"
              >
                <Package className="h-4 w-4" />
                Receive Items
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Order Details */}
          <div className="card">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Order Details</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <div className="text-sm text-gray-600">Supplier</div>
                  <div className="font-medium">{supplier?.name}</div>
                  <div className="text-sm text-gray-500">{supplier?.email}</div>
                  <div className="text-sm text-gray-500">{supplier?.phone}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-600">Delivery Location</div>
                  <div className="font-medium">{location?.name}</div>
                  <div className="text-sm text-gray-500">{location?.address}</div>
                </div>
              </div>
              
              <div className="space-y-4">
                <div>
                  <div className="text-sm text-gray-600">Expected Delivery</div>
                  <div className="flex items-center font-medium">
                    <Calendar className="h-4 w-4 mr-2 text-gray-400" />
                    {purchaseOrder.expectedDeliveryDate.toLocaleDateString()}
                  </div>
                  {purchaseOrder.actualDeliveryDate && (
                    <div className="flex items-center text-sm text-green-600">
                      <Truck className="h-4 w-4 mr-1" />
                      Delivered {purchaseOrder.actualDeliveryDate.toLocaleDateString()}
                    </div>
                  )}
                </div>
                <div>
                  <div className="text-sm text-gray-600">Total Amount</div>
                  <div className="flex items-center font-bold text-lg">
                    <DollarSign className="h-5 w-5 mr-1 text-gray-400" />
                    ${purchaseOrder.totalAmount.toFixed(2)}
                  </div>
                </div>
              </div>
            </div>
            
            {purchaseOrder.notes && (
              <div className="mt-6 pt-6 border-t">
                <div className="text-sm text-gray-600 mb-2">Notes</div>
                <div className="text-sm">{purchaseOrder.notes}</div>
              </div>
            )}
          </div>

          {/* Order Items */}
          <div className="card">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Order Items</h2>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead>
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Product
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      SKU
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Ordered
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Unit Price
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Total
                    </th>
                    {isReceiving && (
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Received
                      </th>
                    )}
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {purchaseOrder.items.map((item) => (
                    <tr key={item.id}>
                      <td className="px-4 py-3 text-sm font-medium text-gray-900">
                        {item.productName}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900">
                        {item.sku}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900">
                        {item.quantity}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900">
                        ${item.unitPrice.toFixed(2)}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900">
                        ${item.totalPrice.toFixed(2)}
                      </td>
                      {isReceiving && (
                        <td className="px-4 py-3">
                          <input
                            type="number"
                            min="0"
                            max={item.quantity}
                            className="input w-20"
                            value={receivedQuantities[item.id] || 0}
                            onChange={(e) => updateReceivedQuantity(item.id, parseInt(e.target.value) || 0)}
                          />
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            {isReceiving && (
              <div className="flex justify-end space-x-3 mt-6 pt-6 border-t">
                <button 
                  onClick={() => setIsReceiving(false)}
                  className="btn btn-secondary"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleReceiveItems}
                  className="btn btn-primary"
                >
                  Confirm Receipt
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Status & Actions */}
          <div className="card">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Status & Actions</h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Current Status</span>
                <span className={`status-badge ${getStatusColor(purchaseOrder.status)}`}>
                  {getStatusLabel(purchaseOrder.status)}
                </span>
              </div>
              
              <div className="border-t pt-4">
                <div className="text-sm text-gray-600 mb-2">Available Actions</div>
                <div className="space-y-2">
                  {canEdit && (
                    <button className="btn btn-secondary w-full text-sm">
                      <Edit className="h-3 w-3 mr-1" />
                      Edit Order
                    </button>
                  )}
                  {canSubmit && (
                    <button 
                      onClick={() => handleStatusChange(PurchaseOrderStatus.SUBMITTED)}
                      className="btn btn-primary w-full text-sm"
                    >
                      <Send className="h-3 w-3 mr-1" />
                      Submit for Approval
                    </button>
                  )}
                  {canApprove && (
                    <button 
                      onClick={() => handleStatusChange(PurchaseOrderStatus.APPROVED)}
                      className="btn btn-success w-full text-sm"
                    >
                      <Check className="h-3 w-3 mr-1" />
                      Approve Order
                    </button>
                  )}
                  {canReceive && (
                    <button 
                      onClick={() => setIsReceiving(true)}
                      className="btn btn-primary w-full text-sm"
                    >
                      <Package className="h-3 w-3 mr-1" />
                      Receive Items
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Order Information */}
          <div className="card">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Order Information</h2>
            <div className="space-y-3">
              <div>
                <div className="text-sm text-gray-600">Created By</div>
                <div className="flex items-center text-sm">
                  <User className="h-4 w-4 mr-1 text-gray-400" />
                  User {purchaseOrder.createdBy.slice(-4)}
                </div>
              </div>
              <div>
                <div className="text-sm text-gray-600">Created Date</div>
                <div className="text-sm">
                  {purchaseOrder.createdAt.toLocaleDateString()}
                </div>
              </div>
              {purchaseOrder.approvedBy && (
                <div>
                  <div className="text-sm text-gray-600">Approved By</div>
                  <div className="flex items-center text-sm">
                    <User className="h-4 w-4 mr-1 text-gray-400" />
                    User {purchaseOrder.approvedBy.slice(-4)}
                  </div>
                </div>
              )}
              <div>
                <div className="text-sm text-gray-600">Last Updated</div>
                <div className="text-sm">
                  {purchaseOrder.updatedAt.toLocaleDateString()}
                </div>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="card">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
            <div className="space-y-2">
              <button className="btn btn-secondary w-full text-sm justify-center">
                <FileText className="h-3 w-3 mr-1" />
                Generate PDF
              </button>
              <button className="btn btn-secondary w-full text-sm justify-center">
                <MapPin className="h-3 w-3 mr-1" />
                Track Delivery
              </button>
              <button className="btn btn-secondary w-full text-sm justify-center">
                <Package className="h-3 w-3 mr-1" />
                View History
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
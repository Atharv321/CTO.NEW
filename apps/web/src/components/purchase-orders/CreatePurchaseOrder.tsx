import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeft,
  Save,
  Send,
  Plus,
  Trash2,
  Search,
  DollarSign
} from 'lucide-react';
import { PurchaseOrderItem, PurchaseOrderStatus } from '../../types';

interface FormData {
  supplierId: string;
  locationId: string;
  expectedDeliveryDate: string;
  notes: string;
  items: PurchaseOrderItem[];
}

const mockSuppliers = [
  { id: '1', name: 'ABC Food Supplies', leadTimeDays: 3 },
  { id: '2', name: 'Fresh Produce Co', leadTimeDays: 2 },
  { id: '3', name: 'Global Ingredients Ltd', leadTimeDays: 7 }
];

const mockLocations = [
  { id: '1', name: 'Main Restaurant' },
  { id: '2', name: 'Downtown Branch' },
  { id: '3', name: 'Airport Location' }
];

const mockProducts = [
  { id: 'prod-1', name: 'Tomatoes', sku: 'TOM-001', unitPrice: 2.50 },
  { id: 'prod-2', name: 'Lettuce', sku: 'LET-001', unitPrice: 1.75 },
  { id: 'prod-3', name: 'Chicken Breast', sku: 'CHK-001', unitPrice: 5.50 },
  { id: 'prod-4', name: 'Rice', sku: 'RIC-001', unitPrice: 1.25 },
  { id: 'prod-5', name: 'Olive Oil', sku: 'OIL-001', unitPrice: 12.00 }
];

export function CreatePurchaseOrder() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState<FormData>({
    supplierId: '',
    locationId: '',
    expectedDeliveryDate: '',
    notes: '',
    items: []
  });
  const [showProductSearch, setShowProductSearch] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const calculateTotal = () => {
    return formData.items.reduce((sum, item) => sum + item.totalPrice, 0);
  };

  const updateItem = (index: number, field: keyof PurchaseOrderItem, value: any) => {
    const updatedItems = [...formData.items];
    updatedItems[index] = { ...updatedItems[index], [field]: value };
    
    // Recalculate total price if quantity or unit price changed
    if (field === 'quantity' || field === 'unitPrice') {
      updatedItems[index].totalPrice = updatedItems[index].quantity * updatedItems[index].unitPrice;
    }
    
    setFormData({ ...formData, items: updatedItems });
  };

  const addProduct = (product: typeof mockProducts[0]) => {
    const newItem: PurchaseOrderItem = {
      id: `temp-${Date.now()}`,
      productId: product.id,
      productName: product.name,
      sku: product.sku,
      quantity: 1,
      unitPrice: product.unitPrice,
      totalPrice: product.unitPrice,
      receivedQuantity: 0
    };
    
    setFormData({
      ...formData,
      items: [...formData.items, newItem]
    });
    setShowProductSearch(false);
    setSearchTerm('');
  };

  const removeItem = (index: number) => {
    const updatedItems = formData.items.filter((_, i) => i !== index);
    setFormData({ ...formData, items: updatedItems });
  };

  const handleSave = () => {
    console.log('Saving draft purchase order:', formData);
    // Implementation would save as draft
    navigate('/purchase-orders');
  };

  const handleSubmit = () => {
    console.log('Submitting purchase order:', formData);
    // Implementation would submit for approval
    navigate('/purchase-orders');
  };

  const filteredProducts = mockProducts.filter(product =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.sku.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getMinDeliveryDate = () => {
    const supplier = mockSuppliers.find(s => s.id === formData.supplierId);
    if (!supplier) return '';
    
    const today = new Date();
    const minDate = new Date(today);
    minDate.setDate(today.getDate() + supplier.leadTimeDays);
    return minDate.toISOString().split('T')[0];
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => navigate('/purchase-orders')}
            className="text-gray-500 hover:text-gray-700"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Create Purchase Order</h1>
            <p className="text-gray-600">Create a new purchase order</p>
          </div>
        </div>
        <div className="flex space-x-3">
          <button onClick={handleSave} className="btn btn-secondary">
            <Save className="h-4 w-4" />
            Save Draft
          </button>
          <button 
            onClick={handleSubmit}
            className="btn btn-primary"
            disabled={!formData.supplierId || !formData.locationId || formData.items.length === 0}
          >
            <Send className="h-4 w-4" />
            Submit Order
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Form */}
        <div className="lg:col-span-2 space-y-6">
          {/* Order Details */}
          <div className="card">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Order Details</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="form-group">
                <label className="form-label">Supplier *</label>
                <select
                  className="input"
                  value={formData.supplierId}
                  onChange={(e) => {
                    setFormData({ 
                      ...formData, 
                      supplierId: e.target.value,
                      expectedDeliveryDate: '' // Reset delivery date when supplier changes
                    });
                  }}
                  required
                >
                  <option value="">Select a supplier</option>
                  {mockSuppliers.map(supplier => (
                    <option key={supplier.id} value={supplier.id}>
                      {supplier.name} (Lead time: {supplier.leadTimeDays} days)
                    </option>
                  ))}
                </select>
              </div>
              
              <div className="form-group">
                <label className="form-label">Location *</label>
                <select
                  className="input"
                  value={formData.locationId}
                  onChange={(e) => setFormData({ ...formData, locationId: e.target.value })}
                  required
                >
                  <option value="">Select a location</option>
                  {mockLocations.map(location => (
                    <option key={location.id} value={location.id}>
                      {location.name}
                    </option>
                  ))}
                </select>
              </div>
              
              <div className="form-group">
                <label className="form-label">Expected Delivery Date *</label>
                <input
                  type="date"
                  className="input"
                  value={formData.expectedDeliveryDate}
                  min={getMinDeliveryDate()}
                  onChange={(e) => setFormData({ ...formData, expectedDeliveryDate: e.target.value })}
                  required
                />
              </div>
            </div>
            
            <div className="form-group mt-4">
              <label className="form-label">Notes</label>
              <textarea
                className="input"
                rows={3}
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Add any notes or special instructions..."
              />
            </div>
          </div>

          {/* Order Items */}
          <div className="card">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Order Items</h2>
              <button
                onClick={() => setShowProductSearch(true)}
                className="btn btn-primary"
              >
                <Plus className="h-4 w-4" />
                Add Item
              </button>
            </div>

            {formData.items.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No items added yet. Click "Add Item" to start building your order.
              </div>
            ) : (
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
                        Quantity
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Unit Price
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Total
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {formData.items.map((item, index) => (
                      <tr key={item.id}>
                        <td className="px-4 py-3 text-sm text-gray-900">
                          {item.productName}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-900">
                          {item.sku}
                        </td>
                        <td className="px-4 py-3">
                          <input
                            type="number"
                            min="1"
                            className="input w-20"
                            value={item.quantity}
                            onChange={(e) => updateItem(index, 'quantity', parseInt(e.target.value) || 0)}
                          />
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center">
                            <DollarSign className="h-4 w-4 text-gray-400" />
                            <input
                              type="number"
                              min="0"
                              step="0.01"
                              className="input w-24"
                              value={item.unitPrice}
                              onChange={(e) => updateItem(index, 'unitPrice', parseFloat(e.target.value) || 0)}
                            />
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-900">
                          ${item.totalPrice.toFixed(2)}
                        </td>
                        <td className="px-4 py-3">
                          <button
                            onClick={() => removeItem(index)}
                            className="text-red-600 hover:text-red-800"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Order Summary */}
          <div className="card">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Order Summary</h2>
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Items:</span>
                <span className="font-medium">{formData.items.length}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Total Quantity:</span>
                <span className="font-medium">
                  {formData.items.reduce((sum, item) => sum + item.quantity, 0)}
                </span>
              </div>
              <div className="border-t pt-3">
                <div className="flex justify-between">
                  <span className="font-semibold">Total Amount:</span>
                  <span className="font-bold text-lg">
                    ${calculateTotal().toFixed(2)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Product Search Modal */}
          {showProductSearch && (
            <div className="card">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Search Products</h3>
              <div className="relative mb-4">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search products..."
                  className="input pl-10"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  autoFocus
                />
              </div>
              
              <div className="max-h-64 overflow-y-auto space-y-2">
                {filteredProducts.map((product) => (
                  <button
                    key={product.id}
                    onClick={() => addProduct(product)}
                    className="w-full text-left p-3 border rounded hover:bg-gray-50"
                  >
                    <div className="font-medium text-sm">{product.name}</div>
                    <div className="text-xs text-gray-500">{product.sku} - ${product.unitPrice.toFixed(2)}/unit</div>
                  </button>
                ))}
              </div>
              
              <button
                onClick={() => {
                  setShowProductSearch(false);
                  setSearchTerm('');
                }}
                className="btn btn-secondary w-full mt-4"
              >
                Cancel
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
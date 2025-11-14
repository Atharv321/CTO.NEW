import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { 
  ArrowLeft,
  Mail,
  Phone,
  MapPin,
  Star,
  Edit,
  Package,
  TrendingUp,
  Calendar,
  DollarSign,
  Truck
} from 'lucide-react';
import { Supplier, SupplierContact, SupplierProduct } from '../../types';

// Mock data
const mockSupplier: Supplier = {
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
};

const mockContacts: SupplierContact[] = [
  {
    id: '1',
    supplierId: '1',
    name: 'John Smith',
    email: 'john.smith@abcfoods.com',
    phone: '+1-555-0123',
    role: 'Account Manager',
    isPrimary: true
  },
  {
    id: '2',
    supplierId: '1',
    name: 'Sarah Johnson',
    email: 'sarah.j@abcfoods.com',
    phone: '+1-555-0124',
    role: 'Sales Representative',
    isPrimary: false
  }
];

const mockProducts: SupplierProduct[] = [
  {
    id: '1',
    supplierId: '1',
    productId: 'prod-1',
    sku: 'ABC-001',
    unitPrice: 2.50,
    minimumOrderQuantity: 10,
    leadTimeDays: 3,
    isAvailable: true
  },
  {
    id: '2',
    supplierId: '1',
    productId: 'prod-2',
    sku: 'ABC-002',
    unitPrice: 3.75,
    minimumOrderQuantity: 5,
    leadTimeDays: 3,
    isAvailable: true
  },
  {
    id: '3',
    supplierId: '1',
    productId: 'prod-3',
    sku: 'ABC-003',
    unitPrice: 1.25,
    minimumOrderQuantity: 20,
    leadTimeDays: 5,
    isAvailable: false
  }
];

export function SupplierDetail() {
  const { id } = useParams<{ id: string }>();
  const [supplier, setSupplier] = useState<Supplier | null>(null);
  const [contacts, setContacts] = useState<SupplierContact[]>([]);
  const [products, setProducts] = useState<SupplierProduct[]>([]);
  const [activeTab, setActiveTab] = useState<'overview' | 'contacts' | 'products' | 'performance'>('overview');

  useEffect(() => {
    // In real app, fetch data based on id
    setSupplier(mockSupplier);
    setContacts(mockContacts);
    setProducts(mockProducts);
  }, [id]);

  if (!supplier) {
    return <div>Loading...</div>;
  }

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`h-4 w-4 ${
          i < Math.floor(rating) ? 'text-yellow-400 fill-current' : 'text-gray-300'
        }`}
      />
    ));
  };

  const performanceData = {
    onTimeDelivery: 92,
    orderAccuracy: 95,
    qualityScore: 88,
    totalOrders: 156,
    totalValue: 125000,
    averageOrderValue: 801
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link to="/suppliers" className="text-gray-500 hover:text-gray-700">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{supplier.name}</h1>
            <p className="text-gray-600">Supplier Details</p>
          </div>
        </div>
        <div className="flex space-x-3">
          <button className="btn btn-secondary">
            <Edit className="h-4 w-4" />
            Edit Supplier
          </button>
          <button className="btn btn-primary">
            Create Purchase Order
          </button>
        </div>
      </div>

      {/* Status Badge */}
      <div className="flex items-center space-x-4">
        <span className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full ${
          supplier.isActive 
            ? 'bg-green-100 text-green-800' 
            : 'bg-red-100 text-red-800'
        }`}>
          {supplier.isActive ? 'Active' : 'Inactive'}
        </span>
        <div className="flex items-center">
          {renderStars(supplier.rating)}
          <span className="ml-2 text-sm text-gray-600">{supplier.rating} rating</span>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {[
            { id: 'overview', label: 'Overview', icon: Package },
            { id: 'contacts', label: 'Contacts', icon: Mail },
            { id: 'products', label: 'Products', icon: Package },
            { id: 'performance', label: 'Performance', icon: TrendingUp }
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`
                  flex items-center px-1 py-4 border-b-2 text-sm font-medium
                  ${activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }
                `}
              >
                <Icon className="h-4 w-4 mr-2" />
                {tab.label}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Tab Content */}
      <div>
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              {/* Contact Information */}
              <div className="card">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Contact Information</h2>
                <div className="space-y-3">
                  <div className="flex items-center">
                    <Mail className="h-5 w-5 text-gray-400 mr-3" />
                    <span className="text-sm text-gray-900">{supplier.contactEmail}</span>
                  </div>
                  <div className="flex items-center">
                    <Phone className="h-5 w-5 text-gray-400 mr-3" />
                    <span className="text-sm text-gray-900">{supplier.contactPhone}</span>
                  </div>
                  <div className="flex items-center">
                    <MapPin className="h-5 w-5 text-gray-400 mr-3" />
                    <span className="text-sm text-gray-900">
                      {supplier.address}, {supplier.city}, {supplier.state}, {supplier.country}
                    </span>
                  </div>
                </div>
              </div>

              {/* Performance Overview */}
              <div className="card">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Performance Overview</h2>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">{performanceData.onTimeDelivery}%</div>
                    <div className="text-sm text-gray-600">On-Time Delivery</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">{performanceData.orderAccuracy}%</div>
                    <div className="text-sm text-gray-600">Order Accuracy</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-600">{performanceData.qualityScore}%</div>
                    <div className="text-sm text-gray-600">Quality Score</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              {/* Quick Stats */}
              <div className="card">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Stats</h2>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <Truck className="h-4 w-4 text-gray-400 mr-2" />
                      <span className="text-sm text-gray-600">Lead Time</span>
                    </div>
                    <span className="text-sm font-medium">{supplier.leadTimeDays} days</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <DollarSign className="h-4 w-4 text-gray-400 mr-2" />
                      <span className="text-sm text-gray-600">Min Order</span>
                    </div>
                    <span className="text-sm font-medium">${supplier.minimumOrder}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <Package className="h-4 w-4 text-gray-400 mr-2" />
                      <span className="text-sm text-gray-600">Total Orders</span>
                    </div>
                    <span className="text-sm font-medium">{performanceData.totalOrders}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <TrendingUp className="h-4 w-4 text-gray-400 mr-2" />
                      <span className="text-sm text-gray-600">Avg Order Value</span>
                    </div>
                    <span className="text-sm font-medium">${performanceData.averageOrderValue}</span>
                  </div>
                </div>
              </div>

              {/* Recent Activity */}
              <div className="card">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h2>
                <div className="space-y-3">
                  <div className="text-sm">
                    <div className="font-medium text-gray-900">Order #1234 completed</div>
                    <div className="text-gray-500">2 days ago</div>
                  </div>
                  <div className="text-sm">
                    <div className="font-medium text-gray-900">Price update received</div>
                    <div className="text-gray-500">1 week ago</div>
                  </div>
                  <div className="text-sm">
                    <div className="font-medium text-gray-900">New product added</div>
                    <div className="text-gray-500">2 weeks ago</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'contacts' && (
          <div className="card">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-semibold text-gray-900">Contacts</h2>
              <button className="btn btn-primary">Add Contact</button>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead>
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Role
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Email
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Phone
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Primary
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {contacts.map((contact) => (
                    <tr key={contact.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {contact.name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {contact.role}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {contact.email}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {contact.phone}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {contact.isPrimary && (
                          <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                            Primary
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'products' && (
          <div className="card">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-semibold text-gray-900">Products</h2>
              <button className="btn btn-primary">Add Product</button>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead>
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      SKU
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Product Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Unit Price
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Min Order Qty
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Lead Time
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {products.map((product) => (
                    <tr key={product.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {product.sku}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        Product {product.productId}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        ${product.unitPrice.toFixed(2)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {product.minimumOrderQuantity}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {product.leadTimeDays} days
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          product.isAvailable 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {product.isAvailable ? 'Available' : 'Unavailable'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'performance' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="card">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Performance Metrics</h2>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700">On-Time Delivery</span>
                    <span className="text-sm font-medium text-gray-900">{performanceData.onTimeDelivery}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-green-600 h-2 rounded-full" 
                      style={{ width: `${performanceData.onTimeDelivery}%` }}
                    />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700">Order Accuracy</span>
                    <span className="text-sm font-medium text-gray-900">{performanceData.orderAccuracy}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full" 
                      style={{ width: `${performanceData.orderAccuracy}%` }}
                    />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700">Quality Score</span>
                    <span className="text-sm font-medium text-gray-900">{performanceData.qualityScore}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-purple-600 h-2 rounded-full" 
                      style={{ width: `${performanceData.qualityScore}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="card">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Order History</h2>
              <div className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Total Orders</span>
                  <span className="text-sm font-medium">{performanceData.totalOrders}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Total Value</span>
                  <span className="text-sm font-medium">${performanceData.totalValue.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Average Order Value</span>
                  <span className="text-sm font-medium">${performanceData.averageOrderValue}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Last Order</span>
                  <span className="text-sm font-medium">2 days ago</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
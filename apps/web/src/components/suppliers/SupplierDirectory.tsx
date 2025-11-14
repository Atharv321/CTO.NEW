import { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  Search, 
  Filter, 
  Plus, 
  Download, 
  MapPin,
  Star,
  Mail,
  Phone,
  MoreHorizontal
} from 'lucide-react';
import { Supplier, SupplierFilters } from '../../types';
import { useAuth } from '../../hooks/useAuth';
import { RoleGuard } from '../RoleGuard';

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
  },
  {
    id: '3',
    name: 'Global Ingredients Ltd',
    contactEmail: 'info@globaling.com',
    contactPhone: '+1-555-0789',
    address: '789 International Ave',
    city: 'Chicago',
    state: 'IL',
    country: 'USA',
    isActive: false,
    leadTimeDays: 7,
    minimumOrder: 1000,
    rating: 3.9,
    createdAt: new Date('2023-03-10'),
    updatedAt: new Date('2023-09-30')
  }
];

const mockLocations = [
  { id: '1', name: 'New York', city: 'New York' },
  { id: '2', name: 'Los Angeles', city: 'Los Angeles' },
  { id: '3', name: 'Chicago', city: 'Chicago' }
];

export function SupplierDirectory() {
  const { hasPermission } = useAuth();
  const [suppliers] = useState<Supplier[]>(mockSuppliers);
  const [filters, setFilters] = useState<SupplierFilters>({});
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  const filteredSuppliers = suppliers.filter(supplier => {
    const matchesSearch = !searchTerm || 
      supplier.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      supplier.contactEmail.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesLocation = !filters.location || supplier.city === filters.location;
    const matchesStatus = !filters.status || 
      (filters.status === 'active' && supplier.isActive) ||
      (filters.status === 'inactive' && !supplier.isActive);
    const matchesRating = !filters.rating || supplier.rating >= filters.rating;

    return matchesSearch && matchesLocation && matchesStatus && matchesRating;
  });

  const handleExport = (format: 'csv' | 'pdf') => {
    console.log(`Exporting suppliers as ${format}`, { filters, searchTerm });
    // Implementation would call API endpoint
  };

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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Suppliers</h1>
          <p className="text-gray-600">Manage your supplier directory</p>
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
          <RoleGuard permission="suppliers.create">
            <Link to="/suppliers/new" className="btn btn-primary">
              <Plus className="h-4 w-4" />
              Add Supplier
            </Link>
          </RoleGuard>
        </div>
      </div>

      {/* Filters */}
      {showFilters && (
        <div className="card bg-gray-50">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="form-label">Location</label>
              <select
                className="input"
                value={filters.location || ''}
                onChange={(e) => setFilters({ ...filters, location: e.target.value })}
              >
                <option value="">All Locations</option>
                {mockLocations.map(location => (
                  <option key={location.id} value={location.city}>
                    {location.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="form-label">Status</label>
              <select
                className="input"
                value={filters.status || ''}
                onChange={(e) => setFilters({ ...filters, status: e.target.value as 'active' | 'inactive' | undefined })}
              >
                <option value="">All Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
            <div>
              <label className="form-label">Minimum Rating</label>
              <select
                className="input"
                value={filters.rating || ''}
                onChange={(e) => setFilters({ ...filters, rating: e.target.value ? Number(e.target.value) : undefined })}
              >
                <option value="">All Ratings</option>
                <option value="4">4+ Stars</option>
                <option value="3">3+ Stars</option>
                <option value="2">2+ Stars</option>
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
          placeholder="Search suppliers by name or email..."
          className="input pl-10"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* Supplier List */}
      <div className="card">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead>
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Supplier
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Location
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Rating
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Lead Time
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Min Order
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="relative px-6 py-3">
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredSuppliers.map((supplier) => (
                <tr key={supplier.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <Link
                        to={`/suppliers/${supplier.id}`}
                        className="text-sm font-medium text-blue-600 hover:text-blue-900"
                      >
                        {supplier.name}
                      </Link>
                      <div className="flex items-center gap-2 mt-1">
                        <div className="flex items-center text-xs text-gray-500">
                          <Mail className="h-3 w-3 mr-1" />
                          {supplier.contactEmail}
                        </div>
                        <div className="flex items-center text-xs text-gray-500">
                          <Phone className="h-3 w-3 mr-1" />
                          {supplier.contactPhone}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center text-sm text-gray-900">
                      <MapPin className="h-4 w-4 mr-1 text-gray-400" />
                      {supplier.city}, {supplier.state}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      {renderStars(supplier.rating)}
                      <span className="ml-2 text-sm text-gray-600">{supplier.rating}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {supplier.leadTimeDays} days
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    ${supplier.minimumOrder}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      supplier.isActive 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {supplier.isActive ? 'Active' : 'Inactive'}
                    </span>
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
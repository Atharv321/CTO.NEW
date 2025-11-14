import { 
  Users, 
  ShoppingCart, 
  Package, 
  Bell,
  TrendingUp,
  AlertTriangle
} from 'lucide-react';

export function Dashboard() {
  const stats = [
    {
      name: 'Active Suppliers',
      value: '24',
      change: '+2 from last month',
      changeType: 'positive',
      icon: Users
    },
    {
      name: 'Pending Orders',
      value: '8',
      change: '-3 from last week',
      changeType: 'positive',
      icon: ShoppingCart
    },
    {
      name: 'Total Products',
      value: '156',
      change: '+12 this month',
      changeType: 'positive',
      icon: Package
    },
    {
      name: 'Unread Notifications',
      value: '3',
      change: '2 new today',
      changeType: 'neutral',
      icon: Bell
    }
  ];

  const recentActivity = [
    {
      id: 1,
      type: 'order',
      message: 'Purchase Order #1234 submitted to ABC Supplier',
      time: '2 hours ago',
      status: 'success'
    },
    {
      id: 2,
      type: 'delivery',
      message: 'Delivery received from XYZ Foods - Order #1232',
      time: '4 hours ago',
      status: 'success'
    },
    {
      id: 3,
      type: 'alert',
      message: 'Low stock alert: Tomatoes below threshold',
      time: '6 hours ago',
      status: 'warning'
    },
    {
      id: 4,
      type: 'supplier',
      message: 'New supplier application: Fresh Produce Co',
      time: '1 day ago',
      status: 'info'
    }
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600">Overview of your supplier and purchase order activity</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.name} className="card">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <Icon className="h-6 w-6 text-gray-400" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">{stat.name}</p>
                  <p className="text-2xl font-semibold text-gray-900">{stat.value}</p>
                </div>
              </div>
              <div className="mt-4">
                <p className={`text-sm ${
                  stat.changeType === 'positive' ? 'text-green-600' : 
                  stat.changeType === 'negative' ? 'text-red-600' : 
                  'text-gray-600'
                }`}>
                  {stat.change}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Recent Activity</h2>
            <TrendingUp className="h-5 w-5 text-gray-400" />
          </div>
          <div className="space-y-4">
            {recentActivity.map((activity) => (
              <div key={activity.id} className="flex items-start space-x-3">
                <div className={`
                  flex-shrink-0 w-2 h-2 rounded-full mt-2
                  ${activity.status === 'success' ? 'bg-green-500' :
                    activity.status === 'warning' ? 'bg-yellow-500' :
                    'bg-blue-500'
                  }
                `} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-900">{activity.message}</p>
                  <p className="text-xs text-gray-500">{activity.time}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Quick Actions</h2>
            <AlertTriangle className="h-5 w-5 text-gray-400" />
          </div>
          <div className="space-y-3">
            <button className="btn btn-primary w-full justify-center">
              Create Purchase Order
            </button>
            <button className="btn btn-secondary w-full justify-center">
              Add New Supplier
            </button>
            <button className="btn btn-secondary w-full justify-center">
              View Low Stock Items
            </button>
            <button className="btn btn-secondary w-full justify-center">
              Generate Report
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
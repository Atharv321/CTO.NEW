import { useState } from 'react';
import { 
  Bell,
  Check,
  X,
  Filter,
  Search,
  Trash2,
  Settings,
  User,
  Package,
  AlertTriangle,
  TrendingUp
} from 'lucide-react';
import { Notification, NotificationType } from '../../types';

// Mock data
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
  },
  {
    id: '2',
    userId: 'user-1',
    type: NotificationType.SUPPLIER_UPDATE,
    title: 'Supplier Price Update',
    message: 'ABC Food Supplies has updated prices for tomatoes and lettuce.',
    isRead: false,
    data: { supplierId: '1', supplierName: 'ABC Food Supplies' },
    createdAt: new Date('2023-11-14T09:15:00')
  },
  {
    id: '3',
    userId: 'user-1',
    type: NotificationType.LOW_STOCK,
    title: 'Low Stock Alert',
    message: 'Chicken breast is running low at Main Restaurant. Current stock: 15 units.',
    isRead: true,
    data: { productId: 'prod-3', productName: 'Chicken Breast', locationId: '1', currentStock: 15 },
    createdAt: new Date('2023-11-13T16:45:00')
  },
  {
    id: '4',
    userId: 'user-1',
    type: NotificationType.DELIVERY_DELAY,
    title: 'Delivery Delay Notice',
    message: 'Delivery from Fresh Produce Co will be delayed by 1 day due to weather.',
    isRead: true,
    data: { supplierId: '2', supplierName: 'Fresh Produce Co', delayDays: 1 },
    createdAt: new Date('2023-11-13T14:20:00')
  },
  {
    id: '5',
    userId: 'user-1',
    type: NotificationType.ORDER_STATUS_CHANGE,
    title: 'Order Received',
    message: 'Items from PO-2023-004 have been received and added to inventory.',
    isRead: true,
    data: { orderId: '4', orderNumber: 'PO-2023-004' },
    createdAt: new Date('2023-11-12T11:00:00')
  }
];

export function Notifications() {
  const [notifications, setNotifications] = useState<Notification[]>(mockNotifications);
  const [filter, setFilter] = useState<'all' | 'unread' | NotificationType>('all');
  const [searchTerm, setSearchTerm] = useState('');

  const filteredNotifications = notifications.filter(notification => {
    const matchesSearch = !searchTerm || 
      notification.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      notification.message.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesFilter = filter === 'all' || 
      (filter === 'unread' && !notification.isRead) ||
      notification.type === filter;

    return matchesSearch && matchesFilter;
  });

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const markAsRead = (id: string) => {
    setNotifications(notifications.map(n => 
      n.id === id ? { ...n, isRead: true } : n
    ));
  };

  const markAllAsRead = () => {
    setNotifications(notifications.map(n => ({ ...n, isRead: true })));
  };

  const deleteNotification = (id: string) => {
    setNotifications(notifications.filter(n => n.id !== id));
  };

  const clearAllRead = () => {
    setNotifications(notifications.filter(n => !n.isRead));
  };

  const getNotificationIcon = (type: NotificationType) => {
    switch (type) {
      case NotificationType.SUPPLIER_UPDATE:
        return User;
      case NotificationType.ORDER_STATUS_CHANGE:
        return Package;
      case NotificationType.LOW_STOCK:
        return AlertTriangle;
      case NotificationType.DELIVERY_DELAY:
        return TrendingUp;
      default:
        return Bell;
    }
  };

  const getNotificationColor = (type: NotificationType) => {
    switch (type) {
      case NotificationType.SUPPLIER_UPDATE:
        return 'text-blue-600 bg-blue-100';
      case NotificationType.ORDER_STATUS_CHANGE:
        return 'text-green-600 bg-green-100';
      case NotificationType.LOW_STOCK:
        return 'text-red-600 bg-red-100';
      case NotificationType.DELIVERY_DELAY:
        return 'text-yellow-600 bg-yellow-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const formatRelativeTime = (date: Date) => {
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 60) {
      return `${diffInMinutes} minutes ago`;
    } else if (diffInMinutes < 1440) {
      const diffInHours = Math.floor(diffInMinutes / 60);
      return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`;
    } else {
      const diffInDays = Math.floor(diffInMinutes / 1440);
      return `${diffInDays} day${diffInDays > 1 ? 's' : ''} ago`;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Notifications</h1>
          <p className="text-gray-600">
            {unreadCount > 0 ? `${unreadCount} unread notification${unreadCount > 1 ? 's' : ''}` : 'All caught up!'}
          </p>
        </div>
        <div className="flex gap-3">
          {unreadCount > 0 && (
            <button 
              onClick={markAllAsRead}
              className="btn btn-secondary"
            >
              <Check className="h-4 w-4" />
              Mark All Read
            </button>
          )}
          <button className="btn btn-secondary">
            <Settings className="h-4 w-4" />
            Settings
          </button>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="flex flex-col sm:flex-row gap-4">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search notifications..."
            className="input pl-10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {/* Filter */}
        <select
          className="input"
          value={filter}
          onChange={(e) => setFilter(e.target.value as any)}
        >
          <option value="all">All Notifications</option>
          <option value="unread">Unread Only</option>
          <option value={NotificationType.SUPPLIER_UPDATE}>Supplier Updates</option>
          <option value={NotificationType.ORDER_STATUS_CHANGE}>Order Changes</option>
          <option value={NotificationType.LOW_STOCK}>Low Stock Alerts</option>
          <option value={NotificationType.DELIVERY_DELAY}>Delivery Delays</option>
        </select>

        {/* Clear Read */}
        {notifications.filter(n => n.isRead).length > 0 && (
          <button 
            onClick={clearAllRead}
            className="btn btn-secondary"
          >
            <Trash2 className="h-4 w-4" />
            Clear Read
          </button>
        )}
      </div>

      {/* Notifications List */}
      <div className="space-y-3">
        {filteredNotifications.length === 0 ? (
          <div className="card text-center py-12">
            <Bell className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No notifications</h3>
            <p className="text-gray-500">
              {searchTerm || filter !== 'all' 
                ? 'No notifications match your search or filter criteria.'
                : 'You\'re all caught up! No new notifications.'
              }
            </p>
          </div>
        ) : (
          filteredNotifications.map((notification) => {
            const Icon = getNotificationIcon(notification.type);
            const iconColors = getNotificationColor(notification.type);
            
            return (
              <div
                key={notification.id}
                className={`card p-4 transition-all hover:shadow-md ${
                  !notification.isRead ? 'border-l-4 border-blue-500 bg-blue-50' : ''
                }`}
              >
                <div className="flex items-start space-x-3">
                  {/* Icon */}
                  <div className={`flex-shrink-0 p-2 rounded-full ${iconColors}`}>
                    <Icon className="h-5 w-5" />
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className={`text-sm font-medium ${
                          !notification.isRead ? 'text-gray-900' : 'text-gray-700'
                        }`}>
                          {notification.title}
                        </h3>
                        <p className={`text-sm mt-1 ${
                          !notification.isRead ? 'text-gray-800' : 'text-gray-600'
                        }`}>
                          {notification.message}
                        </p>
                        <p className="text-xs text-gray-500 mt-2">
                          {formatRelativeTime(notification.createdAt)}
                        </p>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center space-x-2 ml-4">
                        {!notification.isRead && (
                          <button
                            onClick={() => markAsRead(notification.id)}
                            className="text-blue-600 hover:text-blue-800"
                            title="Mark as read"
                          >
                            <Check className="h-4 w-4" />
                          </button>
                        )}
                        <button
                          onClick={() => deleteNotification(notification.id)}
                          className="text-gray-400 hover:text-red-600"
                          title="Delete notification"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    </div>

                    {/* Action Buttons for specific notification types */}
                    {notification.type === NotificationType.LOW_STOCK && (
                      <div className="mt-3 pt-3 border-t">
                        <button className="btn btn-primary text-sm">
                          Create Purchase Order
                        </button>
                      </div>
                    )}
                    
                    {notification.type === NotificationType.SUPPLIER_UPDATE && (
                      <div className="mt-3 pt-3 border-t">
                        <button className="btn btn-secondary text-sm">
                          View Supplier
                        </button>
                      </div>
                    )}
                    
                    {notification.type === NotificationType.ORDER_STATUS_CHANGE && (
                      <div className="mt-3 pt-3 border-t">
                        <button className="btn btn-secondary text-sm">
                          View Order
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Load More (for pagination) */}
      {filteredNotifications.length > 0 && filteredNotifications.length >= 10 && (
        <div className="text-center">
          <button className="btn btn-secondary">
            Load More Notifications
          </button>
        </div>
      )}
    </div>
  );
}
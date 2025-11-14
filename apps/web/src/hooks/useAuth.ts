import { UserRole } from '../types';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  createdAt: Date;
}

export function useAuth(): { user: User | null; hasPermission: (permission: string) => boolean } {
  // In a real app, this would get the user from context or API
  const user: User = {
    id: 'user-1',
    email: 'user@example.com',
    name: 'Test User',
    role: UserRole.MANAGER,
    createdAt: new Date()
  };

  const hasPermission = (permission: string): boolean => {
    if (!user) return false;

    const permissions = {
      [UserRole.ADMIN]: [
        'suppliers.create',
        'suppliers.edit',
        'suppliers.delete',
        'suppliers.view',
        'purchase_orders.create',
        'purchase_orders.edit',
        'purchase_orders.delete',
        'purchase_orders.view',
        'purchase_orders.approve',
        'purchase_orders.receive',
        'notifications.view',
        'notifications.manage',
        'reports.view',
        'reports.export'
      ],
      [UserRole.MANAGER]: [
        'suppliers.create',
        'suppliers.edit',
        'suppliers.view',
        'purchase_orders.create',
        'purchase_orders.edit',
        'purchase_orders.view',
        'purchase_orders.approve',
        'purchase_orders.receive',
        'notifications.view',
        'reports.view',
        'reports.export'
      ],
      [UserRole.STAFF]: [
        'suppliers.view',
        'purchase_orders.create',
        'purchase_orders.view',
        'purchase_orders.receive',
        'notifications.view',
        'reports.view'
      ]
    };

    return permissions[user.role]?.includes(permission) || false;
  };

  return { user, hasPermission };
}
import React from 'react';
import { useAuthStore } from '@/stores/useAuthStore';

type UserRole = 'admin' | 'manager' | 'staff' | 'viewer' | 'operator';

interface PermissionGuardProps {
  children: React.ReactNode;
  roles: UserRole[];
  fallback?: React.ReactNode;
}

/**
 * Permission guard component for role-based UI rendering
 * Shows content only if user role is in the allowed roles list
 */
export const PermissionGuard: React.FC<PermissionGuardProps> = ({
  children,
  roles,
  fallback = null,
}) => {
  const user = useAuthStore((state) => state.user);

  if (!user || !roles.includes(user.role as UserRole)) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
};

/**
 * Hook for checking user permissions
 */
export function usePermission() {
  const user = useAuthStore((state) => state.user);

  return {
    isAdmin: user?.role === 'admin',
    isManager: user?.role === 'manager' || user?.role === 'admin',
    isStaff: user?.role === 'staff' || user?.role === 'manager' || user?.role === 'admin',
    isViewer: user?.role === 'viewer' || user?.role === 'staff' || user?.role === 'manager' || user?.role === 'admin',
    canViewInventory: !!user,
    canEditInventory: user?.role === 'manager' || user?.role === 'admin',
    canDeleteInventory: user?.role === 'admin',
    canAdjustStock: user?.role === 'operator' || user?.role === 'manager' || user?.role === 'admin' || user?.role === 'viewer',
    canViewAuditLog: !!user,
    user,
  };
}

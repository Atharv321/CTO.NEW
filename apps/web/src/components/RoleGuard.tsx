import { ReactNode } from 'react';
import { useAuth } from '../hooks/useAuth';

interface RoleGuardProps {
  children: ReactNode;
  permission?: string;
  roles?: string[];
  fallback?: ReactNode;
}

export function RoleGuard({ children, permission, roles, fallback = null }: RoleGuardProps) {
  const { hasPermission, user } = useAuth();

  // Check specific permission
  if (permission && !hasPermission(permission)) {
    return <>{fallback}</>;
  }

  // Check role-based access
  if (roles && user && !roles.includes(user.role)) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}
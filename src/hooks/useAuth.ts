import { useAuth } from '../contexts/AuthContext';
import { useEffect } from 'react';

export function useRequireAuth() {
  const { isAuthenticated, isLoading, user } = useAuth();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      window.location.href = '/login';
    }
  }, [isAuthenticated, isLoading]);

  return { isAuthenticated, isLoading, user };
}

export function useRequireRole(requiredRole: 'admin' | 'manager' | 'user') {
  const { isAuthenticated, isLoading, user } = useAuth();

  useEffect(() => {
    if (!isLoading) {
      if (!isAuthenticated) {
        window.location.href = '/login';
        return;
      }

      if (user && !hasRequiredRole(user.role, requiredRole)) {
        window.location.href = '/unauthorized';
        return;
      }
    }
  }, [isAuthenticated, isLoading, user, requiredRole]);

  return { isAuthenticated, isLoading, user, hasAccess: user ? hasRequiredRole(user.role, requiredRole) : false };
}

function hasRequiredRole(userRole: string, requiredRole: string): boolean {
  const roleHierarchy = {
    user: 0,
    manager: 1,
    admin: 2,
  };

  return roleHierarchy[userRole as keyof typeof roleHierarchy] >= roleHierarchy[requiredRole as keyof typeof roleHierarchy];
}
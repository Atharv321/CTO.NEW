'use client';

import { AdminAuthProvider } from '@/contexts/AdminAuthContext';
import { ChakraProvider } from '@chakra-ui/react';

export default function AdminRootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ChakraProvider>
      <AdminAuthProvider>
        {children}
      </AdminAuthProvider>
    </ChakraProvider>
  );
}

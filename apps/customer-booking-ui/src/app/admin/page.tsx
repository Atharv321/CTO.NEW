'use client';

import { useQuery } from '@tanstack/react-query';
import {
  Box,
  SimpleGrid,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  Heading,
  useColorModeValue,
  Spinner,
  Center,
  Alert,
  AlertIcon,
} from '@chakra-ui/react';
import { ProtectedRoute } from '@/components/admin/ProtectedRoute';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { adminApiClient } from '@/lib/admin-api-client';

export default function AdminDashboardPage() {
  return (
    <ProtectedRoute>
      <AdminLayout>
        <DashboardContent />
      </AdminLayout>
    </ProtectedRoute>
  );
}

function DashboardContent() {
  const statBg = useColorModeValue('white', 'gray.800');

  const { data: services, isLoading: loadingServices } = useQuery({
    queryKey: ['admin', 'services'],
    queryFn: () => adminApiClient.getServices(),
  });

  const { data: barbers, isLoading: loadingBarbers } = useQuery({
    queryKey: ['admin', 'barbers'],
    queryFn: () => adminApiClient.getBarbers(),
  });

  const { data: bookings, isLoading: loadingBookings } = useQuery({
    queryKey: ['admin', 'bookings'],
    queryFn: () => adminApiClient.getBookings(),
  });

  const isLoading = loadingServices || loadingBarbers || loadingBookings;

  if (isLoading) {
    return (
      <Center h="400px">
        <Spinner size="xl" color="blue.500" />
      </Center>
    );
  }

  const totalBookings = bookings?.total || 0;
  const pendingBookings = bookings?.data?.filter((b) => b.status === 'pending').length || 0;

  return (
    <Box>
      <Heading mb={6}>Dashboard Overview</Heading>

      <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} spacing={6} mb={8}>
        <Box
          p={6}
          bg={statBg}
          borderRadius="lg"
          boxShadow="md"
        >
          <Stat>
            <StatLabel>Total Services</StatLabel>
            <StatNumber>{services?.length || 0}</StatNumber>
            <StatHelpText>Active services</StatHelpText>
          </Stat>
        </Box>

        <Box
          p={6}
          bg={statBg}
          borderRadius="lg"
          boxShadow="md"
        >
          <Stat>
            <StatLabel>Total Barbers</StatLabel>
            <StatNumber>{barbers?.length || 0}</StatNumber>
            <StatHelpText>Active staff</StatHelpText>
          </Stat>
        </Box>

        <Box
          p={6}
          bg={statBg}
          borderRadius="lg"
          boxShadow="md"
        >
          <Stat>
            <StatLabel>Total Bookings</StatLabel>
            <StatNumber>{totalBookings}</StatNumber>
            <StatHelpText>All time</StatHelpText>
          </Stat>
        </Box>

        <Box
          p={6}
          bg={statBg}
          borderRadius="lg"
          boxShadow="md"
        >
          <Stat>
            <StatLabel>Pending Bookings</StatLabel>
            <StatNumber>{pendingBookings}</StatNumber>
            <StatHelpText>Awaiting confirmation</StatHelpText>
          </Stat>
        </Box>
      </SimpleGrid>

      <Alert status="info" borderRadius="md">
        <AlertIcon />
        Welcome to the admin dashboard. Use the sidebar to manage services, barbers, availability, and bookings.
      </Alert>
    </Box>
  );
}

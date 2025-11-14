'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Box,
  Button,
  Heading,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Select,
  Input,
  Stack,
  useToast,
  useColorModeValue,
  Spinner,
  Center,
  Badge,
  HStack,
  Text,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
} from '@chakra-ui/react';
import { ChevronDownIcon } from '@chakra-ui/icons';
import { ProtectedRoute } from '@/components/admin/ProtectedRoute';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { adminApiClient } from '@/lib/admin-api-client';
import { BookingFilters } from '@/types/admin';

const STATUS_COLORS: Record<string, string> = {
  pending: 'yellow',
  confirmed: 'green',
  cancelled: 'red',
  completed: 'blue',
};

export default function BookingsPage() {
  return (
    <ProtectedRoute>
      <AdminLayout>
        <BookingsContent />
      </AdminLayout>
    </ProtectedRoute>
  );
}

function BookingsContent() {
  const [filters, setFilters] = useState<BookingFilters>({});
  const toast = useToast();
  const queryClient = useQueryClient();
  const tableBg = useColorModeValue('white', 'gray.800');
  const filterBg = useColorModeValue('gray.50', 'gray.700');

  const { data: bookingsResponse, isLoading } = useQuery({
    queryKey: ['admin', 'bookings', filters],
    queryFn: () => adminApiClient.getBookings(filters),
  });

  const { data: barbers } = useQuery({
    queryKey: ['admin', 'barbers'],
    queryFn: () => adminApiClient.getBarbers(),
  });

  const { data: services } = useQuery({
    queryKey: ['admin', 'services'],
    queryFn: () => adminApiClient.getServices(),
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ bookingId, status }: { bookingId: string; status: 'confirmed' | 'cancelled' | 'completed' }) =>
      adminApiClient.updateBookingStatus(bookingId, status),
    onMutate: async ({ bookingId, status }) => {
      // Optimistic update
      await queryClient.cancelQueries({ queryKey: ['admin', 'bookings', filters] });
      const previousData = queryClient.getQueryData(['admin', 'bookings', filters]);

      queryClient.setQueryData(['admin', 'bookings', filters], (old: any) => {
        if (!old) return old;
        return {
          ...old,
          data: old.data.map((booking: any) =>
            booking.bookingId === bookingId ? { ...booking, status } : booking
          ),
        };
      });

      return { previousData };
    },
    onSuccess: () => {
      toast({
        title: 'Booking status updated',
        status: 'success',
        duration: 3000,
      });
    },
    onError: (error: any, variables, context) => {
      // Rollback optimistic update
      if (context?.previousData) {
        queryClient.setQueryData(['admin', 'bookings', filters], context.previousData);
      }
      toast({
        title: 'Error updating booking status',
        description: error.message,
        status: 'error',
        duration: 5000,
      });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'bookings'] });
    },
  });

  const handleFilterChange = (key: keyof BookingFilters, value: string) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value || undefined,
    }));
  };

  const handleClearFilters = () => {
    setFilters({});
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  if (isLoading) {
    return (
      <Center h="400px">
        <Spinner size="xl" color="blue.500" />
      </Center>
    );
  }

  const bookings = bookingsResponse?.data || [];
  const hasActiveFilters = Object.values(filters).some((v) => v);

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={6}>
        <Heading>Bookings Management</Heading>
        {hasActiveFilters && (
          <Button size="sm" onClick={handleClearFilters}>
            Clear Filters
          </Button>
        )}
      </Box>

      {/* Filters */}
      <Box bg={filterBg} p={4} borderRadius="lg" mb={6}>
        <Stack direction={{ base: 'column', md: 'row' }} spacing={4}>
          <Box flex={1}>
            <Text fontSize="sm" mb={1} fontWeight="medium">
              Status
            </Text>
            <Select
              placeholder="All statuses"
              value={filters.status || ''}
              onChange={(e) => handleFilterChange('status', e.target.value)}
            >
              <option value="pending">Pending</option>
              <option value="confirmed">Confirmed</option>
              <option value="cancelled">Cancelled</option>
              <option value="completed">Completed</option>
            </Select>
          </Box>

          <Box flex={1}>
            <Text fontSize="sm" mb={1} fontWeight="medium">
              Barber
            </Text>
            <Select
              placeholder="All barbers"
              value={filters.barberId || ''}
              onChange={(e) => handleFilterChange('barberId', e.target.value)}
            >
              {barbers?.map((barber) => (
                <option key={barber.id} value={barber.id}>
                  {barber.name}
                </option>
              ))}
            </Select>
          </Box>

          <Box flex={1}>
            <Text fontSize="sm" mb={1} fontWeight="medium">
              Service
            </Text>
            <Select
              placeholder="All services"
              value={filters.serviceId || ''}
              onChange={(e) => handleFilterChange('serviceId', e.target.value)}
            >
              {services?.map((service) => (
                <option key={service.id} value={service.id}>
                  {service.name}
                </option>
              ))}
            </Select>
          </Box>

          <Box flex={1}>
            <Text fontSize="sm" mb={1} fontWeight="medium">
              Search
            </Text>
            <Input
              placeholder="Customer name or email..."
              value={filters.searchTerm || ''}
              onChange={(e) => handleFilterChange('searchTerm', e.target.value)}
            />
          </Box>
        </Stack>
      </Box>

      {/* Bookings Table */}
      <Box bg={tableBg} borderRadius="lg" boxShadow="md" overflowX="auto">
        <Table variant="simple">
          <Thead>
            <Tr>
              <Th>Customer</Th>
              <Th>Service</Th>
              <Th>Barber</Th>
              <Th>Scheduled Time</Th>
              <Th>Status</Th>
              <Th>Actions</Th>
            </Tr>
          </Thead>
          <Tbody>
            {bookings.length === 0 ? (
              <Tr>
                <Td colSpan={6} textAlign="center" color="gray.500">
                  No bookings found
                </Td>
              </Tr>
            ) : (
              bookings.map((booking) => (
                <Tr key={booking.bookingId}>
                  <Td>
                    <Box>
                      <Text fontWeight="medium">{booking.customerName}</Text>
                      <Text fontSize="sm" color="gray.600">
                        {booking.customerEmail}
                      </Text>
                    </Box>
                  </Td>
                  <Td>{booking.serviceName}</Td>
                  <Td>{booking.barberName}</Td>
                  <Td>{formatDate(booking.scheduledTime)}</Td>
                  <Td>
                    <Badge colorScheme={STATUS_COLORS[booking.status]}>
                      {booking.status}
                    </Badge>
                  </Td>
                  <Td>
                    <Menu>
                      <MenuButton as={Button} size="sm" rightIcon={<ChevronDownIcon />}>
                        Actions
                      </MenuButton>
                      <MenuList>
                        {booking.status === 'pending' && (
                          <MenuItem
                            onClick={() =>
                              updateStatusMutation.mutate({
                                bookingId: booking.bookingId,
                                status: 'confirmed',
                              })
                            }
                          >
                            Confirm
                          </MenuItem>
                        )}
                        {(booking.status === 'pending' || booking.status === 'confirmed') && (
                          <MenuItem
                            onClick={() =>
                              updateStatusMutation.mutate({
                                bookingId: booking.bookingId,
                                status: 'completed',
                              })
                            }
                          >
                            Mark Completed
                          </MenuItem>
                        )}
                        {booking.status !== 'cancelled' && (
                          <MenuItem
                            color="red.500"
                            onClick={() =>
                              updateStatusMutation.mutate({
                                bookingId: booking.bookingId,
                                status: 'cancelled',
                              })
                            }
                          >
                            Cancel
                          </MenuItem>
                        )}
                      </MenuList>
                    </Menu>
                  </Td>
                </Tr>
              ))
            )}
          </Tbody>
        </Table>
      </Box>

      {/* Pagination Info */}
      {bookingsResponse && bookingsResponse.total > 0 && (
        <Box mt={4} textAlign="center" color="gray.600">
          Showing {bookings.length} of {bookingsResponse.total} bookings
        </Box>
      )}
    </Box>
  );
}

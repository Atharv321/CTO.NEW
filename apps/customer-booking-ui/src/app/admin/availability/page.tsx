'use client';

import { useState, useRef } from 'react';
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
  IconButton,
  useDisclosure,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  FormControl,
  FormLabel,
  Input,
  Select,
  Stack,
  useToast,
  AlertDialog,
  AlertDialogBody,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogContent,
  AlertDialogOverlay,
  useColorModeValue,
  Spinner,
  Center,
  Badge,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  Switch,
} from '@chakra-ui/react';
import { EditIcon, DeleteIcon, AddIcon } from '@chakra-ui/icons';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ProtectedRoute } from '@/components/admin/ProtectedRoute';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { adminApiClient } from '@/lib/admin-api-client';
import { AvailabilitySlot } from '@/types/admin';

const slotSchema = z.object({
  barberId: z.string().min(1, 'Barber is required'),
  dayOfWeek: z.number().min(0).max(6),
  startTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format (HH:mm)'),
  endTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format (HH:mm)'),
  isActive: z.boolean(),
});

type SlotFormData = z.infer<typeof slotSchema>;

const DAYS_OF_WEEK = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
];

export default function AvailabilityPage() {
  return (
    <ProtectedRoute>
      <AdminLayout>
        <AvailabilityContent />
      </AdminLayout>
    </ProtectedRoute>
  );
}

function AvailabilityContent() {
  const [selectedBarberId, setSelectedBarberId] = useState<string>('');
  const [deletingSlot, setDeletingSlot] = useState<AvailabilitySlot | null>(null);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const {
    isOpen: isDeleteOpen,
    onOpen: onDeleteOpen,
    onClose: onDeleteClose,
  } = useDisclosure();
  const cancelRef = useRef<HTMLButtonElement>(null);
  const toast = useToast();
  const queryClient = useQueryClient();
  const tableBg = useColorModeValue('white', 'gray.800');

  const { data: barbers } = useQuery({
    queryKey: ['admin', 'barbers'],
    queryFn: () => adminApiClient.getBarbers(),
  });

  const { data: calendars, isLoading } = useQuery({
    queryKey: ['admin', 'availability'],
    queryFn: () => adminApiClient.getAvailabilityCalendars(),
  });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
    setValue,
  } = useForm<SlotFormData>({
    resolver: zodResolver(slotSchema),
    defaultValues: {
      isActive: true,
      dayOfWeek: 1,
    },
  });

  const createSlotMutation = useMutation({
    mutationFn: ({ barberId, slot }: { barberId: string; slot: Omit<AvailabilitySlot, 'id' | 'barberId'> }) =>
      adminApiClient.createAvailabilitySlot(barberId, slot),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'availability'] });
      toast({
        title: 'Availability slot created',
        status: 'success',
        duration: 3000,
      });
      onClose();
      reset();
    },
    onError: (error: any) => {
      toast({
        title: 'Error creating slot',
        description: error.message,
        status: 'error',
        duration: 5000,
      });
    },
  });

  const deleteSlotMutation = useMutation({
    mutationFn: ({ barberId, slotId }: { barberId: string; slotId: string }) =>
      adminApiClient.deleteAvailabilitySlot(barberId, slotId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'availability'] });
      toast({
        title: 'Availability slot deleted',
        status: 'success',
        duration: 3000,
      });
      onDeleteClose();
      setDeletingSlot(null);
    },
    onError: (error: any) => {
      toast({
        title: 'Error deleting slot',
        description: error.message,
        status: 'error',
        duration: 5000,
      });
    },
  });

  const handleCreate = (barberId?: string) => {
    reset({
      barberId: barberId || barbers?.[0]?.id || '',
      dayOfWeek: 1,
      startTime: '09:00',
      endTime: '17:00',
      isActive: true,
    });
    onOpen();
  };

  const handleDelete = (slot: AvailabilitySlot) => {
    setDeletingSlot(slot);
    onDeleteOpen();
  };

  const onSubmit = (data: SlotFormData) => {
    const { barberId, ...slotData } = data;
    createSlotMutation.mutate({ barberId, slot: slotData });
  };

  if (isLoading) {
    return (
      <Center h="400px">
        <Spinner size="xl" color="blue.500" />
      </Center>
    );
  }

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={6}>
        <Heading>Availability Management</Heading>
        <Button
          leftIcon={<AddIcon />}
          colorScheme="blue"
          onClick={() => handleCreate()}
        >
          Add Availability Slot
        </Button>
      </Box>

      <Tabs>
        <TabList>
          {calendars?.map((calendar) => (
            <Tab key={calendar.barberId}>{calendar.barberName || calendar.barberId}</Tab>
          ))}
        </TabList>

        <TabPanels>
          {calendars?.map((calendar) => (
            <TabPanel key={calendar.barberId}>
              <Box mb={4}>
                <Button
                  size="sm"
                  leftIcon={<AddIcon />}
                  colorScheme="blue"
                  onClick={() => handleCreate(calendar.barberId)}
                >
                  Add Slot for {calendar.barberName}
                </Button>
              </Box>

              <Box bg={tableBg} borderRadius="lg" boxShadow="md" overflowX="auto">
                <Table variant="simple">
                  <Thead>
                    <Tr>
                      <Th>Day</Th>
                      <Th>Start Time</Th>
                      <Th>End Time</Th>
                      <Th>Status</Th>
                      <Th>Actions</Th>
                    </Tr>
                  </Thead>
                  <Tbody>
                    {calendar.slots.length === 0 ? (
                      <Tr>
                        <Td colSpan={5} textAlign="center" color="gray.500">
                          No availability slots configured
                        </Td>
                      </Tr>
                    ) : (
                      calendar.slots.map((slot) => (
                        <Tr key={slot.id}>
                          <Td fontWeight="medium">{DAYS_OF_WEEK[slot.dayOfWeek]}</Td>
                          <Td>{slot.startTime}</Td>
                          <Td>{slot.endTime}</Td>
                          <Td>
                            <Badge colorScheme={slot.isActive ? 'green' : 'gray'}>
                              {slot.isActive ? 'Active' : 'Inactive'}
                            </Badge>
                          </Td>
                          <Td>
                            <IconButton
                              aria-label="Delete slot"
                              icon={<DeleteIcon />}
                              size="sm"
                              colorScheme="red"
                              onClick={() => handleDelete(slot)}
                            />
                          </Td>
                        </Tr>
                      ))
                    )}
                  </Tbody>
                </Table>
              </Box>
            </TabPanel>
          ))}
        </TabPanels>
      </Tabs>

      {/* Create Modal */}
      <Modal isOpen={isOpen} onClose={onClose} size="lg">
        <ModalOverlay />
        <ModalContent>
          <form onSubmit={handleSubmit(onSubmit)}>
            <ModalHeader>Create Availability Slot</ModalHeader>
            <ModalCloseButton />
            <ModalBody>
              <Stack spacing={4}>
                <FormControl isInvalid={!!errors.barberId}>
                  <FormLabel>Barber</FormLabel>
                  <Select {...register('barberId')}>
                    {barbers?.map((barber) => (
                      <option key={barber.id} value={barber.id}>
                        {barber.name}
                      </option>
                    ))}
                  </Select>
                  {errors.barberId && (
                    <Box color="red.500" fontSize="sm" mt={1}>
                      {errors.barberId.message}
                    </Box>
                  )}
                </FormControl>

                <FormControl isInvalid={!!errors.dayOfWeek}>
                  <FormLabel>Day of Week</FormLabel>
                  <Select {...register('dayOfWeek', { valueAsNumber: true })}>
                    {DAYS_OF_WEEK.map((day, index) => (
                      <option key={index} value={index}>
                        {day}
                      </option>
                    ))}
                  </Select>
                  {errors.dayOfWeek && (
                    <Box color="red.500" fontSize="sm" mt={1}>
                      {errors.dayOfWeek.message}
                    </Box>
                  )}
                </FormControl>

                <FormControl isInvalid={!!errors.startTime}>
                  <FormLabel>Start Time</FormLabel>
                  <Input type="time" {...register('startTime')} />
                  {errors.startTime && (
                    <Box color="red.500" fontSize="sm" mt={1}>
                      {errors.startTime.message}
                    </Box>
                  )}
                </FormControl>

                <FormControl isInvalid={!!errors.endTime}>
                  <FormLabel>End Time</FormLabel>
                  <Input type="time" {...register('endTime')} />
                  {errors.endTime && (
                    <Box color="red.500" fontSize="sm" mt={1}>
                      {errors.endTime.message}
                    </Box>
                  )}
                </FormControl>

                <FormControl display="flex" alignItems="center">
                  <FormLabel mb="0">Active</FormLabel>
                  <Switch {...register('isActive')} />
                </FormControl>
              </Stack>
            </ModalBody>

            <ModalFooter>
              <Button variant="ghost" mr={3} onClick={onClose}>
                Cancel
              </Button>
              <Button
                type="submit"
                colorScheme="blue"
                isLoading={createSlotMutation.isPending}
              >
                Create
              </Button>
            </ModalFooter>
          </form>
        </ModalContent>
      </Modal>

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        isOpen={isDeleteOpen}
        leastDestructiveRef={cancelRef}
        onClose={onDeleteClose}
      >
        <AlertDialogOverlay>
          <AlertDialogContent>
            <AlertDialogHeader fontSize="lg" fontWeight="bold">
              Delete Availability Slot
            </AlertDialogHeader>

            <AlertDialogBody>
              Are you sure you want to delete this availability slot? This action
              cannot be undone.
            </AlertDialogBody>

            <AlertDialogFooter>
              <Button ref={cancelRef} onClick={onDeleteClose}>
                Cancel
              </Button>
              <Button
                colorScheme="red"
                onClick={() =>
                  deletingSlot &&
                  deleteSlotMutation.mutate({
                    barberId: deletingSlot.barberId,
                    slotId: deletingSlot.id,
                  })
                }
                ml={3}
                isLoading={deleteSlotMutation.isPending}
              >
                Delete
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialogOverlay>
      </AlertDialog>
    </Box>
  );
}

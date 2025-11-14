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
  Textarea,
  NumberInput,
  NumberInputField,
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
} from '@chakra-ui/react';
import { EditIcon, DeleteIcon, AddIcon } from '@chakra-ui/icons';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ProtectedRoute } from '@/components/admin/ProtectedRoute';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { adminApiClient } from '@/lib/admin-api-client';
import { Service } from '@/types/booking';
import { ServiceFormData } from '@/types/admin';
import { useRef } from 'react';

const serviceSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().min(1, 'Description is required'),
  price: z.number().min(0, 'Price must be positive'),
  durationMinutes: z.number().min(1, 'Duration must be at least 1 minute'),
  icon: z.string().optional(),
});

export default function ServicesPage() {
  return (
    <ProtectedRoute>
      <AdminLayout>
        <ServicesContent />
      </AdminLayout>
    </ProtectedRoute>
  );
}

function ServicesContent() {
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [deletingService, setDeletingService] = useState<Service | null>(null);
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

  const { data: services, isLoading } = useQuery({
    queryKey: ['admin', 'services'],
    queryFn: () => adminApiClient.getServices(),
  });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
    setValue,
  } = useForm<ServiceFormData>({
    resolver: zodResolver(serviceSchema),
  });

  const createMutation = useMutation({
    mutationFn: (data: ServiceFormData) => adminApiClient.createService(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'services'] });
      toast({
        title: 'Service created',
        status: 'success',
        duration: 3000,
      });
      onClose();
      reset();
    },
    onError: (error: any) => {
      toast({
        title: 'Error creating service',
        description: error.message,
        status: 'error',
        duration: 5000,
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: ServiceFormData }) =>
      adminApiClient.updateService(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'services'] });
      toast({
        title: 'Service updated',
        status: 'success',
        duration: 3000,
      });
      onClose();
      reset();
      setEditingService(null);
    },
    onError: (error: any) => {
      toast({
        title: 'Error updating service',
        description: error.message,
        status: 'error',
        duration: 5000,
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => adminApiClient.deleteService(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'services'] });
      toast({
        title: 'Service deleted',
        status: 'success',
        duration: 3000,
      });
      onDeleteClose();
      setDeletingService(null);
    },
    onError: (error: any) => {
      toast({
        title: 'Error deleting service',
        description: error.message,
        status: 'error',
        duration: 5000,
      });
    },
  });

  const handleCreate = () => {
    setEditingService(null);
    reset({
      name: '',
      description: '',
      price: 0,
      durationMinutes: 30,
      icon: '',
    });
    onOpen();
  };

  const handleEdit = (service: Service) => {
    setEditingService(service);
    reset({
      name: service.name,
      description: service.description,
      price: service.price,
      durationMinutes: service.durationMinutes,
      icon: service.icon || '',
    });
    onOpen();
  };

  const handleDelete = (service: Service) => {
    setDeletingService(service);
    onDeleteOpen();
  };

  const onSubmit = (data: ServiceFormData) => {
    if (editingService) {
      updateMutation.mutate({ id: editingService.id, data });
    } else {
      createMutation.mutate(data);
    }
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
        <Heading>Services Management</Heading>
        <Button
          leftIcon={<AddIcon />}
          colorScheme="blue"
          onClick={handleCreate}
        >
          Add Service
        </Button>
      </Box>

      <Box bg={tableBg} borderRadius="lg" boxShadow="md" overflowX="auto">
        <Table variant="simple">
          <Thead>
            <Tr>
              <Th>Name</Th>
              <Th>Description</Th>
              <Th isNumeric>Price</Th>
              <Th isNumeric>Duration (min)</Th>
              <Th>Actions</Th>
            </Tr>
          </Thead>
          <Tbody>
            {services?.map((service) => (
              <Tr key={service.id}>
                <Td fontWeight="medium">{service.name}</Td>
                <Td>{service.description}</Td>
                <Td isNumeric>${service.price.toFixed(2)}</Td>
                <Td isNumeric>{service.durationMinutes}</Td>
                <Td>
                  <IconButton
                    aria-label="Edit service"
                    icon={<EditIcon />}
                    size="sm"
                    mr={2}
                    onClick={() => handleEdit(service)}
                  />
                  <IconButton
                    aria-label="Delete service"
                    icon={<DeleteIcon />}
                    size="sm"
                    colorScheme="red"
                    onClick={() => handleDelete(service)}
                  />
                </Td>
              </Tr>
            ))}
          </Tbody>
        </Table>
      </Box>

      {/* Create/Edit Modal */}
      <Modal isOpen={isOpen} onClose={onClose} size="lg">
        <ModalOverlay />
        <ModalContent>
          <form onSubmit={handleSubmit(onSubmit)}>
            <ModalHeader>
              {editingService ? 'Edit Service' : 'Create Service'}
            </ModalHeader>
            <ModalCloseButton />
            <ModalBody>
              <Stack spacing={4}>
                <FormControl isInvalid={!!errors.name}>
                  <FormLabel>Name</FormLabel>
                  <Input {...register('name')} />
                  {errors.name && (
                    <Box color="red.500" fontSize="sm" mt={1}>
                      {errors.name.message}
                    </Box>
                  )}
                </FormControl>

                <FormControl isInvalid={!!errors.description}>
                  <FormLabel>Description</FormLabel>
                  <Textarea {...register('description')} />
                  {errors.description && (
                    <Box color="red.500" fontSize="sm" mt={1}>
                      {errors.description.message}
                    </Box>
                  )}
                </FormControl>

                <FormControl isInvalid={!!errors.price}>
                  <FormLabel>Price ($)</FormLabel>
                  <NumberInput min={0} step={0.01}>
                    <NumberInputField
                      {...register('price', { valueAsNumber: true })}
                    />
                  </NumberInput>
                  {errors.price && (
                    <Box color="red.500" fontSize="sm" mt={1}>
                      {errors.price.message}
                    </Box>
                  )}
                </FormControl>

                <FormControl isInvalid={!!errors.durationMinutes}>
                  <FormLabel>Duration (minutes)</FormLabel>
                  <NumberInput min={1}>
                    <NumberInputField
                      {...register('durationMinutes', { valueAsNumber: true })}
                    />
                  </NumberInput>
                  {errors.durationMinutes && (
                    <Box color="red.500" fontSize="sm" mt={1}>
                      {errors.durationMinutes.message}
                    </Box>
                  )}
                </FormControl>

                <FormControl>
                  <FormLabel>Icon (optional)</FormLabel>
                  <Input {...register('icon')} placeholder="e.g., ✂️" />
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
                isLoading={createMutation.isPending || updateMutation.isPending}
              >
                {editingService ? 'Update' : 'Create'}
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
              Delete Service
            </AlertDialogHeader>

            <AlertDialogBody>
              Are you sure you want to delete &quot;{deletingService?.name}&quot;? This action
              cannot be undone.
            </AlertDialogBody>

            <AlertDialogFooter>
              <Button ref={cancelRef} onClick={onDeleteClose}>
                Cancel
              </Button>
              <Button
                colorScheme="red"
                onClick={() => deletingService && deleteMutation.mutate(deletingService.id)}
                ml={3}
                isLoading={deleteMutation.isPending}
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

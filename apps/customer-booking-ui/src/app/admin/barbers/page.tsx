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
  Avatar,
  Badge,
} from '@chakra-ui/react';
import { EditIcon, DeleteIcon, AddIcon } from '@chakra-ui/icons';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ProtectedRoute } from '@/components/admin/ProtectedRoute';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { adminApiClient } from '@/lib/admin-api-client';
import { Barber } from '@/types/booking';
import { BarberFormData } from '@/types/admin';

const barberSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  rating: z.number().min(0).max(5, 'Rating must be between 0 and 5'),
  avatar: z.string().optional(),
  bio: z.string().optional(),
});

export default function BarbersPage() {
  return (
    <ProtectedRoute>
      <AdminLayout>
        <BarbersContent />
      </AdminLayout>
    </ProtectedRoute>
  );
}

function BarbersContent() {
  const [editingBarber, setEditingBarber] = useState<Barber | null>(null);
  const [deletingBarber, setDeletingBarber] = useState<Barber | null>(null);
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

  const { data: barbers, isLoading } = useQuery({
    queryKey: ['admin', 'barbers'],
    queryFn: () => adminApiClient.getBarbers(),
  });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<BarberFormData>({
    resolver: zodResolver(barberSchema),
  });

  const createMutation = useMutation({
    mutationFn: (data: BarberFormData) => adminApiClient.createBarber(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'barbers'] });
      toast({
        title: 'Barber created',
        status: 'success',
        duration: 3000,
      });
      onClose();
      reset();
    },
    onError: (error: any) => {
      toast({
        title: 'Error creating barber',
        description: error.message,
        status: 'error',
        duration: 5000,
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: BarberFormData }) =>
      adminApiClient.updateBarber(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'barbers'] });
      toast({
        title: 'Barber updated',
        status: 'success',
        duration: 3000,
      });
      onClose();
      reset();
      setEditingBarber(null);
    },
    onError: (error: any) => {
      toast({
        title: 'Error updating barber',
        description: error.message,
        status: 'error',
        duration: 5000,
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => adminApiClient.deleteBarber(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'barbers'] });
      toast({
        title: 'Barber deleted',
        status: 'success',
        duration: 3000,
      });
      onDeleteClose();
      setDeletingBarber(null);
    },
    onError: (error: any) => {
      toast({
        title: 'Error deleting barber',
        description: error.message,
        status: 'error',
        duration: 5000,
      });
    },
  });

  const handleCreate = () => {
    setEditingBarber(null);
    reset({
      name: '',
      rating: 5,
      avatar: '',
      bio: '',
    });
    onOpen();
  };

  const handleEdit = (barber: Barber) => {
    setEditingBarber(barber);
    reset({
      name: barber.name,
      rating: barber.rating,
      avatar: barber.avatar || '',
      bio: barber.bio || '',
    });
    onOpen();
  };

  const handleDelete = (barber: Barber) => {
    setDeletingBarber(barber);
    onDeleteOpen();
  };

  const onSubmit = (data: BarberFormData) => {
    if (editingBarber) {
      updateMutation.mutate({ id: editingBarber.id, data });
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
        <Heading>Barbers Management</Heading>
        <Button
          leftIcon={<AddIcon />}
          colorScheme="blue"
          onClick={handleCreate}
        >
          Add Barber
        </Button>
      </Box>

      <Box bg={tableBg} borderRadius="lg" boxShadow="md" overflowX="auto">
        <Table variant="simple">
          <Thead>
            <Tr>
              <Th>Barber</Th>
              <Th>Rating</Th>
              <Th>Bio</Th>
              <Th>Actions</Th>
            </Tr>
          </Thead>
          <Tbody>
            {barbers?.map((barber) => (
              <Tr key={barber.id}>
                <Td>
                  <Box display="flex" alignItems="center" gap={3}>
                    <Avatar size="sm" name={barber.name} src={barber.avatar} />
                    <Box fontWeight="medium">{barber.name}</Box>
                  </Box>
                </Td>
                <Td>
                  <Badge colorScheme="yellow">
                    ⭐ {barber.rating.toFixed(1)}
                  </Badge>
                </Td>
                <Td maxW="300px" isTruncated>
                  {barber.bio || '-'}
                </Td>
                <Td>
                  <IconButton
                    aria-label="Edit barber"
                    icon={<EditIcon />}
                    size="sm"
                    mr={2}
                    onClick={() => handleEdit(barber)}
                  />
                  <IconButton
                    aria-label="Delete barber"
                    icon={<DeleteIcon />}
                    size="sm"
                    colorScheme="red"
                    onClick={() => handleDelete(barber)}
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
              {editingBarber ? 'Edit Barber' : 'Create Barber'}
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

                <FormControl isInvalid={!!errors.rating}>
                  <FormLabel>Rating</FormLabel>
                  <NumberInput min={0} max={5} step={0.1}>
                    <NumberInputField
                      {...register('rating', { valueAsNumber: true })}
                    />
                  </NumberInput>
                  {errors.rating && (
                    <Box color="red.500" fontSize="sm" mt={1}>
                      {errors.rating.message}
                    </Box>
                  )}
                </FormControl>

                <FormControl>
                  <FormLabel>Avatar URL (optional)</FormLabel>
                  <Input {...register('avatar')} placeholder="https://..." />
                </FormControl>

                <FormControl>
                  <FormLabel>Bio (optional)</FormLabel>
                  <Textarea {...register('bio')} />
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
                {editingBarber ? 'Update' : 'Create'}
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
              Delete Barber
            </AlertDialogHeader>

            <AlertDialogBody>
              Are you sure you want to delete &quot;{deletingBarber?.name}&quot;? This action
              cannot be undone.
            </AlertDialogBody>

            <AlertDialogFooter>
              <Button ref={cancelRef} onClick={onDeleteClose}>
                Cancel
              </Button>
              <Button
                colorScheme="red"
                onClick={() => deletingBarber && deleteMutation.mutate(deletingBarber.id)}
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

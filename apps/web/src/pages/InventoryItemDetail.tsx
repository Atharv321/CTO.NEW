import React, { useState } from 'react';
import {
  Container,
  Paper,
  Group,
  Button,
  Stack,
  Badge,
  Text,
  Grid,
  Card,
  Loader,
  Center,
  Tabs,
  ActionIcon,
  Table,
  Modal,
  TextInput,
  Select,
  Textarea,
  NumberInput,
  Alert,
} from '@mantine/core';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuthStore } from '@/stores/useAuthStore';
import { inventoryService } from '@/services/inventoryService';
import { InventoryItem, StockLevel, StockMovement } from '@/types';
import {
  IconArrowLeft,
  IconEdit,
  IconTrendingUp,
  IconTrendingDown,
  IconAlertCircle,
} from '@tabler/icons-react';
import { notifications } from '@mantine/notifications';
import { ScanningEntry } from '@/components/inventory/ScanningEntry';
import { SupplierLink } from '@/components/inventory/SupplierLink';

type StockMovementType = 'inbound' | 'outbound' | 'adjustment' | 'scanned_entry' | 'return';

interface StockMovementFormData {
  quantity: number;
  movementType: StockMovementType;
  notes?: string;
  locationId: string;
}

export const InventoryItemDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const user = useAuthStore((state) => state.user);

  const isManager = user?.role === 'manager' || user?.role === 'admin';
  const isAdmin = user?.role === 'admin';

  const [selectedLocationId, setSelectedLocationId] = useState<string | null>(null);
  const [showMovementModal, setShowMovementModal] = useState(false);
  const [movementForm, setMovementForm] = useState<StockMovementFormData>({
    quantity: 0,
    movementType: 'adjustment',
    locationId: '',
    notes: '',
  });

  // Fetch item details
  const {
    data: item,
    isLoading: itemLoading,
    error: itemError,
  } = useQuery({
    queryKey: ['item', id],
    queryFn: () => inventoryService.getItemById(id!),
    staleTime: 5 * 60 * 1000,
  });

  // Fetch stock levels
  const { data: stockLevels = [] } = useQuery({
    queryKey: ['stockByItem', id],
    queryFn: () => inventoryService.getStockByItem(id!),
    enabled: !!id,
    staleTime: 2 * 60 * 1000,
  });

  // Fetch stock movement history for selected location
  const {
    data: movementHistory,
    isLoading: historyLoading,
  } = useQuery({
    queryKey: ['stockMovements', id, selectedLocationId],
    queryFn: () =>
      selectedLocationId
        ? inventoryService.getStockMovementHistory(id!, selectedLocationId)
        : Promise.resolve({ items: [], total: 0, page: 1, limit: 10, hasMore: false }),
    enabled: !!selectedLocationId,
  });

  // Fetch locations for dropdown
  const { data: locationsData } = useQuery({
    queryKey: ['locations', 'all'],
    queryFn: () => inventoryService.getLocations(1, 100),
    staleTime: 10 * 60 * 1000,
  });

  // Mutation for stock adjustment
  const adjustStockMutation = useMutation({
    mutationFn: async (data: StockMovementFormData) => {
      return inventoryService.adjustStock(id!, data.locationId, {
        quantity: data.quantity,
        movementType: data.movementType,
        notes: data.notes,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stockByItem', id] });
      queryClient.invalidateQueries({ queryKey: ['stockMovements', id, selectedLocationId] });
      setShowMovementModal(false);
      setMovementForm({
        quantity: 0,
        movementType: 'adjustment',
        locationId: '',
        notes: '',
      });
      notifications.show({
        title: 'Success',
        message: 'Stock movement recorded successfully',
        color: 'green',
      });
    },
    onError: (error: any) => {
      notifications.show({
        title: 'Error',
        message: error.message || 'Failed to record stock movement',
        color: 'red',
      });
    },
  });

  if (itemError) {
    return (
      <Container size="lg" py="xl">
        <Paper p="md" withBorder>
          <Alert icon={<IconAlertCircle size={16} />} color="red">
            Error loading item: {(itemError as any).message}
          </Alert>
        </Paper>
      </Container>
    );
  }

  if (itemLoading) {
    return (
      <Center py={40}>
        <Loader />
      </Center>
    );
  }

  if (!item) {
    return (
      <Container size="lg" py="xl">
        <Alert icon={<IconAlertCircle size={16} />} color="yellow">
          Item not found
        </Alert>
      </Container>
    );
  }

  const currentStock = selectedLocationId
    ? stockLevels.find((s: StockLevel) => String(s.locationId) === selectedLocationId)
    : null;

  const movements = movementHistory?.items || [];

  return (
    <Container size="lg" py="xl">
      <Stack spacing="lg">
        <Group position="apart">
          <Group spacing="xs">
            <ActionIcon variant="light" onClick={() => navigate('/inventory/items')}>
              <IconArrowLeft size={18} />
            </ActionIcon>
            <div>
              <h1>{item.name}</h1>
              <Text color="dimmed">{item.sku}</Text>
            </div>
          </Group>
          {isManager && (
            <Button
              component={Link}
              to={`/inventory/items/${id}/edit`}
              leftIcon={<IconEdit size={18} />}
              variant="light"
            >
              Edit
            </Button>
          )}
        </Group>

        <Grid>
          <Grid.Col span={12} sm={6}>
            <Card withBorder>
              <Stack spacing="md">
                <div>
                  <Text size="sm" color="dimmed">
                    SKU
                  </Text>
                  <Text weight={500}>{item.sku}</Text>
                </div>
                <div>
                  <Text size="sm" color="dimmed">
                    Barcode
                  </Text>
                  <Badge>{item.barcode}</Badge>
                </div>
                <div>
                  <Text size="sm" color="dimmed">
                    Price
                  </Text>
                  <Text weight={500}>${item.price.toFixed(2)}</Text>
                </div>
              </Stack>
            </Card>
          </Grid.Col>

          <Grid.Col span={12} sm={6}>
            <SupplierLink supplierId={item.supplierId} />
          </Grid.Col>
        </Grid>

        <Grid>
          <Grid.Col span={12} sm={6}>
            <Card withBorder>
              <Stack spacing="md">
                {item.description && (
                  <div>
                    <Text size="sm" color="dimmed">
                      Description
                    </Text>
                    <Text>{item.description}</Text>
                  </div>
                )}
                <div>
                  <Text size="sm" color="dimmed">
                    Created
                  </Text>
                  <Text size="sm">{item.createdAt ? new Date(item.createdAt).toLocaleDateString() : 'N/A'}</Text>
                </div>
                <div>
                  <Text size="sm" color="dimmed">
                    Updated
                  </Text>
                  <Text size="sm">{item.updatedAt ? new Date(item.updatedAt).toLocaleDateString() : 'N/A'}</Text>
                </div>
              </Stack>
            </Card>
          </Grid.Col>

          <Grid.Col span={12} sm={6}>
            <ScanningEntry locationId={selectedLocationId} />
          </Grid.Col>
        </Grid>

        <Tabs defaultValue="stock">
          <Tabs.List>
            <Tabs.Tab value="stock">Stock Levels</Tabs.Tab>
            <Tabs.Tab value="movements">Movement History</Tabs.Tab>
          </Tabs.List>

          <Tabs.Panel value="stock" pt="md">
            <Stack spacing="md">
              {stockLevels.length === 0 ? (
                <Alert icon={<IconAlertCircle size={16} />}>
                  No stock levels configured for this item
                </Alert>
              ) : (
                <Grid>
                  {stockLevels.map((stock: StockLevel) => (
                    <Grid.Col key={stock.id} span={12} sm={6}>
                      <Card
                        withBorder
                        p="md"
                        onClick={() => setSelectedLocationId(String(stock.locationId))}
                        style={{
                          cursor: 'pointer',
                          backgroundColor:
                            String(stock.locationId) === selectedLocationId
                              ? 'rgba(59, 130, 246, 0.05)'
                              : 'transparent',
                          borderColor:
                            String(stock.locationId) === selectedLocationId
                              ? 'rgb(59, 130, 246)'
                              : undefined,
                        }}
                      >
                        <Stack spacing="sm">
                          <Text weight={500}>Location {stock.locationId}</Text>
                          <Group position="apart">
                            <div>
                              <Text size="sm" color="dimmed">
                                Current Quantity
                              </Text>
                              <Text size="lg" weight={500}>
                                {stock.quantity}
                              </Text>
                            </div>
                            {stock.reorderLevel && (
                              <div>
                                <Text size="sm" color="dimmed">
                                  Reorder Level
                                </Text>
                                <Text size="sm">{stock.reorderLevel}</Text>
                              </div>
                            )}
                          </Group>
                          {stock.quantity < (stock.reorderLevel || 0) && (
                            <Alert
                              icon={<IconAlertCircle size={14} />}
                              color="yellow"
                              p="xs"
                            >
                              Low stock warning
                            </Alert>
                          )}
                        </Stack>
                      </Card>
                    </Grid.Col>
                  ))}
                </Grid>
              )}
            </Stack>
          </Tabs.Panel>

          <Tabs.Panel value="movements" pt="md">
            <Stack spacing="md">
              {stockLevels.length === 0 ? (
                <Alert icon={<IconAlertCircle size={16} />}>
                  Select a stock location to view movement history
                </Alert>
              ) : !selectedLocationId ? (
                <Alert icon={<IconAlertCircle size={16} />}>
                  Please select a location from the stock levels section
                </Alert>
              ) : (
                <>
                  <Group position="apart">
                    <div>
                      <Text weight={500}>Movement History</Text>
                      <Text size="sm" color="dimmed">
                        Location {selectedLocationId}
                      </Text>
                    </div>
                    {isManager && (
                      <Button
                        onClick={() => {
                          setMovementForm((prev) => ({
                            ...prev,
                            locationId: selectedLocationId,
                          }));
                          setShowMovementModal(true);
                        }}
                        leftIcon={<IconTrendingUp size={18} />}
                      >
                        Record Movement
                      </Button>
                    )}
                  </Group>

                  {historyLoading ? (
                    <Center py={40}>
                      <Loader />
                    </Center>
                  ) : movements.length === 0 ? (
                    <Alert icon={<IconAlertCircle size={16} />}>
                      No movement history for this location
                    </Alert>
                  ) : (
                    <Paper withBorder>
                      <Table striped highlightOnHover size="sm">
                        <Table.Thead>
                          <Table.Tr>
                            <Table.Th>Type</Table.Th>
                            <Table.Th>Quantity</Table.Th>
                            <Table.Th>Notes</Table.Th>
                            <Table.Th>Recorded By</Table.Th>
                            <Table.Th>Date</Table.Th>
                          </Table.Tr>
                        </Table.Thead>
                        <Table.Tbody>
                          {movements.map((movement: StockMovement) => (
                            <Table.Tr key={movement.id}>
                              <Table.Td>
                                <Badge size="sm" variant="light">
                                  {movement.movementType}
                                </Badge>
                              </Table.Td>
                              <Table.Td>
                                <Group spacing={4}>
                                  {movement.movementType === 'inbound' ? (
                                    <IconTrendingUp size={16} color="green" />
                                  ) : (
                                    <IconTrendingDown size={16} color="red" />
                                  )}
                                  {movement.quantity}
                                </Group>
                              </Table.Td>
                              <Table.Td>{movement.notes || '-'}</Table.Td>
                              <Table.Td>{movement.adjustedBy || '-'}</Table.Td>
                              <Table.Td>
                                {movement.createdAt
                                  ? new Date(movement.createdAt).toLocaleDateString()
                                  : '-'}
                              </Table.Td>
                            </Table.Tr>
                          ))}
                        </Table.Tbody>
                      </Table>
                    </Paper>
                  )}
                </>
              )}
            </Stack>
          </Tabs.Panel>
        </Tabs>
      </Stack>

      <Modal
        opened={showMovementModal}
        onClose={() => setShowMovementModal(false)}
        title="Record Stock Movement"
        size="md"
      >
        <Stack spacing="md">
          <NumberInput
            label="Quantity"
            placeholder="Enter quantity"
            required
            value={movementForm.quantity}
            onChange={(value) =>
              setMovementForm((prev) => ({
                ...prev,
                quantity: value || 0,
              }))
            }
          />

          <Select
            label="Movement Type"
            placeholder="Select movement type"
            required
            data={[
              { value: 'inbound', label: 'Inbound' },
              { value: 'outbound', label: 'Outbound' },
              { value: 'adjustment', label: 'Adjustment' },
              { value: 'scanned_entry', label: 'Scanned Entry (Placeholder)' },
              { value: 'return', label: 'Return' },
            ]}
            value={movementForm.movementType}
            onChange={(value) =>
              setMovementForm((prev) => ({
                ...prev,
                movementType: (value as StockMovementType) || 'adjustment',
              }))
            }
          />

          <Textarea
            label="Notes"
            placeholder="Add optional notes"
            value={movementForm.notes || ''}
            onChange={(e) =>
              setMovementForm((prev) => ({
                ...prev,
                notes: e.currentTarget.value,
              }))
            }
          />

          <Group position="right" mt="md">
            <Button variant="light" onClick={() => setShowMovementModal(false)}>
              Cancel
            </Button>
            <Button
              loading={adjustStockMutation.isPending}
              onClick={() => adjustStockMutation.mutate(movementForm)}
            >
              Record Movement
            </Button>
          </Group>
        </Stack>
      </Modal>
    </Container>
  );
};

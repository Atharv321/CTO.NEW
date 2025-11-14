import React, { useState } from 'react';
import {
  Grid,
  Card,
  Text,
  Badge,
  Stack,
  Group,
  Button,
  Alert,
  Loader,
  Center,
  Select,
  Paper,
  Table,
} from '@mantine/core';
import { useQuery } from '@tanstack/react-query';
import {
  IconAlertCircle,
  IconMapPin,
  IconPackage,
  IconTrendingUp,
} from '@tabler/icons-react';
import { inventoryService } from '@/services/inventoryService';
import { StockLevel, InventoryLocation } from '@/types';

interface MultiLocationStockViewProps {
  itemId: string | number;
  onLocationSelect?: (locationId: string | number) => void;
  selectedLocationId?: string | number | null;
  isLoading?: boolean;
}

export const MultiLocationStockView: React.FC<MultiLocationStockViewProps> = ({
  itemId,
  onLocationSelect,
  selectedLocationId,
  isLoading = false,
}) => {
  const [filterBelowReorder, setFilterBelowReorder] = useState(false);

  // Fetch stock levels for all locations
  const { data: stockLevels = [], isLoading: stockLoading } = useQuery({
    queryKey: ['stockByItem', itemId],
    queryFn: () => inventoryService.getStockByItem(itemId),
  });

  // Fetch locations metadata
  const { data: locationsData } = useQuery({
    queryKey: ['locations', 'all'],
    queryFn: () => inventoryService.getLocations(1, 100),
  });

  const locations = locationsData?.items || [];
  const locationMap = new Map(locations.map((l: InventoryLocation) => [l.id, l]));

  const filteredStock = filterBelowReorder
    ? stockLevels.filter(
        (stock: StockLevel) => stock.quantity < (stock.reorderLevel || 0)
      )
    : stockLevels;

  const totalQuantity = stockLevels.reduce(
    (sum: number, stock: StockLevel) => sum + stock.quantity,
    0
  );

  const lowStockCount = stockLevels.filter(
    (stock: StockLevel) => stock.quantity < (stock.reorderLevel || 0)
  ).length;

  if (stockLoading || isLoading) {
    return (
      <Center py={40}>
        <Loader />
      </Center>
    );
  }

  if (stockLevels.length === 0) {
    return (
      <Alert icon={<IconAlertCircle size={16} />}>
        No stock levels configured across locations
      </Alert>
    );
  }

  return (
    <Stack spacing="md">
      {/* Summary Cards */}
      <Grid>
        <Grid.Col span={12} sm={6} md={4}>
          <Card withBorder>
            <Stack spacing="xs">
              <Group position="apart">
                <Text size="sm" color="dimmed">
                  Total Quantity
                </Text>
                <IconPackage size={18} color="blue" />
              </Group>
              <Text size="lg" weight={500}>
                {totalQuantity}
              </Text>
              <Text size="xs" color="dimmed">
                Across {stockLevels.length} locations
              </Text>
            </Stack>
          </Card>
        </Grid.Col>

        <Grid.Col span={12} sm={6} md={4}>
          <Card withBorder>
            <Stack spacing="xs">
              <Group position="apart">
                <Text size="sm" color="dimmed">
                  Low Stock Items
                </Text>
                <IconAlertCircle size={18} color="red" />
              </Group>
              <Text size="lg" weight={500} color={lowStockCount > 0 ? 'red' : 'green'}>
                {lowStockCount}
              </Text>
              <Text size="xs" color="dimmed">
                Below reorder level
              </Text>
            </Stack>
          </Card>
        </Grid.Col>

        <Grid.Col span={12} sm={6} md={4}>
          <Card withBorder>
            <Stack spacing="xs">
              <Group position="apart">
                <Text size="sm" color="dimmed">
                  Locations
                </Text>
                <IconMapPin size={18} color="green" />
              </Group>
              <Text size="lg" weight={500}>
                {stockLevels.length}
              </Text>
              <Text size="xs" color="dimmed">
                Stocking points
              </Text>
            </Stack>
          </Card>
        </Grid.Col>
      </Grid>

      {/* Filters */}
      <Paper p="md" withBorder>
        <Group>
          <Button
            variant={filterBelowReorder ? 'filled' : 'light'}
            onClick={() => setFilterBelowReorder(!filterBelowReorder)}
            size="sm"
          >
            {filterBelowReorder ? 'Showing Low Stock' : 'Show Low Stock Only'}
          </Button>
        </Group>
      </Paper>

      {/* Stock Table */}
      <Paper withBorder>
        <Table striped highlightOnHover>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Location</Table.Th>
              <Table.Th>Current Qty</Table.Th>
              <Table.Th>Reorder Level</Table.Th>
              <Table.Th>Status</Table.Th>
              <Table.Th>Action</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {filteredStock.map((stock: StockLevel) => {
              const location = locationMap.get(stock.locationId);
              const isLow = stock.quantity < (stock.reorderLevel || 0);
              const isSelected =
                String(stock.locationId) === String(selectedLocationId);

              return (
                <Table.Tr
                  key={stock.id}
                  style={{
                    backgroundColor: isSelected
                      ? 'rgba(59, 130, 246, 0.05)'
                      : 'transparent',
                  }}
                >
                  <Table.Td>
                    <Group spacing="sm">
                      <IconMapPin size={16} />
                      <div>
                        <Text weight={500} size="sm">
                          {location?.name || `Location ${stock.locationId}`}
                        </Text>
                        <Text size="xs" color="dimmed">
                          ID: {stock.locationId}
                        </Text>
                      </div>
                    </Group>
                  </Table.Td>
                  <Table.Td>
                    <Text weight={500}>{stock.quantity}</Text>
                  </Table.Td>
                  <Table.Td>
                    <Text size="sm">{stock.reorderLevel || '-'}</Text>
                  </Table.Td>
                  <Table.Td>
                    {isLow ? (
                      <Badge color="red" size="sm">
                        Low Stock
                      </Badge>
                    ) : (
                      <Badge color="green" size="sm">
                        In Stock
                      </Badge>
                    )}
                  </Table.Td>
                  <Table.Td>
                    <Button
                      variant={isSelected ? 'filled' : 'light'}
                      size="xs"
                      onClick={() => onLocationSelect?.(stock.locationId)}
                    >
                      {isSelected ? 'Selected' : 'View Details'}
                    </Button>
                  </Table.Td>
                </Table.Tr>
              );
            })}
          </Table.Tbody>
        </Table>
      </Paper>

      {filteredStock.length === 0 && filterBelowReorder && (
        <Alert icon={<IconAlertCircle size={16} />} color="green">
          Great! No items below reorder level
        </Alert>
      )}
    </Stack>
  );
};

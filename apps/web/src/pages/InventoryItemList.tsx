import React, { useState } from 'react';
import {
  Container,
  Paper,
  Group,
  Button,
  TextInput,
  Select,
  Stack,
  Pagination,
  Table,
  Badge,
  ActionIcon,
  Loader,
  Center,
  Text,
  Grid,
  Card,
} from '@mantine/core';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { useAuthStore } from '@/stores/useAuthStore';
import { inventoryService } from '@/services/inventoryService';
import { InventoryItem, InventoryItemFilters, Category } from '@/types';
import { IconSearch, IconPlus, IconEye, IconEdit } from '@tabler/icons-react';

interface ItemListState {
  page: number;
  limit: number;
  filters: InventoryItemFilters;
}

export const InventoryItemList: React.FC = () => {
  const user = useAuthStore((state) => state.user);
  const [state, setState] = useState<ItemListState>({
    page: 1,
    limit: 10,
    filters: {},
  });

  const isAdmin = user?.role === 'admin';
  const isManager = user?.role === 'manager' || isAdmin;

  // Fetch items
  const {
    data: itemsData,
    isLoading: itemsLoading,
    error: itemsError,
  } = useQuery({
    queryKey: ['items', state.page, state.limit, state.filters],
    queryFn: () =>
      inventoryService.getItems(state.page, state.limit, state.filters),
    staleTime: 5 * 60 * 1000,
  });

  // Fetch categories for filter dropdown
  const { data: categoriesData } = useQuery({
    queryKey: ['categories', 'all'],
    queryFn: () => inventoryService.getCategories(1, 100),
    staleTime: 10 * 60 * 1000,
  });

  const handleSearch = (value: string) => {
    setState((prev) => ({
      ...prev,
      filters: { ...prev.filters, search: value || undefined },
      page: 1,
    }));
  };

  const handleCategoryFilter = (value: string | null) => {
    setState((prev) => ({
      ...prev,
      filters: { ...prev.filters, categoryId: value ? parseInt(value) : undefined },
      page: 1,
    }));
  };

  const handlePageChange = (page: number) => {
    setState((prev) => ({ ...prev, page }));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (itemsError) {
    return (
      <Container size="lg" py="xl">
        <Paper p="md" withBorder>
          <Text color="red">Error loading items: {(itemsError as any).message}</Text>
        </Paper>
      </Container>
    );
  }

  const items = itemsData?.items || [];
  const total = itemsData?.total || 0;
  const totalPages = Math.ceil(total / state.limit);

  const rows = items.map((item: InventoryItem) => (
    <Table.Tr key={item.id}>
      <Table.Td>
        <Text size="sm" weight={500}>
          {item.sku}
        </Text>
      </Table.Td>
      <Table.Td>{item.name}</Table.Td>
      <Table.Td>
        <Badge size="sm" variant="light">
          {item.barcode}
        </Badge>
      </Table.Td>
      <Table.Td>${item.price.toFixed(2)}</Table.Td>
      <Table.Td>
        <Group spacing="xs">
          <ActionIcon
            component={Link}
            to={`/inventory/items/${item.id}`}
            variant="light"
            size="sm"
            title="View Item"
          >
            <IconEye size={16} />
          </ActionIcon>
          {isManager && (
            <ActionIcon
              component={Link}
              to={`/inventory/items/${item.id}/edit`}
              variant="light"
              size="sm"
              title="Edit Item"
            >
              <IconEdit size={16} />
            </ActionIcon>
          )}
        </Group>
      </Table.Td>
    </Table.Tr>
  ));

  return (
    <Container size="lg" py="xl">
      <Stack spacing="lg">
        <Group position="apart">
          <div>
            <h1>Inventory Items</h1>
            <Text color="dimmed" size="sm">
              Manage your inventory items and stock levels across locations
            </Text>
          </div>
          {isManager && (
            <Button
              component={Link}
              to="/inventory/items/new"
              leftIcon={<IconPlus size={18} />}
            >
              Add Item
            </Button>
          )}
        </Group>

        <Paper p="md" withBorder>
          <Grid>
            <Grid.Col span={12} sm={6}>
              <TextInput
                placeholder="Search items..."
                icon={<IconSearch size={16} />}
                value={state.filters.search || ''}
                onChange={(e) => handleSearch(e.currentTarget.value)}
              />
            </Grid.Col>
            <Grid.Col span={12} sm={6}>
              <Select
                placeholder="Filter by category"
                data={
                  (categoriesData?.items || []).map((cat: Category) => ({
                    value: String(cat.id),
                    label: cat.name,
                  })) || []
                }
                value={
                  state.filters.categoryId
                    ? String(state.filters.categoryId)
                    : null
                }
                onChange={handleCategoryFilter}
                clearable
              />
            </Grid.Col>
          </Grid>
        </Paper>

        {itemsLoading ? (
          <Center py={40}>
            <Loader />
          </Center>
        ) : (
          <>
            <Paper withBorder>
              <Table striped highlightOnHover>
                <Table.Thead>
                  <Table.Tr>
                    <Table.Th>SKU</Table.Th>
                    <Table.Th>Name</Table.Th>
                    <Table.Th>Barcode</Table.Th>
                    <Table.Th>Price</Table.Th>
                    <Table.Th>Actions</Table.Th>
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>{rows}</Table.Tbody>
              </Table>
            </Paper>

            {totalPages > 1 && (
              <Group position="center">
                <Pagination
                  value={state.page}
                  onChange={handlePageChange}
                  total={totalPages}
                  siblings={2}
                  boundaries={1}
                />
              </Group>
            )}

            <Text size="sm" color="dimmed" align="center">
              Showing {items.length} of {total} items
            </Text>
          </>
        )}
      </Stack>
    </Container>
  );
};

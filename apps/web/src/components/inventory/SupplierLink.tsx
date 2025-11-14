import React from 'react';
import {
  Group,
  Text,
  Badge,
  ThemeIcon,
  Stack,
  Paper,
  Button,
  Alert,
} from '@mantine/core';
import { useQuery } from '@tanstack/react-query';
import { IconTruck, IconAlertCircle } from '@tabler/icons-react';
import { Link } from 'react-router-dom';
import { inventoryService } from '@/services/inventoryService';

interface SupplierLinkProps {
  supplierId?: string | number | null;
  supplierName?: string;
}

/**
 * Supplier Link component - displays supplier information with cross-links
 * Enables navigation to supplier details and related purchase orders
 */
export const SupplierLink: React.FC<SupplierLinkProps> = ({
  supplierId,
  supplierName,
}) => {
  const { data: supplier, isLoading, error } = useQuery({
    queryKey: ['supplier', supplierId],
    queryFn: () => inventoryService.getSupplierById(supplierId!),
    enabled: !!supplierId,
  });

  if (!supplierId) {
    return (
      <Alert icon={<IconAlertCircle size={14} />} size="sm">
        No supplier assigned to this item
      </Alert>
    );
  }

  if (isLoading) {
    return <Text size="sm">Loading supplier...</Text>;
  }

  if (error) {
    return (
      <Alert icon={<IconAlertCircle size={14} />} color="red" size="sm">
        Failed to load supplier information
      </Alert>
    );
  }

  return (
    <Paper p="md" withBorder>
      <Stack spacing="md">
        <Group position="apart">
          <Group spacing="sm">
            <ThemeIcon variant="light" size="lg">
              <IconTruck size={18} />
            </ThemeIcon>
            <div>
              <Text weight={500} size="sm">
                Supplier
              </Text>
              <Text size="lg" weight={600}>
                {supplier?.name || supplierName || 'Unknown Supplier'}
              </Text>
            </div>
          </Group>
        </Group>

        {supplier && (
          <>
            {supplier.email && (
              <div>
                <Text size="sm" color="dimmed">
                  Contact Email
                </Text>
                <Text
                  component="a"
                  href={`mailto:${supplier.email}`}
                  color="blue"
                >
                  {supplier.email}
                </Text>
              </div>
            )}

            {supplier.phone && (
              <div>
                <Text size="sm" color="dimmed">
                  Contact Phone
                </Text>
                <Text
                  component="a"
                  href={`tel:${supplier.phone}`}
                  color="blue"
                >
                  {supplier.phone}
                </Text>
              </div>
            )}

            {supplier.rating && (
              <div>
                <Text size="sm" color="dimmed">
                  Rating
                </Text>
                <Group spacing="xs">
                  <Badge>{supplier.rating.toFixed(1)} / 5</Badge>
                </Group>
              </div>
            )}

            <Group position="apart" pt="md" mt="md" style={{ borderTop: '1px solid #e9ecef' }}>
              <Button
                component={Link}
                to={`/suppliers/${supplier.id}`}
                variant="light"
                size="sm"
              >
                View Supplier Details
              </Button>
              <Button
                component={Link}
                to={`/purchase-orders?supplier=${supplier.id}`}
                variant="light"
                size="sm"
              >
                Purchase Orders
              </Button>
            </Group>
          </>
        )}

        {!supplier && (
          <Alert icon={<IconAlertCircle size={14} />} size="sm">
            Could not load supplier details
          </Alert>
        )}
      </Stack>
    </Paper>
  );
};

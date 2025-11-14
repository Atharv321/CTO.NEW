import React from 'react';
import {
  Table,
  Badge,
  Text,
  Group,
  Center,
  Loader,
  Alert,
  Paper,
} from '@mantine/core';
import { IconAlertCircle, IconTrendingUp, IconTrendingDown } from '@tabler/icons-react';
import { StockMovement } from '@/types';

interface AuditHistoryTableProps {
  movements: StockMovement[];
  isLoading?: boolean;
  error?: Error | null;
}

const getMovementColor = (type: string): string => {
  switch (type) {
    case 'inbound':
    case 'return':
      return 'green';
    case 'outbound':
      return 'red';
    case 'adjustment':
      return 'blue';
    case 'scanned_entry':
      return 'purple';
    default:
      return 'gray';
  }
};

const getMovementIcon = (type: string) => {
  switch (type) {
    case 'inbound':
    case 'return':
      return <IconTrendingUp size={16} />;
    case 'outbound':
      return <IconTrendingDown size={16} />;
    default:
      return null;
  }
};

export const AuditHistoryTable: React.FC<AuditHistoryTableProps> = ({
  movements,
  isLoading = false,
  error = null,
}) => {
  if (error) {
    return (
      <Alert icon={<IconAlertCircle size={16} />} color="red">
        Error loading audit history: {error.message}
      </Alert>
    );
  }

  if (isLoading) {
    return (
      <Center py={40}>
        <Loader />
      </Center>
    );
  }

  if (movements.length === 0) {
    return (
      <Alert icon={<IconAlertCircle size={16} />}>
        No audit history available
      </Alert>
    );
  }

  const rows = movements.map((movement: StockMovement) => (
    <Table.Tr key={movement.id}>
      <Table.Td>
        <Badge
          size="sm"
          variant="light"
          color={getMovementColor(movement.movementType)}
          leftSection={getMovementIcon(movement.movementType)}
        >
          {movement.movementType}
        </Badge>
      </Table.Td>
      <Table.Td>
        <Group spacing={4}>
          {movement.movementType === 'inbound' || movement.movementType === 'return' ? (
            <IconTrendingUp size={16} color="green" />
          ) : (
            <IconTrendingDown size={16} color="red" />
          )}
          <Text weight={500}>{movement.quantity}</Text>
        </Group>
      </Table.Td>
      <Table.Td>{movement.referenceId || '-'}</Table.Td>
      <Table.Td>{movement.notes || '-'}</Table.Td>
      <Table.Td>{movement.adjustedBy || '-'}</Table.Td>
      <Table.Td>
        <Text size="sm">
          {movement.createdAt
            ? new Date(movement.createdAt).toLocaleString()
            : movement.timestamp
              ? new Date(movement.timestamp).toLocaleString()
              : '-'}
        </Text>
      </Table.Td>
    </Table.Tr>
  ));

  return (
    <Paper withBorder>
      <Table striped highlightOnHover size="sm">
        <Table.Thead>
          <Table.Tr>
            <Table.Th>Type</Table.Th>
            <Table.Th>Quantity</Table.Th>
            <Table.Th>Reference</Table.Th>
            <Table.Th>Notes</Table.Th>
            <Table.Th>Recorded By</Table.Th>
            <Table.Th>Date/Time</Table.Th>
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>{rows}</Table.Tbody>
      </Table>
    </Paper>
  );
};

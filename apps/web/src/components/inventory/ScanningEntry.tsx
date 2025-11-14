import React, { useState } from 'react';
import {
  Paper,
  Stack,
  TextInput,
  Button,
  Alert,
  Group,
  Text,
  Badge,
  Card,
} from '@mantine/core';
import { IconBarcode, IconAlertCircle } from '@tabler/icons-react';
import { useMutation } from '@tanstack/react-query';
import { inventoryService } from '@/services/inventoryService';
import { notifications } from '@mantine/notifications';

interface ScanningEntryProps {
  onItemScanned?: (itemId: string) => void;
  locationId?: string;
}

/**
 * Scanning Entry component - placeholder for barcode/QR code scanning
 * In production, this would integrate with:
 * - Barcode scanner devices
 * - Mobile barcode scanning libraries
 * - QR code readers
 */
export const ScanningEntry: React.FC<ScanningEntryProps> = ({
  onItemScanned,
  locationId,
}) => {
  const [barcode, setBarcode] = useState('');
  const [scannedItem, setScannedItem] = useState<any>(null);

  const searchItemMutation = useMutation({
    mutationFn: async (barcodeValue: string) => {
      return inventoryService.getItemByBarcode(barcodeValue);
    },
    onSuccess: (data) => {
      setScannedItem(data);
      onItemScanned?.(data.id);
      notifications.show({
        title: 'Item Found',
        message: `Scanned: ${data.name} (${data.sku})`,
        color: 'green',
      });
    },
    onError: (error: any) => {
      setScannedItem(null);
      notifications.show({
        title: 'Item Not Found',
        message: error.message || `No item found with barcode: ${barcodeValue}`,
        color: 'red',
      });
    },
  });

  const handleScan = () => {
    if (barcode.trim()) {
      searchItemMutation.mutate(barcode);
    }
  };

  const handleClear = () => {
    setBarcode('');
    setScannedItem(null);
  };

  return (
    <Paper p="md" withBorder>
      <Stack spacing="md">
        <Alert
          icon={<IconAlertCircle size={16} />}
          color="blue"
          title="Scanning Entry (Placeholder)"
        >
          This is a placeholder for barcode/QR code scanning functionality.
          In production, this would integrate with:
          <ul style={{ margin: '8px 0 0 20px' }}>
            <li>Barcode scanner devices</li>
            <li>Mobile barcode scanning libraries</li>
            <li>QR code readers</li>
          </ul>
        </Alert>

        <div>
          <Text weight={500} size="sm" mb="xs">
            Enter Barcode
          </Text>
          <Group spacing="xs">
            <TextInput
              placeholder="Scan barcode or enter manually"
              icon={<IconBarcode size={16} />}
              value={barcode}
              onChange={(e) => setBarcode(e.currentTarget.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  handleScan();
                }
              }}
              disabled={searchItemMutation.isPending}
              style={{ flex: 1 }}
            />
            <Button
              onClick={handleScan}
              loading={searchItemMutation.isPending}
              disabled={!barcode.trim()}
            >
              Scan
            </Button>
            <Button
              variant="light"
              onClick={handleClear}
              disabled={searchItemMutation.isPending}
            >
              Clear
            </Button>
          </Group>
        </div>

        {scannedItem && (
          <Card withBorder bg="green.0">
            <Stack spacing="sm">
              <Group position="apart">
                <Text weight={500}>Item Scanned Successfully</Text>
                <Badge color="green">Found</Badge>
              </Group>
              <div>
                <Text size="sm" color="dimmed">
                  SKU
                </Text>
                <Text weight={500}>{scannedItem.sku}</Text>
              </div>
              <div>
                <Text size="sm" color="dimmed">
                  Name
                </Text>
                <Text weight={500}>{scannedItem.name}</Text>
              </div>
              <div>
                <Text size="sm" color="dimmed">
                  Barcode
                </Text>
                <Badge>{scannedItem.barcode}</Badge>
              </div>
              <div>
                <Text size="sm" color="dimmed">
                  Price
                </Text>
                <Text weight={500}>${scannedItem.price?.toFixed(2) || 'N/A'}</Text>
              </div>
              {locationId && (
                <Alert icon={<IconAlertCircle size={14} />} size="sm">
                  Location: {locationId}
                  {' (ready for stock movement)'}
                </Alert>
              )}
            </Stack>
          </Card>
        )}

        {searchItemMutation.error && (
          <Alert icon={<IconAlertCircle size={16} />} color="red">
            Failed to scan item. Please check the barcode and try again.
          </Alert>
        )}
      </Stack>
    </Paper>
  );
};

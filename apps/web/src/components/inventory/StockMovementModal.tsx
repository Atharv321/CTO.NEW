import React, { useState } from 'react';
import {
  Modal,
  Stack,
  NumberInput,
  Select,
  Textarea,
  Group,
  Button,
  ModalProps,
} from '@mantine/core';
import { StockMovementRequest } from '@/types';

interface StockMovementModalProps extends Omit<ModalProps, 'children'> {
  onSubmit: (data: StockMovementRequest) => Promise<void> | void;
  isLoading?: boolean;
  locationId?: string;
}

const movementTypeOptions = [
  { value: 'inbound', label: 'Inbound' },
  { value: 'outbound', label: 'Outbound' },
  { value: 'adjustment', label: 'Adjustment' },
  { value: 'scanned_entry', label: 'Scanned Entry (Placeholder)' },
  { value: 'return', label: 'Return' },
];

export const StockMovementModal: React.FC<StockMovementModalProps> = ({
  onSubmit,
  isLoading = false,
  locationId,
  ...modalProps
}) => {
  const [formData, setFormData] = useState<StockMovementRequest>({
    quantity: 0,
    movementType: 'adjustment',
    notes: '',
  });

  const handleSubmit = async () => {
    await onSubmit(formData);
    setFormData({
      quantity: 0,
      movementType: 'adjustment',
      notes: '',
    });
  };

  const handleClose = () => {
    setFormData({
      quantity: 0,
      movementType: 'adjustment',
      notes: '',
    });
    if (modalProps.onClose) {
      modalProps.onClose();
    }
  };

  return (
    <Modal
      {...modalProps}
      onClose={handleClose}
      title="Record Stock Movement"
      size="md"
    >
      <Stack spacing="md">
        <NumberInput
          label="Quantity"
          placeholder="Enter quantity"
          required
          value={formData.quantity}
          onChange={(value) =>
            setFormData((prev) => ({
              ...prev,
              quantity: value || 0,
            }))
          }
        />

        <Select
          label="Movement Type"
          placeholder="Select movement type"
          required
          data={movementTypeOptions}
          value={formData.movementType}
          onChange={(value) =>
            setFormData((prev) => ({
              ...prev,
              movementType: (value as StockMovementRequest['movementType']) || 'adjustment',
            }))
          }
        />

        <Textarea
          label="Notes"
          placeholder="Add optional notes"
          value={formData.notes || ''}
          onChange={(e) =>
            setFormData((prev) => ({
              ...prev,
              notes: e.currentTarget.value,
            }))
          }
        />

        <Group position="right" mt="md">
          <Button variant="light" onClick={handleClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button
            loading={isLoading}
            onClick={handleSubmit}
            disabled={formData.quantity === 0}
          >
            Record Movement
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
};

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  InventoryItem,
  Category,
  InventoryLocation,
  StockMovement,
  StockMovementRequest,
  ApiError,
} from '@/types';
import { inventoryService } from '@/services/inventoryService';

/**
 * Hook for fetching inventory items with pagination and filters
 */
export function useItems(
  page: number = 1,
  limit: number = 10,
  filters?: any
) {
  return useQuery({
    queryKey: ['items', page, limit, filters],
    queryFn: () => inventoryService.getItems(page, limit, filters),
  });
}

/**
 * Hook for fetching a single item by ID
 */
export function useItem(itemId: string | number | null) {
  return useQuery({
    queryKey: ['item', itemId],
    queryFn: () => inventoryService.getItemById(itemId!),
    enabled: !!itemId,
  });
}

/**
 * Hook for fetching stock levels for an item across all locations
 */
export function useStockByItem(itemId: string | number | null) {
  return useQuery({
    queryKey: ['stockByItem', itemId],
    queryFn: () => inventoryService.getStockByItem(itemId!),
    enabled: !!itemId,
  });
}

/**
 * Hook for fetching stock level for a specific item at a specific location
 */
export function useStockLevel(
  itemId: string | number | null,
  locationId: string | number | null
) {
  return useQuery({
    queryKey: ['stockLevel', itemId, locationId],
    queryFn: () =>
      inventoryService.getStockLevel(itemId!, locationId!),
    enabled: !!itemId && !!locationId,
  });
}

/**
 * Hook for fetching stock movement history
 */
export function useStockMovementHistory(
  itemId: string | number | null,
  locationId: string | number | null,
  page: number = 1,
  limit: number = 10
) {
  return useQuery({
    queryKey: ['stockMovements', itemId, locationId, page, limit],
    queryFn: () =>
      inventoryService.getStockMovementHistory(itemId!, locationId!, page, limit),
    enabled: !!itemId && !!locationId,
  });
}

/**
 * Hook for fetching categories
 */
export function useCategories(page: number = 1, limit: number = 10) {
  return useQuery({
    queryKey: ['categories', page, limit],
    queryFn: () => inventoryService.getCategories(page, limit),
  });
}

/**
 * Hook for fetching locations
 */
export function useLocations(page: number = 1, limit: number = 10) {
  return useQuery({
    queryKey: ['locations', page, limit],
    queryFn: () => inventoryService.getLocations(page, limit),
  });
}

/**
 * Hook for adjusting stock with optimistic updates
 */
export function useAdjustStock() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      itemId,
      locationId,
      data,
    }: {
      itemId: string | number;
      locationId: string | number;
      data: StockMovementRequest;
    }) => {
      return inventoryService.adjustStock(itemId, locationId, data);
    },
    onSuccess: (data: StockMovement, variables) => {
      // Invalidate related queries for optimistic updates
      queryClient.invalidateQueries({
        queryKey: ['stockByItem', variables.itemId],
      });
      queryClient.invalidateQueries({
        queryKey: ['stockLevel', variables.itemId, variables.locationId],
      });
      queryClient.invalidateQueries({
        queryKey: ['stockMovements', variables.itemId, variables.locationId],
      });
      queryClient.invalidateQueries({
        queryKey: ['items'],
      });
    },
  });
}

/**
 * Hook for initializing stock
 */
export function useInitializeStock() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      itemId,
      locationId,
      quantity,
    }: {
      itemId: string | number;
      locationId: string | number;
      quantity: number;
    }) => {
      return inventoryService.initializeStock(itemId, locationId, quantity);
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['stockByItem', variables.itemId],
      });
      queryClient.invalidateQueries({
        queryKey: ['stockLevel', variables.itemId, variables.locationId],
      });
    },
  });
}

/**
 * Hook for searching items
 */
export function useSearchItems(query: string | null) {
  return useQuery({
    queryKey: ['searchItems', query],
    queryFn: () => inventoryService.searchItems(query!),
    enabled: !!query && query.length > 0,
  });
}

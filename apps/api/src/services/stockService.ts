import { query } from '../db';
import type { StockLevel, InventoryAdjustment, PaginationParams, PaginatedResponse } from '@shared/types';

export class StockService {
  async getStockLevel(itemId: string, locationId: string): Promise<StockLevel | null> {
    const result = await query(
      `SELECT id, item_id, location_id, quantity, reorder_level, created_at, updated_at 
       FROM stock_levels 
       WHERE item_id = $1 AND location_id = $2`,
      [itemId, locationId]
    );

    if (!result.rows[0]) {
      return null;
    }

    const row = result.rows[0];
    return {
      ...row,
      itemId: row.item_id,
      locationId: row.location_id,
      reorderLevel: row.reorder_level,
    };
  }

  async getItemStockByLocation(itemId: string): Promise<StockLevel[]> {
    const result = await query(
      `SELECT id, item_id, location_id, quantity, reorder_level, created_at, updated_at 
       FROM stock_levels 
       WHERE item_id = $1 
       ORDER BY created_at DESC`,
      [itemId]
    );

    return result.rows.map((row) => ({
      ...row,
      itemId: row.item_id,
      locationId: row.location_id,
      reorderLevel: row.reorder_level,
    }));
  }

  async getLocationStock(locationId: string, pagination: PaginationParams): Promise<PaginatedResponse<StockLevel>> {
    const { limit, offset } = pagination;

    const countResult = await query(
      'SELECT COUNT(*) FROM stock_levels WHERE location_id = $1',
      [locationId]
    );
    const total = parseInt(countResult.rows[0].count, 10);

    const result = await query(
      `SELECT id, item_id, location_id, quantity, reorder_level, created_at, updated_at 
       FROM stock_levels 
       WHERE location_id = $1 
       ORDER BY created_at DESC 
       LIMIT $2 OFFSET $3`,
      [locationId, limit, offset]
    );

    const totalPages = Math.ceil(total / limit);
    const page = Math.floor(offset / limit) + 1;

    return {
      data: result.rows.map((row) => ({
        ...row,
        itemId: row.item_id,
        locationId: row.location_id,
        reorderLevel: row.reorder_level,
      })),
      total,
      page,
      limit,
      totalPages,
    };
  }

  async createOrUpdateStockLevel(data: {
    itemId: string;
    locationId: string;
    quantity: number;
    reorderLevel?: number;
  }): Promise<StockLevel> {
    const { itemId, locationId, quantity, reorderLevel = 10 } = data;

    const result = await query(
      `INSERT INTO stock_levels (item_id, location_id, quantity, reorder_level) 
       VALUES ($1, $2, $3, $4) 
       ON CONFLICT (item_id, location_id) 
       DO UPDATE SET quantity = $3, updated_at = CURRENT_TIMESTAMP
       RETURNING id, item_id, location_id, quantity, reorder_level, created_at, updated_at`,
      [itemId, locationId, quantity, reorderLevel]
    );

    const row = result.rows[0];
    return {
      ...row,
      itemId: row.item_id,
      locationId: row.location_id,
      reorderLevel: row.reorder_level,
    };
  }

  async adjustStock(data: {
    itemId: string;
    locationId: string;
    adjustment: number;
    reason: 'scanned_entry' | 'manual_adjustment' | 'correction' | 'count_variance';
    notes?: string;
    adjustedBy: string;
  }): Promise<{ stockLevel: StockLevel; adjustment: InventoryAdjustment }> {
    const { itemId, locationId, adjustment, reason, notes, adjustedBy } = data;

    // Create adjustment record
    const adjResult = await query(
      `INSERT INTO inventory_adjustments (item_id, location_id, adjustment, reason, notes, adjusted_by) 
       VALUES ($1, $2, $3, $4, $5, $6) 
       RETURNING id, item_id, location_id, adjustment, reason, notes, adjusted_by, created_at`,
      [itemId, locationId, adjustment, reason, notes || null, adjustedBy]
    );

    const adjRow = adjResult.rows[0];

    // Update stock level
    const stockResult = await query(
      `UPDATE stock_levels 
       SET quantity = quantity + $1, updated_at = CURRENT_TIMESTAMP 
       WHERE item_id = $2 AND location_id = $3 
       RETURNING id, item_id, location_id, quantity, reorder_level, created_at, updated_at`,
      [adjustment, itemId, locationId]
    );

    const stockRow = stockResult.rows[0];

    return {
      stockLevel: {
        ...stockRow,
        itemId: stockRow.item_id,
        locationId: stockRow.location_id,
        reorderLevel: stockRow.reorder_level,
      },
      adjustment: {
        ...adjRow,
        itemId: adjRow.item_id,
        locationId: adjRow.location_id,
      },
    };
  }

  async getAdjustmentHistory(
    itemId: string,
    locationId: string,
    pagination: PaginationParams
  ): Promise<PaginatedResponse<InventoryAdjustment>> {
    const { limit, offset } = pagination;

    const countResult = await query(
      `SELECT COUNT(*) FROM inventory_adjustments 
       WHERE item_id = $1 AND location_id = $2`,
      [itemId, locationId]
    );
    const total = parseInt(countResult.rows[0].count, 10);

    const result = await query(
      `SELECT id, item_id, location_id, adjustment, reason, notes, adjusted_by, created_at 
       FROM inventory_adjustments 
       WHERE item_id = $1 AND location_id = $2 
       ORDER BY created_at DESC 
       LIMIT $3 OFFSET $4`,
      [itemId, locationId, limit, offset]
    );

    const totalPages = Math.ceil(total / limit);
    const page = Math.floor(offset / limit) + 1;

    return {
      data: result.rows.map((row) => ({
        ...row,
        itemId: row.item_id,
        locationId: row.location_id,
      })),
      total,
      page,
      limit,
      totalPages,
    };
  }

  async getLowStockItems(locationId: string): Promise<StockLevel[]> {
    const result = await query(
      `SELECT id, item_id, location_id, quantity, reorder_level, created_at, updated_at 
       FROM stock_levels 
       WHERE location_id = $1 AND quantity <= reorder_level 
       ORDER BY quantity ASC`,
      [locationId]
    );

    return result.rows.map((row) => ({
      ...row,
      itemId: row.item_id,
      locationId: row.location_id,
      reorderLevel: row.reorder_level,
    }));
  }
}

export const stockService = new StockService();

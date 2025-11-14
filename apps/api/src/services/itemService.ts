import { query } from '../db';
import type { InventoryItem, PaginationParams, PaginatedResponse } from '@shared/types';

export class ItemService {
  async createItem(data: {
    sku: string;
    barcode: string;
    name: string;
    description?: string;
    categoryId: string;
    supplierId?: string;
    price: number;
  }): Promise<InventoryItem> {
    const { sku, barcode, name, description, categoryId, supplierId, price } = data;

    const result = await query(
      `INSERT INTO inventory_items (sku, barcode, name, description, category_id, supplier_id, price) 
       VALUES ($1, $2, $3, $4, $5, $6, $7) 
       RETURNING id, sku, barcode, name, description, category_id, supplier_id, price, created_at, updated_at`,
      [sku, barcode, name, description || null, categoryId, supplierId || null, price]
    );

    const row = result.rows[0];
    return {
      ...row,
      categoryId: row.category_id,
      supplierId: row.supplier_id,
    };
  }

  async getItems(pagination: PaginationParams): Promise<PaginatedResponse<InventoryItem>> {
    const { limit, offset } = pagination;

    const countResult = await query('SELECT COUNT(*) FROM inventory_items');
    const total = parseInt(countResult.rows[0].count, 10);

    const result = await query(
      `SELECT id, sku, barcode, name, description, category_id, supplier_id, price, created_at, updated_at 
       FROM inventory_items 
       ORDER BY created_at DESC 
       LIMIT $1 OFFSET $2`,
      [limit, offset]
    );

    const totalPages = Math.ceil(total / limit);
    const page = Math.floor(offset / limit) + 1;

    return {
      data: result.rows.map((row) => ({
        ...row,
        categoryId: row.category_id,
        supplierId: row.supplier_id,
      })),
      total,
      page,
      limit,
      totalPages,
    };
  }

  async getItemById(id: string): Promise<InventoryItem | null> {
    const result = await query(
      `SELECT id, sku, barcode, name, description, category_id, supplier_id, price, created_at, updated_at 
       FROM inventory_items 
       WHERE id = $1`,
      [id]
    );

    if (!result.rows[0]) {
      return null;
    }

    const row = result.rows[0];
    return {
      ...row,
      categoryId: row.category_id,
      supplierId: row.supplier_id,
    };
  }

  async getItemByBarcode(barcode: string): Promise<InventoryItem | null> {
    const result = await query(
      `SELECT id, sku, barcode, name, description, category_id, supplier_id, price, created_at, updated_at 
       FROM inventory_items 
       WHERE barcode = $1`,
      [barcode]
    );

    if (!result.rows[0]) {
      return null;
    }

    const row = result.rows[0];
    return {
      ...row,
      categoryId: row.category_id,
      supplierId: row.supplier_id,
    };
  }

  async getItemBySku(sku: string): Promise<InventoryItem | null> {
    const result = await query(
      `SELECT id, sku, barcode, name, description, category_id, supplier_id, price, created_at, updated_at 
       FROM inventory_items 
       WHERE sku = $1`,
      [sku]
    );

    if (!result.rows[0]) {
      return null;
    }

    const row = result.rows[0];
    return {
      ...row,
      categoryId: row.category_id,
      supplierId: row.supplier_id,
    };
  }

  async updateItem(
    id: string,
    data: {
      sku?: string;
      barcode?: string;
      name?: string;
      description?: string;
      categoryId?: string;
      supplierId?: string;
      price?: number;
    }
  ): Promise<InventoryItem | null> {
    const { sku, barcode, name, description, categoryId, supplierId, price } = data;

    const updates: string[] = [];
    const values: unknown[] = [];
    let paramIndex = 1;

    if (sku !== undefined) {
      updates.push(`sku = $${paramIndex++}`);
      values.push(sku);
    }
    if (barcode !== undefined) {
      updates.push(`barcode = $${paramIndex++}`);
      values.push(barcode);
    }
    if (name !== undefined) {
      updates.push(`name = $${paramIndex++}`);
      values.push(name);
    }
    if (description !== undefined) {
      updates.push(`description = $${paramIndex++}`);
      values.push(description || null);
    }
    if (categoryId !== undefined) {
      updates.push(`category_id = $${paramIndex++}`);
      values.push(categoryId);
    }
    if (supplierId !== undefined) {
      updates.push(`supplier_id = $${paramIndex++}`);
      values.push(supplierId || null);
    }
    if (price !== undefined) {
      updates.push(`price = $${paramIndex++}`);
      values.push(price);
    }

    if (updates.length === 0) {
      return this.getItemById(id);
    }

    updates.push(`updated_at = CURRENT_TIMESTAMP`);
    values.push(id);

    const result = await query(
      `UPDATE inventory_items 
       SET ${updates.join(', ')} 
       WHERE id = $${paramIndex} 
       RETURNING id, sku, barcode, name, description, category_id, supplier_id, price, created_at, updated_at`,
      values
    );

    if (!result.rows[0]) {
      return null;
    }

    const row = result.rows[0];
    return {
      ...row,
      categoryId: row.category_id,
      supplierId: row.supplier_id,
    };
  }

  async deleteItem(id: string): Promise<boolean> {
    const result = await query('DELETE FROM inventory_items WHERE id = $1', [id]);
    return result.rowCount! > 0;
  }

  async searchItems(
    searchTerm: string,
    pagination: PaginationParams
  ): Promise<PaginatedResponse<InventoryItem>> {
    const { limit, offset } = pagination;
    const term = `%${searchTerm}%`;

    const countResult = await query(
      `SELECT COUNT(*) FROM inventory_items 
       WHERE name ILIKE $1 OR barcode ILIKE $1 OR sku ILIKE $1`,
      [term]
    );
    const total = parseInt(countResult.rows[0].count, 10);

    const result = await query(
      `SELECT id, sku, barcode, name, description, category_id, supplier_id, price, created_at, updated_at 
       FROM inventory_items 
       WHERE name ILIKE $1 OR barcode ILIKE $1 OR sku ILIKE $1 
       ORDER BY created_at DESC 
       LIMIT $2 OFFSET $3`,
      [term, limit, offset]
    );

    const totalPages = Math.ceil(total / limit);
    const page = Math.floor(offset / limit) + 1;

    return {
      data: result.rows.map((row) => ({
        ...row,
        categoryId: row.category_id,
        supplierId: row.supplier_id,
      })),
      total,
      page,
      limit,
      totalPages,
    };
  }

  async getItemsByCategory(
    categoryId: string,
    pagination: PaginationParams
  ): Promise<PaginatedResponse<InventoryItem>> {
    const { limit, offset } = pagination;

    const countResult = await query(
      'SELECT COUNT(*) FROM inventory_items WHERE category_id = $1',
      [categoryId]
    );
    const total = parseInt(countResult.rows[0].count, 10);

    const result = await query(
      `SELECT id, sku, barcode, name, description, category_id, supplier_id, price, created_at, updated_at 
       FROM inventory_items 
       WHERE category_id = $1 
       ORDER BY created_at DESC 
       LIMIT $2 OFFSET $3`,
      [categoryId, limit, offset]
    );

    const totalPages = Math.ceil(total / limit);
    const page = Math.floor(offset / limit) + 1;

    return {
      data: result.rows.map((row) => ({
        ...row,
        categoryId: row.category_id,
        supplierId: row.supplier_id,
      })),
      total,
      page,
      limit,
      totalPages,
    };
  }
}

export const itemService = new ItemService();

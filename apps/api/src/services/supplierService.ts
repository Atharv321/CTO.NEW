import { query } from '../db';
import type { Supplier, PaginationParams, PaginatedResponse } from '@shared/types';

export class SupplierService {
  async createSupplier(data: {
    name: string;
    contactEmail?: string;
    phone?: string;
  }): Promise<Supplier> {
    const { name, contactEmail, phone } = data;

    const result = await query(
      `INSERT INTO suppliers (name, contact_email, phone) 
       VALUES ($1, $2, $3) 
       RETURNING id, name, contact_email, phone, created_at, updated_at`,
      [name, contactEmail || null, phone || null]
    );

    const row = result.rows[0];
    return {
      ...row,
      contactEmail: row.contact_email,
      phone: row.phone,
    };
  }

  async getSuppliers(pagination: PaginationParams): Promise<PaginatedResponse<Supplier>> {
    const { limit, offset } = pagination;

    const countResult = await query('SELECT COUNT(*) FROM suppliers');
    const total = parseInt(countResult.rows[0].count, 10);

    const result = await query(
      `SELECT id, name, contact_email, phone, created_at, updated_at 
       FROM suppliers 
       ORDER BY created_at DESC 
       LIMIT $1 OFFSET $2`,
      [limit, offset]
    );

    const totalPages = Math.ceil(total / limit);
    const page = Math.floor(offset / limit) + 1;

    return {
      data: result.rows.map((row) => ({
        ...row,
        contactEmail: row.contact_email,
        phone: row.phone,
      })),
      total,
      page,
      limit,
      totalPages,
    };
  }

  async getSupplierById(id: string): Promise<Supplier | null> {
    const result = await query(
      `SELECT id, name, contact_email, phone, created_at, updated_at 
       FROM suppliers 
       WHERE id = $1`,
      [id]
    );

    if (!result.rows[0]) {
      return null;
    }

    const row = result.rows[0];
    return {
      ...row,
      contactEmail: row.contact_email,
      phone: row.phone,
    };
  }

  async updateSupplier(
    id: string,
    data: { name?: string; contactEmail?: string; phone?: string }
  ): Promise<Supplier | null> {
    const { name, contactEmail, phone } = data;

    const updates: string[] = [];
    const values: unknown[] = [];
    let paramIndex = 1;

    if (name !== undefined) {
      updates.push(`name = $${paramIndex++}`);
      values.push(name);
    }
    if (contactEmail !== undefined) {
      updates.push(`contact_email = $${paramIndex++}`);
      values.push(contactEmail || null);
    }
    if (phone !== undefined) {
      updates.push(`phone = $${paramIndex++}`);
      values.push(phone || null);
    }

    if (updates.length === 0) {
      return this.getSupplierById(id);
    }

    updates.push(`updated_at = CURRENT_TIMESTAMP`);
    values.push(id);

    const result = await query(
      `UPDATE suppliers 
       SET ${updates.join(', ')} 
       WHERE id = $${paramIndex} 
       RETURNING id, name, contact_email, phone, created_at, updated_at`,
      values
    );

    if (!result.rows[0]) {
      return null;
    }

    const row = result.rows[0];
    return {
      ...row,
      contactEmail: row.contact_email,
      phone: row.phone,
    };
  }

  async deleteSupplier(id: string): Promise<boolean> {
    const result = await query('DELETE FROM suppliers WHERE id = $1', [id]);
    return result.rowCount! > 0;
  }

  async getSupplierByName(name: string): Promise<Supplier | null> {
    const result = await query(
      `SELECT id, name, contact_email, phone, created_at, updated_at 
       FROM suppliers 
       WHERE name = $1`,
      [name]
    );

    if (!result.rows[0]) {
      return null;
    }

    const row = result.rows[0];
    return {
      ...row,
      contactEmail: row.contact_email,
      phone: row.phone,
    };
  }
}

export const supplierService = new SupplierService();

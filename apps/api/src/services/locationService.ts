import { query } from '../db';
import type { Location, PaginationParams, PaginatedResponse } from '@shared/types';

export class LocationService {
  async createLocation(data: { name: string; description?: string }): Promise<Location> {
    const { name, description } = data;

    const result = await query(
      `INSERT INTO locations (name, description) 
       VALUES ($1, $2) 
       RETURNING id, name, description, created_at, updated_at`,
      [name, description || null]
    );

    return result.rows[0];
  }

  async getLocations(pagination: PaginationParams): Promise<PaginatedResponse<Location>> {
    const { limit, offset } = pagination;

    const countResult = await query('SELECT COUNT(*) FROM locations');
    const total = parseInt(countResult.rows[0].count, 10);

    const result = await query(
      `SELECT id, name, description, created_at, updated_at 
       FROM locations 
       ORDER BY created_at DESC 
       LIMIT $1 OFFSET $2`,
      [limit, offset]
    );

    const totalPages = Math.ceil(total / limit);
    const page = Math.floor(offset / limit) + 1;

    return {
      data: result.rows,
      total,
      page,
      limit,
      totalPages,
    };
  }

  async getLocationById(id: string): Promise<Location | null> {
    const result = await query(
      `SELECT id, name, description, created_at, updated_at 
       FROM locations 
       WHERE id = $1`,
      [id]
    );

    return result.rows[0] || null;
  }

  async updateLocation(
    id: string,
    data: { name?: string; description?: string }
  ): Promise<Location | null> {
    const { name, description } = data;

    const updates: string[] = [];
    const values: unknown[] = [];
    let paramIndex = 1;

    if (name !== undefined) {
      updates.push(`name = $${paramIndex++}`);
      values.push(name);
    }
    if (description !== undefined) {
      updates.push(`description = $${paramIndex++}`);
      values.push(description);
    }

    if (updates.length === 0) {
      return this.getLocationById(id);
    }

    updates.push(`updated_at = CURRENT_TIMESTAMP`);
    values.push(id);

    const sql = `UPDATE locations 
       SET ${updates.join(', ')} 
       WHERE id = $${paramIndex} 
       RETURNING id, name, description, created_at, updated_at`;

    const result = await query(sql, values);

    return result.rows[0] || null;
  }

  async deleteLocation(id: string): Promise<boolean> {
    const result = await query('DELETE FROM locations WHERE id = $1', [id]);
    return result.rowCount! > 0;
  }

  async getLocationByName(name: string): Promise<Location | null> {
    const result = await query(
      `SELECT id, name, description, created_at, updated_at 
       FROM locations 
       WHERE name = $1`,
      [name]
    );

    return result.rows[0] || null;
  }
}

export const locationService = new LocationService();

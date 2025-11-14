import { query } from '../db';
import type { Category, PaginationParams, PaginatedResponse } from '@shared/types';

export class CategoryService {
  async createCategory(data: { name: string; description?: string }): Promise<Category> {
    const { name, description } = data;

    const result = await query(
      `INSERT INTO categories (name, description) 
       VALUES ($1, $2) 
       RETURNING id, name, description, created_at, updated_at`,
      [name, description || null]
    );

    return result.rows[0];
  }

  async getCategories(pagination: PaginationParams): Promise<PaginatedResponse<Category>> {
    const { limit, offset } = pagination;

    const countResult = await query('SELECT COUNT(*) FROM categories');
    const total = parseInt(countResult.rows[0].count, 10);

    const result = await query(
      `SELECT id, name, description, created_at, updated_at 
       FROM categories 
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

  async getCategoryById(id: string): Promise<Category | null> {
    const result = await query(
      `SELECT id, name, description, created_at, updated_at 
       FROM categories 
       WHERE id = $1`,
      [id]
    );

    return result.rows[0] || null;
  }

  async updateCategory(
    id: string,
    data: { name?: string; description?: string }
  ): Promise<Category | null> {
    const { name, description } = data;

    // Build dynamic update query
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
      return this.getCategoryById(id);
    }

    updates.push(`updated_at = CURRENT_TIMESTAMP`);
    values.push(id);

    const result = await query(
      `UPDATE categories 
       SET ${updates.join(', ')} 
       WHERE id = $${paramIndex} 
       RETURNING id, name, description, created_at, updated_at`,
      values
    );

    return result.rows[0] || null;
  }

  async deleteCategory(id: string): Promise<boolean> {
    const result = await query('DELETE FROM categories WHERE id = $1', [id]);
    return result.rowCount! > 0;
  }

  async getCategoryByName(name: string): Promise<Category | null> {
    const result = await query(
      `SELECT id, name, description, created_at, updated_at 
       FROM categories 
       WHERE name = $1`,
      [name]
    );

    return result.rows[0] || null;
  }
}

export const categoryService = new CategoryService();

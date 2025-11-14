const pool = require('../db/connection');

class CategoryService {
  async createCategory(name, description = null, parentCategoryId = null) {
    try {
      const result = await pool.query(
        'INSERT INTO categories (name, description, parent_category_id) VALUES ($1, $2, $3) RETURNING *',
        [name, description, parentCategoryId]
      );
      return result.rows[0];
    } catch (error) {
      if (error.code === '23505') {
        throw new Error(`Category with name '${name}' already exists`);
      }
      throw error;
    }
  }

  async getCategories(limit, offset, filters = {}) {
    let query = 'SELECT * FROM categories WHERE active = true';
    const params = [];

    if (filters.search) {
      params.push(`%${filters.search}%`);
      query += ` AND name ILIKE $${params.length}`;
    }

    query += ' ORDER BY name ASC LIMIT $' + (params.length + 1) + ' OFFSET $' + (params.length + 2);
    params.push(limit, offset);

    const result = await pool.query(query, params);
    return result.rows;
  }

  async getCategoryCount(filters = {}) {
    let query = 'SELECT COUNT(*) as total FROM categories WHERE active = true';
    const params = [];

    if (filters.search) {
      params.push(`%${filters.search}%`);
      query += ` AND name ILIKE $${params.length}`;
    }

    const result = await pool.query(query, params);
    return parseInt(result.rows[0].total, 10);
  }

  async getCategoryById(id) {
    const result = await pool.query('SELECT * FROM categories WHERE id = $1 AND active = true', [id]);
    return result.rows[0] || null;
  }

  async updateCategory(id, updates) {
    const allowedFields = ['name', 'description', 'parent_category_id', 'active'];
    const fields = [];
    const values = [];
    let paramCount = 1;

    for (const [key, value] of Object.entries(updates)) {
      if (allowedFields.includes(key) && value !== undefined) {
        fields.push(`${key} = $${paramCount}`);
        values.push(value);
        paramCount += 1;
      }
    }

    if (fields.length === 0) {
      return this.getCategoryById(id);
    }

    fields.push(`updated_at = CURRENT_TIMESTAMP`);
    values.push(id);

    const query = `UPDATE categories SET ${fields.join(', ')} WHERE id = $${paramCount} RETURNING *`;
    const result = await pool.query(query, values);

    return result.rows[0] || null;
  }

  async deleteCategory(id) {
    const result = await pool.query('UPDATE categories SET active = false WHERE id = $1 RETURNING *', [id]);
    return result.rows[0] || null;
  }
}

module.exports = new CategoryService();

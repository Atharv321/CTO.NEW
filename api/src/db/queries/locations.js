const pool = require('../connection');

const locationQueries = {
  // Create a new location
  async create(locationData) {
    const { name, address } = locationData;
    const query = `
      INSERT INTO locations (name, address)
      VALUES ($1, $2)
      RETURNING *
    `;
    const values = [name, address];
    const result = await pool.query(query, values);
    return result.rows[0];
  },

  // Get all locations
  async findAll() {
    const query = 'SELECT * FROM locations ORDER BY name';
    const result = await pool.query(query);
    return result.rows;
  },

  // Get location by ID
  async findById(id) {
    const query = 'SELECT * FROM locations WHERE id = $1';
    const result = await pool.query(query, [id]);
    return result.rows[0];
  },

  // Update location
  async update(id, locationData) {
    const { name, address } = locationData;
    const query = `
      UPDATE locations
      SET name = COALESCE($1, name),
          address = COALESCE($2, address)
      WHERE id = $3
      RETURNING *
    `;
    const values = [name, address, id];
    const result = await pool.query(query, values);
    return result.rows[0];
  },

  // Delete location
  async delete(id) {
    const query = 'DELETE FROM locations WHERE id = $1 RETURNING *';
    const result = await pool.query(query, [id]);
    return result.rows[0];
  }
};

module.exports = locationQueries;

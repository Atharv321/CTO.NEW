import db from './connection.js';
import bcrypt from 'bcryptjs';

async function seedData() {
  try {
    console.log('Seeding database...');

    // Seed users
    const hashedPassword = await bcrypt.hash('password123', 10);
    
    await db.query(`
      INSERT INTO users (email, name, password_hash, role) VALUES
        ('admin@restaurant.com', 'Admin User', $1, 'admin'),
        ('manager@restaurant.com', 'Manager User', $1, 'manager'),
        ('analyst@restaurant.com', 'Analyst User', $1, 'analyst'),
        ('staff@restaurant.com', 'Staff User', $1, 'staff')
      ON CONFLICT (email) DO NOTHING
    `, [hashedPassword]);

    // Seed locations
    await db.query(`
      INSERT INTO locations (name, address) VALUES
        ('Main Restaurant', '123 Main St, City, State 12345'),
        ('Downtown Branch', '456 Downtown Ave, City, State 12345'),
        ('Airport Location', '789 Airport Rd, City, State 12345')
      ON CONFLICT DO NOTHING
    `);

    // Get location IDs
    const locationsResult = await db.query('SELECT id FROM locations');
    const locationIds = locationsResult.rows.map(row => row.id);

    // Seed products
    await db.query(`
      INSERT INTO products (name, sku, category, unit, cost, price) VALUES
        ('Tomatoes', 'TOM001', 'Vegetables', 'kg', 2.50, 5.00),
        ('Lettuce', 'LET001', 'Vegetables', 'kg', 1.80, 4.50),
        ('Chicken Breast', 'CHK001', 'Meat', 'kg', 8.00, 15.00),
        ('Beef Steak', 'BEEF001', 'Meat', 'kg', 12.00, 25.00),
        ('Rice', 'RIC001', 'Grains', 'kg', 1.50, 4.00),
        ('Pasta', 'PAS001', 'Grains', 'kg', 2.00, 6.00),
        ('Olive Oil', 'OIL001', 'Oils', 'liter', 5.00, 12.00),
        ('Salt', 'SLT001', 'Spices', 'kg', 0.50, 2.00),
        ('Pepper', 'PEP001', 'Spices', 'kg', 3.00, 8.00),
        ('Flour', 'FLO001', 'Baking', 'kg', 1.20, 3.50)
      ON CONFLICT (sku) DO NOTHING
    `);

    // Get product IDs
    const productsResult = await db.query('SELECT id FROM products');
    const productIds = productsResult.rows.map(row => row.id);

    // Seed inventory items
    for (const locationId of locationIds) {
      for (const productId of productIds) {
        const quantity = Math.floor(Math.random() * 100) + 10;
        await db.query(`
          INSERT INTO inventory_items (product_id, location_id, quantity) 
          VALUES ($1, $2, $3)
          ON CONFLICT (product_id, location_id) DO UPDATE
          SET quantity = EXCLUDED.quantity
        `, [productId, locationId, quantity]);
      }
    }

    // Seed stock movements for the past 30 days
    const movementTypes = ['in', 'out', 'adjustment', 'waste'];
    const reasons = ['Purchase', 'Sale', 'Inventory Count', 'Spoilage', 'Damage', 'Theft', 'Transfer'];
    
    for (let i = 0; i < 30; i++) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      
      for (let j = 0; j < Math.floor(Math.random() * 10) + 5; j++) {
        const productId = productIds[Math.floor(Math.random() * productIds.length)];
        const locationId = locationIds[Math.floor(Math.random() * locationIds.length)];
        const type = movementTypes[Math.floor(Math.random() * movementTypes.length)];
        const reason = reasons[Math.floor(Math.random() * reasons.length)];
        const quantity = Math.floor(Math.random() * 20) + 1;
        
        await db.query(`
          INSERT INTO stock_movements (product_id, location_id, quantity, type, reason, created_at)
          VALUES ($1, $2, $3, $4, $5, $6)
        `, [productId, locationId, quantity, type, reason, date]);
      }
    }

    // Seed report definitions
    await db.query(`
      INSERT INTO report_definitions (name, type, schedule, is_active) VALUES
        ('Daily Inventory Valuation', 'valuation', '0 8 * * *', true),
        ('Weekly Turnover Report', 'turnover', '0 9 * * 1', true),
        ('Monthly Wastage Analysis', 'wastage', '0 10 1 * *', true),
        ('Location Performance Dashboard', 'performance', null, true)
      ON CONFLICT DO NOTHING
    `);

    console.log('Database seeded successfully');
  } catch (error) {
    console.error('Seeding failed:', error);
    throw error;
  } finally {
    await db.end();
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  seedData();
}

export default seedData;
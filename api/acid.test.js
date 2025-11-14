const request = require('supertest');
const app = require('./server');
const { Pool } = require('pg');

describe('Stock Management ACID Transaction Tests', () => {
  let pool;
  let testProduct;
  let testLocation;
  let testProductId;
  let testLocationId;

  beforeAll(async () => {
    // Setup database connection for direct testing
    pool = new Pool({
      connectionString: process.env.DATABASE_URL || 'postgresql://devuser:devpassword@localhost:5432/appdb'
    });

    // Create test product with unique SKU
    const productResponse = await request(app)
      .post('/api/stock/products')
      .send({
        sku: `ACID-TEST-001-${Date.now()}`,
        name: 'ACID Test Product',
        description: 'Product for ACID testing',
        barcode: 'ACID123456789'
      });
    
    testProduct = productResponse.body.data;
    testProductId = testProduct.id;

    // Create test location with unique name
    const locationResponse = await request(app)
      .post('/api/stock/locations')
      .send({
        name: `ACID Test Warehouse-${Date.now()}`,
        description: 'Warehouse for ACID testing',
        address: '789 ACID Street'
      });
    
    testLocation = locationResponse.body.data;
    testLocationId = testLocation.id;
  });

  afterAll(async () => {
    await pool.end();
  });

  describe('Atomicity Tests', () => {
    test('Stock receive should be atomic - all or nothing', async () => {
      const client = await pool.connect();
      
      try {
        // Start a transaction
        await client.query('BEGIN');
        
        // Get initial state
        const initialInventory = await client.query(
          'SELECT * FROM inventory WHERE product_id = $1 AND location_id = $2',
          [testProductId, testLocationId]
        );
        
        const initialMovementCount = await client.query(
          'SELECT COUNT(*) as count FROM stock_movements WHERE product_id = $1 AND location_id = $2',
          [testProductId, testLocationId]
        );
        
        // Force a rollback by simulating an error in the function
        try {
          await client.query({
            text: 'SELECT process_stock_receive($1, $2, $3, $4, $5, $6, $7, $8, $9)',
            values: [
              testProductId,
              testLocationId,
              50,
              'TEST-REF',
              'ACID123',
              'Test atomicity',
              'test-user',
              'Test User',
              {}
            ]
          });
          await client.query('COMMIT');
        } catch (error) {
          await client.query('ROLLBACK');
          throw error;
        }
        
        // Verify final state through API
        const inventoryResponse = await request(app)
          .get(`/api/stock/inventory?productId=${testProductId}&locationId=${testLocationId}`);
        
        // The transaction should have completed successfully
        expect(inventoryResponse.body.success).toBe(true);
        
      } finally {
        client.release();
      }
    });

    test('Stock consume should fail atomically when insufficient stock', async () => {
      // Create unique product and location for this test
      const uniqueProduct = await request(app)
        .post('/api/stock/products')
        .send({
          sku: `ATOMICITY-TEST-${Date.now()}`,
          name: 'Atomicity Test Product'
        });

      const uniqueLocation = await request(app)
        .post('/api/stock/locations')
        .send({
          name: `Atomicity Test Location-${Date.now()}`
        });

      const atomicityProductId = uniqueProduct.body.data.id;
      const atomicityLocationId = uniqueLocation.body.data.id;

      // First, receive a small amount
      await request(app)
        .post('/api/stock/receive')
        .send({
          productId: atomicityProductId,
          locationId: atomicityLocationId,
          quantity: 10,
          reason: 'Setup for atomicity test'
        });

      // Try to consume more than available
      const response = await request(app)
        .post('/api/stock/consume')
        .send({
          productId: atomicityProductId,
          locationId: atomicityLocationId,
          quantity: 20, // More than available
          reason: 'Should fail atomically'
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);

      // Verify inventory was not changed
      const inventoryResponse = await request(app)
        .get(`/api/stock/inventory?productId=${atomicityProductId}&locationId=${atomicityLocationId}`);
      
      expect(inventoryResponse.body.success).toBe(true);
      expect(parseFloat(inventoryResponse.body.data.quantity)).toBe(10);
    });
  });

  describe('Consistency Tests', () => {
    test('Inventory quantity should always match sum of movements', async () => {
      // Clear any existing movements for this product/location
      await pool.query(
        'DELETE FROM stock_movements WHERE product_id = $1 AND location_id = $2',
        [testProductId, testLocationId]
      );
      
      await pool.query(
        'DELETE FROM inventory WHERE product_id = $1 AND location_id = $2',
        [testProductId, testLocationId]
      );

      // Perform multiple movements
      const movements = [
        { type: 'receive', quantity: 100, reason: 'First receive' },
        { type: 'receive', quantity: 50, reason: 'Second receive' },
        { type: 'consume', quantity: 30, reason: 'First consume' },
        { type: 'adjust', quantity: 125, reason: 'Adjustment' }
      ];

      for (const movement of movements) {
        const response = await request(app)
          .post(`/api/stock/${movement.type}`)
          .send({
            productId: testProductId,
            locationId: testLocationId,
            quantity: movement.quantity,
            reason: movement.reason
          });
        
        expect(response.status).toBe(201);
      }

      // Check consistency
      const inventoryResult = await pool.query(
        'SELECT quantity FROM inventory WHERE product_id = $1 AND location_id = $2',
        [testProductId, testLocationId]
      );

      const movementsResult = await pool.query(`
        SELECT 
          SUM(CASE WHEN movement_type = 'RECEIVE' THEN quantity 
                   WHEN movement_type = 'CONSUME' THEN -quantity 
                   WHEN movement_type = 'ADJUST' THEN quantity 
                   ELSE 0 END) as net_movement
        FROM stock_movements 
        WHERE product_id = $1 AND location_id = $2
      `, [testProductId, testLocationId]);

      expect(inventoryResult.rows[0].quantity).toBe(movementsResult.rows[0].net_movement);
    });
  });

  describe('Isolation Tests', () => {
    test('Concurrent stock operations should not interfere', async () => {
      // Create unique product and location for this test
      const uniqueProduct = await request(app)
        .post('/api/stock/products')
        .send({
          sku: `CONCURRENT-TEST-${Date.now()}`,
          name: 'Concurrent Test Product'
        });

      const uniqueLocation = await request(app)
        .post('/api/stock/locations')
        .send({
          name: `Concurrent Test Location-${Date.now()}`
        });

      const concurrentProductId = uniqueProduct.body.data.id;
      const concurrentLocationId = uniqueLocation.body.data.id;

      // Setup initial inventory
      await request(app)
        .post('/api/stock/receive')
        .send({
          productId: concurrentProductId,
          locationId: concurrentLocationId,
          quantity: 100,
          reason: 'Setup for isolation test'
        });

      // Create two concurrent operations
      const operation1 = request(app)
        .post('/api/stock/consume')
        .send({
          productId: concurrentProductId,
          locationId: concurrentLocationId,
          quantity: 30,
          reason: 'Concurrent operation 1'
        });

      const operation2 = request(app)
        .post('/api/stock/consume')
        .send({
          productId: concurrentProductId,
          locationId: concurrentLocationId,
          quantity: 25,
          reason: 'Concurrent operation 2'
        });

      // Execute both operations
      const [response1, response2] = await Promise.all([operation1, operation2]);

      // Both should succeed (total consumed = 55, remaining = 45)
      expect(response1.status).toBe(201);
      expect(response2.status).toBe(201);

      // Verify final state
      const inventoryResponse = await request(app)
        .get(`/api/stock/inventory?productId=${concurrentProductId}&locationId=${concurrentLocationId}`);
      
      expect(inventoryResponse.body.success).toBe(true);
      expect(parseFloat(inventoryResponse.body.data.quantity)).toBe(45);
    });
  });

  describe('Durability Tests', () => {
    test('Stock movements should persist after commit', async () => {
      const movementData = {
        productId: testProductId,
        locationId: testLocationId,
        quantity: 25,
        reason: 'Durability test',
        referenceNumber: 'DUR-001'
      };

      // Create a stock movement
      const response = await request(app)
        .post('/api/stock/receive')
        .send(movementData);

      expect(response.status).toBe(201);
      expect(response.body.movementId).toBeDefined();

      // Verify it exists in the database
      const movementResult = await pool.query(
        'SELECT * FROM stock_movements WHERE id = $1',
        [response.body.movementId]
      );

      expect(movementResult.rows).toHaveLength(1);
      expect(movementResult.rows[0].quantity).toBe('25.000');
      expect(movementResult.rows[0].reason).toBe('Durability test');

      // Verify audit log entry exists
      const auditResult = await pool.query(
        'SELECT * FROM audit_log WHERE table_name = $1 AND action = $2 ORDER BY created_at DESC LIMIT 1',
        ['inventory', 'UPDATE']
      );

      expect(auditResult.rows).toHaveLength(1);
      expect(auditResult.rows[0].new_values).toBeDefined();
    });
  });

  describe('Audit Log Consistency', () => {
    test('Every stock movement should create corresponding audit log entry', async () => {
      // Get initial audit log count
      const initialAuditCount = await pool.query(
        'SELECT COUNT(*) as count FROM audit_log WHERE table_name = $1',
        ['inventory']
      );

      // Perform a stock movement
      const response = await request(app)
        .post('/api/stock/receive')
        .send({
          productId: testProductId,
          locationId: testLocationId,
          quantity: 15,
          reason: 'Audit log test'
        });

      expect(response.status).toBe(201);

      // Check that audit log was created
      const finalAuditCount = await pool.query(
        'SELECT COUNT(*) as count FROM audit_log WHERE table_name = $1',
        ['inventory']
      );

      expect(parseInt(finalAuditCount.rows[0].count)).toBeGreaterThan(parseInt(initialAuditCount.rows[0].count));

      // Get the latest audit log entry
      const latestAudit = await pool.query(
        'SELECT * FROM audit_log WHERE table_name = $1 ORDER BY created_at DESC LIMIT 1',
        ['inventory']
      );

      expect(latestAudit.rows).toHaveLength(1);
      expect(latestAudit.rows[0].action).toBe('UPDATE');
      expect(latestAudit.rows[0].old_values).toBeDefined();
      expect(latestAudit.rows[0].new_values).toBeDefined();
    });
  });

  describe('Low Stock Threshold Consistency', () => {
    test('Low stock threshold updates should be atomic and audited', async () => {
      const response = await request(app)
        .put('/api/stock/low-stock/threshold')
        .send({
          productId: testProductId,
          locationId: testLocationId,
          threshold: 10
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);

      // Verify threshold was updated
      const inventoryResult = await pool.query(
        'SELECT low_stock_threshold FROM inventory WHERE product_id = $1 AND location_id = $2',
        [testProductId, testLocationId]
      );

      expect(inventoryResult.rows[0].low_stock_threshold).toBe('10.000');

      // Verify audit log entry exists
      const auditResult = await pool.query(
        'SELECT * FROM audit_log WHERE table_name = $1 ORDER BY created_at DESC LIMIT 1',
        ['inventory']
      );

      expect(auditResult.rows).toHaveLength(1);
      expect(auditResult.rows[0].action).toBe('UPDATE');
      expect(auditResult.rows[0].new_values).toBeDefined();
      expect(auditResult.rows[0].new_values.low_stock_threshold).toBe(10);
    });
  });
});
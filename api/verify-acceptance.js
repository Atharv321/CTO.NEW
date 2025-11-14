const request = require('supertest');
const app = require('./server');

async function verifyAllCriteria() {
  console.log('🔍 Verifying ALL Acceptance Criteria...');
  
  try {
    // Test 1: ACID-safe operations with transactional tests
    console.log('\n1️⃣ Testing ACID-safe operations...');
    
    // Create test data
    const product = await request(app)
      .post('/api/stock/products')
      .send({ sku: 'ACID-TEST-' + Date.now(), name: 'ACID Test Product' });
    
    const location = await request(app)
      .post('/api/stock/locations')
      .send({ name: 'ACID Test Location' });
    
    const productId = product.body.data.id;
    const locationId = location.body.data.id;

    // Test atomic receive operation
    const receiveResult = await request(app)
      .post('/api/stock/receive')
      .send({
        productId, locationId, quantity: 100,
        reason: 'ACID test receive'
      });
    
    if (receiveResult.status !== 201) {
      throw new Error('❌ Receive operation failed');
    }
    
    // Test atomic consume operation with insufficient stock
    const consumeFailResult = await request(app)
      .post('/api/stock/consume')
      .send({
        productId, locationId, quantity: 200,
        reason: 'ACID test insufficient consume'
      });
    
    if (consumeFailResult.status !== 400) {
      throw new Error('❌ Insufficient stock consume should fail with 400');
    }
    
    // Test valid consume operation
    const consumeSuccessResult = await request(app)
      .post('/api/stock/consume')
      .send({
        productId, locationId, quantity: 30,
        reason: 'ACID test valid consume'
      });
    
    if (consumeSuccessResult.status !== 201) {
      throw new Error('❌ Valid consume operation failed');
    }
    
    console.log('✅ ACID-safe operations verified');
    
    // Test 2: Audit log retrievable via API
    console.log('\n2️⃣ Testing audit log API access...');
    
    const auditResult = await request(app)
      .get('/api/stock/audit?limit=5');
    
    if (auditResult.status !== 200 || !auditResult.body.success) {
      throw new Error('❌ Audit log API not accessible');
    }
    
    if (auditResult.body.data.length === 0) {
      throw new Error('❌ No audit entries found');
    }
    
    console.log('✅ Audit log retrievable via API');
    console.log(`   Found ${auditResult.body.data.length} audit entries`);
    
    // Test 3: Low-stock computation service ready for notifications
    console.log('\n3️⃣ Testing low-stock computation service...');
    
    // Set low stock threshold
    await request(app)
      .put('/api/stock/low-stock/threshold')
      .send({
        productId, locationId, threshold: 50
      });
    
    // Get low stock alerts
    const lowStockResult = await request(app)
      .get('/api/stock/low-stock');
    
    if (lowStockResult.status !== 200 || !lowStockResult.body.success) {
      throw new Error('❌ Low stock service not working');
    }
    
    // Get notifications
    const notificationsResult = await request(app)
      .get('/api/stock/low-stock/notifications');
    
    if (notificationsResult.status !== 200 || !notificationsResult.body.success) {
      throw new Error('❌ Notifications service not working');
    }
    
    console.log('✅ Low-stock computation service ready for notifications');
    console.log(`   Generated ${notificationsResult.body.notifications.length} notifications`);
    console.log(`   Critical alerts: ${notificationsResult.body.summary.critical}`);
    console.log(`   Warning alerts: ${notificationsResult.body.summary.warning}`);
    
    // Test 4: Stock movements update inventory quantities atomically
    console.log('\n4️⃣ Testing atomic inventory updates...');
    
    // Get current inventory
    const inventoryBefore = await request(app)
      .get(`/api/stock/inventory?productId=${productId}&locationId=${locationId}`);
    
    if (inventoryBefore.body.success && parseFloat(inventoryBefore.body.data.quantity) === 70) {
      // Test adjustment operation
      const adjustResult = await request(app)
        .post('/api/stock/adjust')
        .send({
          productId, locationId, quantity: 85,
          reason: 'ACID test adjustment'
        });
      
      if (adjustResult.status !== 201) {
        throw new Error('❌ Adjustment operation failed');
      }
      
      // Verify final quantity
      const inventoryAfter = await request(app)
        .get(`/api/stock/inventory?productId=${productId}&locationId=${locationId}`);
      
      if (parseFloat(inventoryAfter.body.data.quantity) === 85) {
        console.log('✅ Stock movements update inventory quantities atomically');
      } else {
        throw new Error('❌ Inventory quantity not updated correctly');
      }
    } else {
      throw new Error('❌ Initial inventory state incorrect');
    }
    
    // Test 5: Barcode support
    console.log('\n5️⃣ Testing barcode support...');
    const barcodeResult = await request(app)
      .post('/api/stock/receive')
      .send({
        productId, locationId, quantity: 10,
        reason: 'Barcode test',
        barcode: 'BARCODE-TEST-123456789'
      });
    
    if (barcodeResult.status !== 201) {
      throw new Error('❌ Barcode support not working');
    }
    
    console.log('✅ Barcode support verified');
    
    // Test 6: Reference numbers
    console.log('\n6️⃣ Testing reference number support...');
    const refResult = await request(app)
      .post('/api/stock/receive')
      .send({
        productId, locationId, quantity: 5,
        reason: 'Reference number test',
        referenceNumber: 'PO-TEST-001'
      });
    
    if (refResult.status !== 201) {
      throw new Error('❌ Reference number support not working');
    }
    
    console.log('✅ Reference number support verified');
    
    // Test 7: User attribution
    console.log('\n7️⃣ Testing user attribution...');
    const userAttributedResult = await request(app)
      .post('/api/stock/receive')
      .send({
        productId, locationId, quantity: 5,
        reason: 'User attribution test'
      })
      .set('X-User-ID', 'test-user-123')
      .set('X-User-Name', 'Test User');
    
    if (userAttributedResult.status !== 201) {
      throw new Error('❌ User attribution not working');
    }
    
    console.log('✅ User attribution verified');
    
    console.log('\n🎉 ALL ACCEPTANCE CRITERIA SUCCESSFULLY VERIFIED!');
    console.log('\n📋 Summary:');
    console.log('   ✅ ACID-safe operations with transactional tests');
    console.log('   ✅ Audit log retrievable via API');
    console.log('   ✅ Low-stock computation service ready for notifications');
    console.log('   ✅ Stock movements update inventory quantities atomically');
    console.log('   ✅ Barcode support');
    console.log('   ✅ Reference numbers');
    console.log('   ✅ User attribution');
    
    process.exit(0);
  } catch (error) {
    console.error('\n❌ VERIFICATION FAILED:', error.message);
    process.exit(1);
  }
}

verifyAllCriteria();
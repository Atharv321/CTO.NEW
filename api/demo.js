#!/usr/bin/env node

/**
 * Stock Management API Demo
 * 
 * This script demonstrates the stock management API functionality
 * by creating products, locations, and performing stock movements.
 */

const request = require('supertest');
const app = require('./server');

const API_BASE = '/api/stock';

class StockDemo {
  constructor() {
    this.testData = {
      products: [],
      locations: [],
      movements: []
    };
  }

  async sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async log(message, data = null) {
    console.log(`\n📋 ${message}`);
    if (data) {
      console.log(JSON.stringify(data, null, 2));
    }
  }

  async createProduct(sku, name, description = '', barcode = '') {
    const response = await request(app)
      .post(`${API_BASE}/products`)
      .send({ sku, name, description, barcode });

    if (response.status === 201) {
      this.testData.products.push(response.body.data);
      await this.log(`✅ Created Product: ${name}`, response.body.data);
      return response.body.data;
    } else {
      await this.log(`❌ Failed to create product: ${name}`, response.body);
      return null;
    }
  }

  async createLocation(name, description = '', address = '') {
    const response = await request(app)
      .post(`${API_BASE}/locations`)
      .send({ name, description, address });

    if (response.status === 201) {
      this.testData.locations.push(response.body.data);
      await this.log(`✅ Created Location: ${name}`, response.body.data);
      return response.body.data;
    } else {
      await this.log(`❌ Failed to create location: ${name}`, response.body);
      return null;
    }
  }

  async receiveStock(productId, locationId, quantity, reason, referenceNumber = '') {
    const response = await request(app)
      .post(`${API_BASE}/receive`)
      .send({
        productId,
        locationId,
        quantity,
        reason,
        referenceNumber,
        barcode: `DEMO-${Date.now()}`
      });

    if (response.status === 201) {
      this.testData.movements.push({
        type: 'RECEIVE',
        ...response.body
      });
      await this.log(`✅ Received ${quantity} units`, response.body);
      return response.body;
    } else {
      await this.log(`❌ Failed to receive stock`, response.body);
      return null;
    }
  }

  async consumeStock(productId, locationId, quantity, reason, referenceNumber = '') {
    const response = await request(app)
      .post(`${API_BASE}/consume`)
      .send({
        productId,
        locationId,
        quantity,
        reason,
        referenceNumber,
        barcode: `DEMO-${Date.now()}`
      });

    if (response.status === 201) {
      this.testData.movements.push({
        type: 'CONSUME',
        ...response.body
      });
      await this.log(`✅ Consumed ${quantity} units`, response.body);
      return response.body;
    } else {
      await this.log(`❌ Failed to consume stock`, response.body);
      return null;
    }
  }

  async adjustStock(productId, locationId, quantity, reason, referenceNumber = '') {
    const response = await request(app)
      .post(`${API_BASE}/adjust`)
      .send({
        productId,
        locationId,
        quantity,
        reason,
        referenceNumber
      });

    if (response.status === 201) {
      this.testData.movements.push({
        type: 'ADJUST',
        ...response.body
      });
      await this.log(`✅ Adjusted stock to ${quantity} units`, response.body);
      return response.body;
    } else {
      await this.log(`❌ Failed to adjust stock`, response.body);
      return null;
    }
  }

  async getInventory(productId, locationId) {
    const response = await request(app)
      .get(`${API_BASE}/inventory?productId=${productId}&locationId=${locationId}`);

    if (response.status === 200) {
      await this.log(`📦 Current Inventory`, response.body.data);
      return response.body.data;
    } else {
      await this.log(`❌ Failed to get inventory`, response.body);
      return null;
    }
  }

  async updateLowStockThreshold(productId, locationId, threshold) {
    const response = await request(app)
      .put(`${API_BASE}/low-stock/threshold`)
      .send({
        productId,
        locationId,
        threshold
      });

    if (response.status === 200) {
      await this.log(`⚠️ Updated low stock threshold to ${threshold}`, response.body);
      return response.body;
    } else {
      await this.log(`❌ Failed to update threshold`, response.body);
      return null;
    }
  }

  async getLowStockAlerts() {
    const response = await request(app)
      .get(`${API_BASE}/low-stock`);

    if (response.status === 200) {
      await this.log(`⚠️ Low Stock Alerts`, {
        count: response.body.count,
        items: response.body.data
      });
      return response.body;
    } else {
      await this.log(`❌ Failed to get low stock alerts`, response.body);
      return null;
    }
  }

  async getNotifications() {
    const response = await request(app)
      .get(`${API_BASE}/low-stock/notifications`);

    if (response.status === 200) {
      await this.log(`🔔 Stock Notifications`, {
        summary: response.body.summary,
        notifications: response.body.notifications.slice(0, 2) // Show first 2
      });
      return response.body;
    } else {
      await this.log(`❌ Failed to get notifications`, response.body);
      return null;
    }
  }

  async getStockHealth() {
    const response = await request(app)
      .get(`${API_BASE}/low-stock/health`);

    if (response.status === 200) {
      await this.log(`🏥 Stock Health Metrics`, response.body.data);
      return response.body;
    } else {
      await this.log(`❌ Failed to get stock health`, response.body);
      return null;
    }
  }

  async getStockHistory() {
    const response = await request(app)
      .get(`${API_BASE}/history?limit=5`);

    if (response.status === 200) {
      await this.log(`📜 Recent Stock History`, {
        count: response.body.count,
        movements: response.body.data
      });
      return response.body;
    } else {
      await this.log(`❌ Failed to get stock history`, response.body);
      return null;
    }
  }

  async getAuditLog() {
    const response = await request(app)
      .get(`${API_BASE}/audit?limit=3`);

    if (response.status === 200) {
      await this.log(`🔍 Recent Audit Log Entries`, {
        count: response.body.count,
        entries: response.body.data
      });
      return response.body;
    } else {
      await this.log(`❌ Failed to get audit log`, response.body);
      return null;
    }
  }

  async runDemo() {
    await this.log('🚀 Starting Stock Management API Demo');

    try {
      // 1. Create test products
      await this.log('\n=== Creating Products ===');
      const laptop = await this.createProduct(
        'LAPTOP-001',
        'Business Laptop',
        'High-performance laptop for business use',
        '1234567890123'
      );

      const mouse = await this.createProduct(
        'MOUSE-001',
        'Wireless Mouse',
        'Ergonomic wireless mouse',
        '2345678901234'
      );

      // 2. Create test locations
      await this.log('\n=== Creating Locations ===');
      const warehouse = await this.createLocation(
        'Main Warehouse',
        'Primary storage facility',
        '123 Storage Street, Warehouse City'
      );

      const store = await this.createLocation(
        'Downtown Store',
        'Retail storefront location',
        '456 Retail Avenue, Shopping District'
      );

      if (!laptop || !mouse || !warehouse || !store) {
        throw new Error('Failed to create test data');
      }

      // 3. Initial stock receipts
      await this.log('\n=== Receiving Initial Stock ===');
      await this.receiveStock(
        laptop.id,
        warehouse.id,
        50,
        'Initial inventory receipt',
        'PO-2024-001'
      );

      await this.receiveStock(
        mouse.id,
        warehouse.id,
        200,
        'Initial inventory receipt',
        'PO-2024-002'
      );

      await this.receiveStock(
        laptop.id,
        store.id,
        10,
        'Transfer to retail store',
        'TRANSFER-001'
      );

      // 4. Set low stock thresholds
      await this.log('\n=== Setting Low Stock Thresholds ===');
      await this.updateLowStockThreshold(laptop.id, warehouse.id, 15);
      await this.updateLowStockThreshold(mouse.id, warehouse.id, 50);
      await this.updateLowStockThreshold(laptop.id, store.id, 5);

      // 5. Stock consumption
      await this.log('\n=== Stock Consumption ===');
      await this.consumeStock(
        laptop.id,
        warehouse.id,
        25,
        'Online orders fulfillment',
        'ORDER-001'
      );

      await this.consumeStock(
        mouse.id,
        warehouse.id,
        120,
        'Bulk order for corporate client',
        'ORDER-002'
      );

      await this.consumeStock(
        laptop.id,
        store.id,
        6,
        'In-store sales',
        'STORE-SALE-001'
      );

      // 6. Stock adjustment
      await this.log('\n=== Stock Adjustment ===');
      await this.adjustStock(
        laptop.id,
        warehouse.id,
        28,
        'Physical count correction',
        'COUNT-2024-Q1'
      );

      // 7. Check current inventory
      await this.log('\n=== Current Inventory Status ===');
      await this.getInventory(laptop.id, warehouse.id);
      await this.getInventory(mouse.id, warehouse.id);
      await this.getInventory(laptop.id, store.id);

      // 8. Check low stock alerts
      await this.log('\n=== Low Stock Monitoring ===');
      await this.getLowStockAlerts();
      await this.getNotifications();

      // 9. Stock health and analytics
      await this.log('\n=== Stock Analytics ===');
      await this.getStockHealth();

      // 10. Stock history
      await this.log('\n=== Movement History ===');
      await this.getStockHistory();

      // 11. Audit log
      await this.log('\n=== Audit Trail ===');
      await this.getAuditLog();

      // 12. Demo summary
      await this.log('\n=== Demo Summary ===');
      await this.log('✅ Demo completed successfully!', {
        productsCreated: this.testData.products.length,
        locationsCreated: this.testData.locations.length,
        movementsCompleted: this.testData.movements.length,
        endpointsTested: [
          'POST /products',
          'POST /locations', 
          'POST /receive',
          'POST /consume',
          'POST /adjust',
          'PUT /low-stock/threshold',
          'GET /inventory',
          'GET /low-stock',
          'GET /low-stock/notifications',
          'GET /low-stock/health',
          'GET /history',
          'GET /audit'
        ]
      });

    } catch (error) {
      await this.log(`❌ Demo failed: ${error.message}`);
    }
  }
}

// Run the demo if this file is executed directly
if (require.main === module) {
  const demo = new StockDemo();
  demo.runDemo().catch(console.error);
}

module.exports = StockDemo;
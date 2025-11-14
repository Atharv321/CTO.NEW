const express = require('express');
const purchaseOrderQueries = require('../db/queries/purchaseOrders');

const router = express.Router();

// Get all purchase orders
router.get('/', async (req, res) => {
  try {
    const { page, limit, status, supplier_id, location_id } = req.query;
    const options = {
      page: page ? parseInt(page) : 1,
      limit: limit ? parseInt(limit) : 50,
      status: status || null,
      supplier_id: supplier_id ? parseInt(supplier_id) : null,
      location_id: location_id ? parseInt(location_id) : null
    };
    
    const result = await purchaseOrderQueries.findAll(options);
    res.json(result);
  } catch (error) {
    console.error('Error fetching purchase orders:', error);
    res.status(500).json({ error: 'Failed to fetch purchase orders', message: error.message });
  }
});

// Get purchase order by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const po = await purchaseOrderQueries.findById(id);
    
    if (!po) {
      return res.status(404).json({ error: 'Purchase order not found' });
    }
    
    res.json(po);
  } catch (error) {
    console.error('Error fetching purchase order:', error);
    res.status(500).json({ error: 'Failed to fetch purchase order', message: error.message });
  }
});

// Create new purchase order (draft)
router.post('/', async (req, res) => {
  try {
    const poData = req.body;
    
    // Validate required fields
    if (!poData.supplier_id) {
      return res.status(400).json({ error: 'supplier_id is required' });
    }
    
    if (!poData.location_id) {
      return res.status(400).json({ error: 'location_id is required' });
    }
    
    const po = await purchaseOrderQueries.create(poData);
    res.status(201).json(po);
  } catch (error) {
    console.error('Error creating purchase order:', error);
    res.status(500).json({ error: 'Failed to create purchase order', message: error.message });
  }
});

// Update purchase order (only draft)
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const poData = req.body;
    
    const po = await purchaseOrderQueries.update(id, poData);
    res.json(po);
  } catch (error) {
    console.error('Error updating purchase order:', error);
    
    if (error.message.includes('not found')) {
      return res.status(404).json({ error: error.message });
    }
    
    if (error.message.includes('only update draft')) {
      return res.status(400).json({ error: error.message });
    }
    
    res.status(500).json({ error: 'Failed to update purchase order', message: error.message });
  }
});

// Submit purchase order
router.post('/:id/submit', async (req, res) => {
  try {
    const { id } = req.params;
    const po = await purchaseOrderQueries.submit(id);
    res.json(po);
  } catch (error) {
    console.error('Error submitting purchase order:', error);
    
    if (error.message.includes('not found')) {
      return res.status(404).json({ error: error.message });
    }
    
    if (error.message.includes('only submit draft') || error.message.includes('without items')) {
      return res.status(400).json({ error: error.message });
    }
    
    res.status(500).json({ error: 'Failed to submit purchase order', message: error.message });
  }
});

// Receive purchase order items
router.post('/:id/receive', async (req, res) => {
  try {
    const { id } = req.params;
    const { items } = req.body;
    
    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'items array is required' });
    }
    
    // Validate items format
    for (const item of items) {
      if (!item.item_id || !item.received_quantity) {
        return res.status(400).json({ error: 'Each item must have item_id and received_quantity' });
      }
      
      if (item.received_quantity <= 0) {
        return res.status(400).json({ error: 'received_quantity must be greater than 0' });
      }
    }
    
    const po = await purchaseOrderQueries.receive(id, items);
    res.json(po);
  } catch (error) {
    console.error('Error receiving purchase order:', error);
    
    if (error.message.includes('not found')) {
      return res.status(404).json({ error: error.message });
    }
    
    if (error.message.includes('only receive submitted')) {
      return res.status(400).json({ error: error.message });
    }
    
    res.status(500).json({ error: 'Failed to receive purchase order', message: error.message });
  }
});

// Cancel purchase order
router.post('/:id/cancel', async (req, res) => {
  try {
    const { id } = req.params;
    const po = await purchaseOrderQueries.cancel(id);
    res.json(po);
  } catch (error) {
    console.error('Error cancelling purchase order:', error);
    
    if (error.message.includes('not found')) {
      return res.status(404).json({ error: error.message });
    }
    
    if (error.message.includes('Cannot cancel received')) {
      return res.status(400).json({ error: error.message });
    }
    
    res.status(500).json({ error: 'Failed to cancel purchase order', message: error.message });
  }
});

// Export purchase order summary (CSV/PDF placeholder)
router.get('/:id/export', async (req, res) => {
  try {
    const { id } = req.params;
    const { format = 'csv' } = req.query;
    
    const po = await purchaseOrderQueries.findById(id);
    
    if (!po) {
      return res.status(404).json({ error: 'Purchase order not found' });
    }
    
    if (format === 'csv') {
      // CSV export
      let csv = 'PO Number,Supplier,Location,Status,Total Amount,Created At\n';
      csv += `${po.po_number},${po.supplier_name},${po.location_name},${po.status},${po.total_amount},${po.created_at}\n\n`;
      csv += 'Item SKU,Item Name,Quantity,Unit Price,Line Total,Received Quantity\n';
      
      for (const item of po.items) {
        csv += `${item.sku},${item.name},${item.quantity},${item.unit_price},${item.line_total},${item.received_quantity}\n`;
      }
      
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="PO-${po.po_number}.csv"`);
      res.send(csv);
    } else if (format === 'pdf') {
      // PDF export (placeholder - would use a library like pdfkit in production)
      res.json({
        message: 'PDF export not yet implemented',
        placeholder: true,
        po_number: po.po_number,
        supplier: po.supplier_name,
        total_amount: po.total_amount,
        items_count: po.items.length
      });
    } else {
      res.status(400).json({ error: 'Invalid format. Use csv or pdf' });
    }
  } catch (error) {
    console.error('Error exporting purchase order:', error);
    res.status(500).json({ error: 'Failed to export purchase order', message: error.message });
  }
});

// Delete purchase order (only draft)
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const po = await purchaseOrderQueries.delete(id);
    res.json({ message: 'Purchase order deleted successfully', po });
  } catch (error) {
    console.error('Error deleting purchase order:', error);
    
    if (error.message.includes('not found')) {
      return res.status(404).json({ error: error.message });
    }
    
    if (error.message.includes('only delete draft')) {
      return res.status(400).json({ error: error.message });
    }
    
    res.status(500).json({ error: 'Failed to delete purchase order', message: error.message });
  }
});

module.exports = router;

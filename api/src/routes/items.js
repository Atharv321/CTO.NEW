const express = require('express');
const itemQueries = require('../db/queries/items');

const router = express.Router();

// Get all items
router.get('/', async (req, res) => {
  try {
    const { page, limit, category, status, search } = req.query;
    const options = {
      page: page ? parseInt(page) : 1,
      limit: limit ? parseInt(limit) : 50,
      category: category || null,
      status: status || 'active',
      search: search || null
    };
    
    const result = await itemQueries.findAll(options);
    res.json(result);
  } catch (error) {
    console.error('Error fetching items:', error);
    res.status(500).json({ error: 'Failed to fetch items', message: error.message });
  }
});

// Get low stock items
router.get('/low-stock', async (req, res) => {
  try {
    const { threshold } = req.query;
    const items = await itemQueries.findLowStock(threshold ? parseInt(threshold) : 10);
    res.json(items);
  } catch (error) {
    console.error('Error fetching low stock items:', error);
    res.status(500).json({ error: 'Failed to fetch low stock items', message: error.message });
  }
});

// Get item by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const item = await itemQueries.findById(id);
    
    if (!item) {
      return res.status(404).json({ error: 'Item not found' });
    }
    
    res.json(item);
  } catch (error) {
    console.error('Error fetching item:', error);
    res.status(500).json({ error: 'Failed to fetch item', message: error.message });
  }
});

// Get item by barcode
router.get('/barcode/:barcode', async (req, res) => {
  try {
    const { barcode } = req.params;
    const item = await itemQueries.findByBarcode(barcode);
    
    if (!item) {
      return res.status(404).json({ error: 'Item not found', barcode });
    }
    
    res.json(item);
  } catch (error) {
    console.error('Error fetching item by barcode:', error);
    res.status(500).json({ error: 'Failed to fetch item', message: error.message });
  }
});

// Create new item
router.post('/', async (req, res) => {
  try {
    const itemData = req.body;
    
    // Validate required fields
    if (!itemData.sku || !itemData.name) {
      return res.status(400).json({ error: 'SKU and name are required' });
    }
    
    const item = await itemQueries.create(itemData);
    res.status(201).json(item);
  } catch (error) {
    console.error('Error creating item:', error);
    
    // Handle unique constraint violations
    if (error.code === '23505') {
      return res.status(409).json({ error: 'SKU or barcode already exists', message: error.message });
    }
    
    res.status(500).json({ error: 'Failed to create item', message: error.message });
  }
});

// Update item
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const itemData = req.body;
    
    const item = await itemQueries.update(id, itemData);
    
    if (!item) {
      return res.status(404).json({ error: 'Item not found' });
    }
    
    res.json(item);
  } catch (error) {
    console.error('Error updating item:', error);
    
    // Handle unique constraint violations
    if (error.code === '23505') {
      return res.status(409).json({ error: 'SKU or barcode already exists', message: error.message });
    }
    
    res.status(500).json({ error: 'Failed to update item', message: error.message });
  }
});

// Adjust stock quantity
router.patch('/:id/adjust', async (req, res) => {
  try {
    const { id } = req.params;
    const { adjustment, reason } = req.body;
    
    if (adjustment === undefined) {
      return res.status(400).json({ error: 'adjustment is required' });
    }
    
    const item = await itemQueries.adjustStock(id, adjustment, reason);
    
    if (!item) {
      return res.status(404).json({ error: 'Item not found' });
    }
    
    res.json(item);
  } catch (error) {
    console.error('Error adjusting stock:', error);
    res.status(500).json({ error: 'Failed to adjust stock', message: error.message });
  }
});

// Delete item
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const item = await itemQueries.delete(id);
    
    if (!item) {
      return res.status(404).json({ error: 'Item not found' });
    }
    
    res.json({ message: 'Item deleted successfully', item });
  } catch (error) {
    console.error('Error deleting item:', error);
    
    // Handle foreign key constraint violations
    if (error.code === '23503') {
      return res.status(409).json({ 
        error: 'Cannot delete item that is referenced in purchase orders or other records',
        message: error.message 
      });
    }
    
    res.status(500).json({ error: 'Failed to delete item', message: error.message });
  }
});

module.exports = router;

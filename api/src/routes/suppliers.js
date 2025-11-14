const express = require('express');
const supplierQueries = require('../db/queries/suppliers');

const router = express.Router();

// Get all suppliers
router.get('/', async (req, res) => {
  try {
    const { page, limit, active, search } = req.query;
    const options = {
      page: page ? parseInt(page) : 1,
      limit: limit ? parseInt(limit) : 50,
      active: active !== undefined ? active === 'true' : null,
      search: search || null
    };
    
    const result = await supplierQueries.findAll(options);
    res.json(result);
  } catch (error) {
    console.error('Error fetching suppliers:', error);
    res.status(500).json({ error: 'Failed to fetch suppliers', message: error.message });
  }
});

// Get supplier by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const supplier = await supplierQueries.findByIdWithItems(id);
    
    if (!supplier) {
      return res.status(404).json({ error: 'Supplier not found' });
    }
    
    res.json(supplier);
  } catch (error) {
    console.error('Error fetching supplier:', error);
    res.status(500).json({ error: 'Failed to fetch supplier', message: error.message });
  }
});

// Create new supplier
router.post('/', async (req, res) => {
  try {
    const supplierData = req.body;
    
    // Validate required fields
    if (!supplierData.name) {
      return res.status(400).json({ error: 'Supplier name is required' });
    }
    
    const supplier = await supplierQueries.create(supplierData);
    res.status(201).json(supplier);
  } catch (error) {
    console.error('Error creating supplier:', error);
    res.status(500).json({ error: 'Failed to create supplier', message: error.message });
  }
});

// Update supplier
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const supplierData = req.body;
    
    const supplier = await supplierQueries.update(id, supplierData);
    
    if (!supplier) {
      return res.status(404).json({ error: 'Supplier not found' });
    }
    
    res.json(supplier);
  } catch (error) {
    console.error('Error updating supplier:', error);
    res.status(500).json({ error: 'Failed to update supplier', message: error.message });
  }
});

// Delete supplier (soft delete)
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { hard } = req.query;
    
    let supplier;
    if (hard === 'true') {
      supplier = await supplierQueries.hardDelete(id);
    } else {
      supplier = await supplierQueries.delete(id);
    }
    
    if (!supplier) {
      return res.status(404).json({ error: 'Supplier not found' });
    }
    
    res.json({ message: 'Supplier deleted successfully', supplier });
  } catch (error) {
    console.error('Error deleting supplier:', error);
    res.status(500).json({ error: 'Failed to delete supplier', message: error.message });
  }
});

// Add preferred item to supplier
router.post('/:id/items', async (req, res) => {
  try {
    const { id } = req.params;
    const itemData = req.body;
    
    // Validate required fields
    if (!itemData.item_id || !itemData.unit_price) {
      return res.status(400).json({ error: 'item_id and unit_price are required' });
    }
    
    const preferredItem = await supplierQueries.addPreferredItem(id, itemData);
    res.status(201).json(preferredItem);
  } catch (error) {
    console.error('Error adding preferred item:', error);
    res.status(500).json({ error: 'Failed to add preferred item', message: error.message });
  }
});

// Remove preferred item from supplier
router.delete('/:id/items/:itemId', async (req, res) => {
  try {
    const { id, itemId } = req.params;
    const result = await supplierQueries.removePreferredItem(id, itemId);
    
    if (!result) {
      return res.status(404).json({ error: 'Preferred item not found' });
    }
    
    res.json({ message: 'Preferred item removed successfully' });
  } catch (error) {
    console.error('Error removing preferred item:', error);
    res.status(500).json({ error: 'Failed to remove preferred item', message: error.message });
  }
});

// Link supplier to location
router.post('/:id/locations', async (req, res) => {
  try {
    const { id } = req.params;
    const { location_id } = req.body;
    
    if (!location_id) {
      return res.status(400).json({ error: 'location_id is required' });
    }
    
    const result = await supplierQueries.addLocation(id, location_id);
    res.status(201).json(result);
  } catch (error) {
    console.error('Error adding location:', error);
    res.status(500).json({ error: 'Failed to add location', message: error.message });
  }
});

// Unlink supplier from location
router.delete('/:id/locations/:locationId', async (req, res) => {
  try {
    const { id, locationId } = req.params;
    const result = await supplierQueries.removeLocation(id, locationId);
    
    if (!result) {
      return res.status(404).json({ error: 'Location link not found' });
    }
    
    res.json({ message: 'Location removed successfully' });
  } catch (error) {
    console.error('Error removing location:', error);
    res.status(500).json({ error: 'Failed to remove location', message: error.message });
  }
});

module.exports = router;

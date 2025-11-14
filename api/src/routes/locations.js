const express = require('express');
const locationQueries = require('../db/queries/locations');

const router = express.Router();

// Get all locations
router.get('/', async (req, res) => {
  try {
    const locations = await locationQueries.findAll();
    res.json(locations);
  } catch (error) {
    console.error('Error fetching locations:', error);
    res.status(500).json({ error: 'Failed to fetch locations', message: error.message });
  }
});

// Get location by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const location = await locationQueries.findById(id);
    
    if (!location) {
      return res.status(404).json({ error: 'Location not found' });
    }
    
    res.json(location);
  } catch (error) {
    console.error('Error fetching location:', error);
    res.status(500).json({ error: 'Failed to fetch location', message: error.message });
  }
});

// Create new location
router.post('/', async (req, res) => {
  try {
    const locationData = req.body;
    
    // Validate required fields
    if (!locationData.name) {
      return res.status(400).json({ error: 'Location name is required' });
    }
    
    const location = await locationQueries.create(locationData);
    res.status(201).json(location);
  } catch (error) {
    console.error('Error creating location:', error);
    res.status(500).json({ error: 'Failed to create location', message: error.message });
  }
});

// Update location
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const locationData = req.body;
    
    const location = await locationQueries.update(id, locationData);
    
    if (!location) {
      return res.status(404).json({ error: 'Location not found' });
    }
    
    res.json(location);
  } catch (error) {
    console.error('Error updating location:', error);
    res.status(500).json({ error: 'Failed to update location', message: error.message });
  }
});

// Delete location
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const location = await locationQueries.delete(id);
    
    if (!location) {
      return res.status(404).json({ error: 'Location not found' });
    }
    
    res.json({ message: 'Location deleted successfully', location });
  } catch (error) {
    console.error('Error deleting location:', error);
    
    // Handle foreign key constraint violations
    if (error.code === '23503') {
      return res.status(409).json({ 
        error: 'Cannot delete location that is referenced in purchase orders or supplier relationships',
        message: error.message 
      });
    }
    
    res.status(500).json({ error: 'Failed to delete location', message: error.message });
  }
});

module.exports = router;

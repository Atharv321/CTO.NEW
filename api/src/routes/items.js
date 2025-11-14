const express = require('express');
const router = express.Router();
const itemService = require('../services/itemService');
const { authenticateToken, authorize } = require('../middleware/auth');
const { validatePagination, validateItemCreate, validateItemUpdate } = require('../middleware/validation');

router.use(authenticateToken);

router.post('/', authorize('admin', 'manager'), validateItemCreate, async (req, res) => {
  try {
    const item = await itemService.createItem(req.body, req.user.id);
    res.status(201).json(item);
  } catch (error) {
    if (error.message.includes('already exists')) {
      return res.status(409).json({ error: error.message });
    }
    if (error.message.includes('Invalid')) {
      return res.status(400).json({ error: error.message });
    }
    res.status(500).json({ error: error.message });
  }
});

router.get('/', validatePagination, async (req, res) => {
  try {
    const { page, limit, offset } = req.pagination;
    const { search, category_id, supplier_id, location_id } = req.query;

    const filters = {};
    if (search) filters.search = search;
    if (category_id) filters.category_id = parseInt(category_id, 10);
    if (supplier_id) filters.supplier_id = parseInt(supplier_id, 10);

    const locId = location_id ? parseInt(location_id, 10) : null;

    const [items, total] = await Promise.all([
      itemService.getItems(limit, offset, filters, locId),
      itemService.getItemCount(filters),
    ]);

    res.json({
      data: items,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/search/:query', async (req, res) => {
  try {
    const items = await itemService.searchItems(req.params.query);
    res.json(items);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/sku/:sku', async (req, res) => {
  try {
    const item = await itemService.getItemBySku(req.params.sku);
    if (!item) {
      return res.status(404).json({ error: 'Item not found' });
    }
    res.json(item);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/barcode/:barcode', async (req, res) => {
  try {
    const item = await itemService.getItemByBarcode(req.params.barcode);
    if (!item) {
      return res.status(404).json({ error: 'Item not found' });
    }
    res.json(item);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const item = await itemService.getItemById(req.params.id);
    if (!item) {
      return res.status(404).json({ error: 'Item not found' });
    }
    res.json(item);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.put('/:id', authorize('admin', 'manager'), validateItemUpdate, async (req, res) => {
  try {
    const item = await itemService.updateItem(req.params.id, req.body);
    if (!item) {
      return res.status(404).json({ error: 'Item not found' });
    }
    res.json(item);
  } catch (error) {
    if (error.message.includes('Invalid')) {
      return res.status(400).json({ error: error.message });
    }
    res.status(500).json({ error: error.message });
  }
});

router.delete('/:id', authorize('admin'), async (req, res) => {
  try {
    const item = await itemService.deleteItem(req.params.id);
    if (!item) {
      return res.status(404).json({ error: 'Item not found' });
    }
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;

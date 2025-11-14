import { Router, Request, Response } from 'express';
import { itemService } from '../services/itemService';
import { authenticate, authorize } from '../middleware/auth';
import { validateRequest } from '../middleware/validation';

const router = Router();

// Get all items
router.get('/', authenticate, async (req: Request, res: Response) => {
  try {
    const page = Math.max(1, parseInt(req.query.page as string, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string, 10) || 10));
    const offset = (page - 1) * limit;

    const result = await itemService.getItems({ page, limit, offset });

    res.json(result);
  } catch (error) {
    console.error('Error fetching items:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Search items
router.get('/search', authenticate, async (req: Request, res: Response) => {
  try {
    const q = req.query.q as string;
    if (!q) {
      return res.status(400).json({ error: 'Search query required' });
    }

    const page = Math.max(1, parseInt(req.query.page as string, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string, 10) || 10));
    const offset = (page - 1) * limit;

    const result = await itemService.searchItems(q, { page, limit, offset });

    res.json(result);
  } catch (error) {
    console.error('Error searching items:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get item by barcode
router.get('/barcode/:barcode', authenticate, async (req: Request, res: Response) => {
  try {
    const item = await itemService.getItemByBarcode(req.params.barcode);

    if (!item) {
      return res.status(404).json({ error: 'Item not found' });
    }

    res.json(item);
  } catch (error) {
    console.error('Error fetching item:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get item by SKU
router.get('/sku/:sku', authenticate, async (req: Request, res: Response) => {
  try {
    const item = await itemService.getItemBySku(req.params.sku);

    if (!item) {
      return res.status(404).json({ error: 'Item not found' });
    }

    res.json(item);
  } catch (error) {
    console.error('Error fetching item:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get item by ID
router.get('/:id', authenticate, async (req: Request, res: Response) => {
  try {
    const item = await itemService.getItemById(req.params.id);

    if (!item) {
      return res.status(404).json({ error: 'Item not found' });
    }

    res.json(item);
  } catch (error) {
    console.error('Error fetching item:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get items by category
router.get('/category/:categoryId', authenticate, async (req: Request, res: Response) => {
  try {
    const page = Math.max(1, parseInt(req.query.page as string, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string, 10) || 10));
    const offset = (page - 1) * limit;

    const result = await itemService.getItemsByCategory(req.params.categoryId, { page, limit, offset });

    res.json(result);
  } catch (error) {
    console.error('Error fetching items:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create item
router.post(
  '/',
  authenticate,
  authorize('admin', 'manager'),
  validateRequest([
    { field: 'sku', type: 'string', required: true, minLength: 1, maxLength: 100 },
    { field: 'barcode', type: 'string', required: true, minLength: 1, maxLength: 100 },
    { field: 'name', type: 'string', required: true, minLength: 1, maxLength: 255 },
    { field: 'description', type: 'string', maxLength: 1000 },
    { field: 'categoryId', type: 'uuid', required: true },
    { field: 'supplierId', type: 'uuid' },
    { field: 'price', type: 'number', required: true },
  ]),
  async (req: Request, res: Response) => {
    try {
      // Check for duplicate SKU or barcode
      const [existingBySku, existingByBarcode] = await Promise.all([
        itemService.getItemBySku(req.body.sku),
        itemService.getItemByBarcode(req.body.barcode),
      ]);

      if (existingBySku) {
        return res.status(409).json({ error: 'Item with this SKU already exists' });
      }
      if (existingByBarcode) {
        return res.status(409).json({ error: 'Item with this barcode already exists' });
      }

      const item = await itemService.createItem({
        sku: req.body.sku,
        barcode: req.body.barcode,
        name: req.body.name,
        description: req.body.description,
        categoryId: req.body.categoryId,
        supplierId: req.body.supplierId,
        price: req.body.price,
      });

      res.status(201).json(item);
    } catch (error: any) {
      if (error.code === '23503') {
        // Foreign key constraint violation
        return res.status(400).json({ error: 'Referenced category or supplier does not exist' });
      }
      console.error('Error creating item:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

// Update item
router.put(
  '/:id',
  authenticate,
  authorize('admin', 'manager'),
  validateRequest([
    { field: 'sku', type: 'string', maxLength: 100 },
    { field: 'barcode', type: 'string', maxLength: 100 },
    { field: 'name', type: 'string', maxLength: 255 },
    { field: 'description', type: 'string', maxLength: 1000 },
    { field: 'categoryId', type: 'uuid' },
    { field: 'supplierId', type: 'uuid' },
    { field: 'price', type: 'number' },
  ]),
  async (req: Request, res: Response) => {
    try {
      const item = await itemService.updateItem(req.params.id, {
        sku: req.body.sku,
        barcode: req.body.barcode,
        name: req.body.name,
        description: req.body.description,
        categoryId: req.body.categoryId,
        supplierId: req.body.supplierId,
        price: req.body.price,
      });

      if (!item) {
        return res.status(404).json({ error: 'Item not found' });
      }

      res.json(item);
    } catch (error: any) {
      if (error.code === '23505') {
        // Unique constraint violation
        if (error.detail?.includes('sku')) {
          return res.status(409).json({ error: 'Item with this SKU already exists' });
        }
        if (error.detail?.includes('barcode')) {
          return res.status(409).json({ error: 'Item with this barcode already exists' });
        }
      }
      if (error.code === '23503') {
        return res.status(400).json({ error: 'Referenced category or supplier does not exist' });
      }
      console.error('Error updating item:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

// Delete item
router.delete('/:id', authenticate, authorize('admin'), async (req: Request, res: Response) => {
  try {
    const deleted = await itemService.deleteItem(req.params.id);

    if (!deleted) {
      return res.status(404).json({ error: 'Item not found' });
    }

    res.status(204).send();
  } catch (error) {
    console.error('Error deleting item:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;

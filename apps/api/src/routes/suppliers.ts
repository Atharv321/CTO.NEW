import { Router, Request, Response } from 'express';
import { supplierService } from '../services/supplierService';
import { authenticate, authorize } from '../middleware/auth';
import { validateRequest } from '../middleware/validation';

const router = Router();

// Get all suppliers
router.get('/', authenticate, async (req: Request, res: Response) => {
  try {
    const page = Math.max(1, parseInt(req.query.page as string, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string, 10) || 10));
    const offset = (page - 1) * limit;

    const result = await supplierService.getSuppliers({ page, limit, offset });

    res.json(result);
  } catch (error) {
    console.error('Error fetching suppliers:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get supplier by ID
router.get('/:id', authenticate, async (req: Request, res: Response) => {
  try {
    const supplier = await supplierService.getSupplierById(req.params.id);

    if (!supplier) {
      return res.status(404).json({ error: 'Supplier not found' });
    }

    res.json(supplier);
  } catch (error) {
    console.error('Error fetching supplier:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create supplier
router.post(
  '/',
  authenticate,
  authorize('admin', 'manager'),
  validateRequest([
    { field: 'name', type: 'string', required: true, minLength: 1, maxLength: 255 },
    { field: 'contactEmail', type: 'email' },
    { field: 'phone', type: 'string', maxLength: 20 },
  ]),
  async (req: Request, res: Response) => {
    try {
      // Check for duplicate supplier name
      const existing = await supplierService.getSupplierByName(req.body.name);
      if (existing) {
        return res.status(409).json({ error: 'Supplier with this name already exists' });
      }

      const supplier = await supplierService.createSupplier({
        name: req.body.name,
        contactEmail: req.body.contactEmail,
        phone: req.body.phone,
      });

      res.status(201).json(supplier);
    } catch (error) {
      console.error('Error creating supplier:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

// Update supplier
router.put(
  '/:id',
  authenticate,
  authorize('admin', 'manager'),
  validateRequest([
    { field: 'name', type: 'string', maxLength: 255 },
    { field: 'contactEmail', type: 'email' },
    { field: 'phone', type: 'string', maxLength: 20 },
  ]),
  async (req: Request, res: Response) => {
    try {
      const supplier = await supplierService.updateSupplier(req.params.id, {
        name: req.body.name,
        contactEmail: req.body.contactEmail,
        phone: req.body.phone,
      });

      if (!supplier) {
        return res.status(404).json({ error: 'Supplier not found' });
      }

      res.json(supplier);
    } catch (error) {
      console.error('Error updating supplier:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

// Delete supplier
router.delete('/:id', authenticate, authorize('admin'), async (req: Request, res: Response) => {
  try {
    const deleted = await supplierService.deleteSupplier(req.params.id);

    if (!deleted) {
      return res.status(404).json({ error: 'Supplier not found' });
    }

    res.status(204).send();
  } catch (error) {
    console.error('Error deleting supplier:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;

import { Router, Request, Response } from 'express';
import { categoryService } from '../services/categoryService';
import { authenticate, authorize } from '../middleware/auth';
import { validateRequest } from '../middleware/validation';

const router = Router();

// Get all categories
router.get('/', authenticate, async (req: Request, res: Response) => {
  try {
    const page = Math.max(1, parseInt(req.query.page as string, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string, 10) || 10));
    const offset = (page - 1) * limit;

    const result = await categoryService.getCategories({ page, limit, offset });

    res.json(result);
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get category by ID
router.get('/:id', authenticate, async (req: Request, res: Response) => {
  try {
    const category = await categoryService.getCategoryById(req.params.id);

    if (!category) {
      return res.status(404).json({ error: 'Category not found' });
    }

    res.json(category);
  } catch (error) {
    console.error('Error fetching category:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create category
router.post(
  '/',
  authenticate,
  authorize('admin', 'manager'),
  validateRequest([
    { field: 'name', type: 'string', required: true, minLength: 1, maxLength: 255 },
    { field: 'description', type: 'string', maxLength: 1000 },
  ]),
  async (req: Request, res: Response) => {
    try {
      // Check for duplicate category name
      const existing = await categoryService.getCategoryByName(req.body.name);
      if (existing) {
        return res.status(409).json({ error: 'Category with this name already exists' });
      }

      const category = await categoryService.createCategory({
        name: req.body.name,
        description: req.body.description,
      });

      res.status(201).json(category);
    } catch (error) {
      console.error('Error creating category:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

// Update category
router.put(
  '/:id',
  authenticate,
  authorize('admin', 'manager'),
  validateRequest([
    { field: 'name', type: 'string', maxLength: 255 },
    { field: 'description', type: 'string', maxLength: 1000 },
  ]),
  async (req: Request, res: Response) => {
    try {
      const category = await categoryService.updateCategory(req.params.id, {
        name: req.body.name,
        description: req.body.description,
      });

      if (!category) {
        return res.status(404).json({ error: 'Category not found' });
      }

      res.json(category);
    } catch (error) {
      console.error('Error updating category:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

// Delete category
router.delete('/:id', authenticate, authorize('admin'), async (req: Request, res: Response) => {
  try {
    const deleted = await categoryService.deleteCategory(req.params.id);

    if (!deleted) {
      return res.status(404).json({ error: 'Category not found' });
    }

    res.status(204).send();
  } catch (error: any) {
    if (error.code === '23503') {
      // Foreign key constraint violation
      return res.status(409).json({ error: 'Cannot delete category with associated items' });
    }
    console.error('Error deleting category:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;

const express = require('express');
const router = express.Router();
const categoryService = require('../services/categoryService');
const { authenticateToken, authorize } = require('../middleware/auth');
const { validatePagination, validateCategoryCreate } = require('../middleware/validation');

router.use(authenticateToken);

router.post('/', authorize('admin', 'manager'), validateCategoryCreate, async (req, res) => {
  try {
    const { name, description, parent_category_id } = req.body;
    const category = await categoryService.createCategory(name, description, parent_category_id);
    res.status(201).json(category);
  } catch (error) {
    if (error.message.includes('already exists')) {
      return res.status(409).json({ error: error.message });
    }
    res.status(500).json({ error: error.message });
  }
});

router.get('/', validatePagination, async (req, res) => {
  try {
    const { page, limit, offset } = req.pagination;
    const { search } = req.query;

    const filters = {};
    if (search) filters.search = search;

    const [categories, total] = await Promise.all([
      categoryService.getCategories(limit, offset, filters),
      categoryService.getCategoryCount(filters),
    ]);

    res.json({
      data: categories,
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

router.get('/:id', async (req, res) => {
  try {
    const category = await categoryService.getCategoryById(req.params.id);
    if (!category) {
      return res.status(404).json({ error: 'Category not found' });
    }
    res.json(category);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.put('/:id', authorize('admin', 'manager'), validateCategoryCreate, async (req, res) => {
  try {
    const { name, description, parent_category_id } = req.body;
    const category = await categoryService.updateCategory(req.params.id, {
      name,
      description,
      parent_category_id,
    });

    if (!category) {
      return res.status(404).json({ error: 'Category not found' });
    }

    res.json(category);
  } catch (error) {
    if (error.message.includes('already exists')) {
      return res.status(409).json({ error: error.message });
    }
    res.status(500).json({ error: error.message });
  }
});

router.delete('/:id', authorize('admin'), async (req, res) => {
  try {
    const category = await categoryService.deleteCategory(req.params.id);
    if (!category) {
      return res.status(404).json({ error: 'Category not found' });
    }
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;

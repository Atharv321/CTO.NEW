function validatePagination(req, res, next) {
  let { page = 1, limit = 20 } = req.query;

  page = parseInt(page, 10);
  limit = parseInt(limit, 10);

  if (isNaN(page) || page < 1) {
    page = 1;
  }

  if (isNaN(limit) || limit < 1 || limit > 100) {
    limit = 20;
  }

  req.pagination = {
    page,
    limit,
    offset: (page - 1) * limit,
  };

  next();
}

function validateItemCreate(req, res, next) {
  const { sku, name, category_id } = req.body;

  if (!sku || typeof sku !== 'string' || sku.trim().length === 0) {
    return res.status(400).json({ error: 'SKU is required and must be a non-empty string' });
  }

  if (!name || typeof name !== 'string' || name.trim().length === 0) {
    return res.status(400).json({ error: 'Name is required and must be a non-empty string' });
  }

  if (!category_id || typeof category_id !== 'number') {
    return res.status(400).json({ error: 'Category ID is required and must be a number' });
  }

  next();
}

function validateItemUpdate(req, res, next) {
  const { name, category_id } = req.body;

  if (name !== undefined) {
    if (typeof name !== 'string' || name.trim().length === 0) {
      return res.status(400).json({ error: 'Name must be a non-empty string' });
    }
  }

  if (category_id !== undefined) {
    if (typeof category_id !== 'number') {
      return res.status(400).json({ error: 'Category ID must be a number' });
    }
  }

  next();
}

function validateStockAdjustment(req, res, next) {
  const { quantity, location_id, movement_type } = req.body;

  if (quantity === undefined || typeof quantity !== 'number') {
    return res.status(400).json({ error: 'Quantity is required and must be a number' });
  }

  if (!location_id || typeof location_id !== 'number') {
    return res.status(400).json({ error: 'Location ID is required and must be a number' });
  }

  if (!movement_type || typeof movement_type !== 'string') {
    return res.status(400).json({ error: 'Movement type is required and must be a string' });
  }

  const validTypes = ['receipt', 'issue', 'adjustment', 'count', 'return'];
  if (!validTypes.includes(movement_type)) {
    return res.status(400).json({
      error: 'Invalid movement type',
      validTypes,
    });
  }

  next();
}

function validateCategoryCreate(req, res, next) {
  const { name } = req.body;

  if (!name || typeof name !== 'string' || name.trim().length === 0) {
    return res.status(400).json({ error: 'Category name is required and must be a non-empty string' });
  }

  next();
}

module.exports = {
  validatePagination,
  validateItemCreate,
  validateItemUpdate,
  validateStockAdjustment,
  validateCategoryCreate,
};

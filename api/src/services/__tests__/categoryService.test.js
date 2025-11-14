const categoryService = require('../categoryService');
const pool = require('../../db/connection');

jest.mock('../../db/connection');

describe('CategoryService', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createCategory', () => {
    test('should create a new category', async () => {
      const mockCategory = {
        id: 1,
        name: 'Electronics',
        description: 'Electronic items',
        parent_category_id: null,
      };

      pool.query.mockResolvedValueOnce({ rows: [mockCategory] });

      const result = await categoryService.createCategory('Electronics', 'Electronic items', null);

      expect(result).toEqual(mockCategory);
      expect(pool.query).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO categories'),
        ['Electronics', 'Electronic items', null]
      );
    });

    test('should throw error if category already exists', async () => {
      const error = new Error('Duplicate key value');
      error.code = '23505';
      pool.query.mockRejectedValueOnce(error);

      await expect(categoryService.createCategory('Electronics')).rejects.toThrow(
        "Category with name 'Electronics' already exists"
      );
    });
  });

  describe('getCategories', () => {
    test('should fetch categories with pagination', async () => {
      const mockCategories = [
        { id: 1, name: 'Electronics' },
        { id: 2, name: 'Books' },
      ];

      pool.query.mockResolvedValueOnce({ rows: mockCategories });

      const result = await categoryService.getCategories(20, 0);

      expect(result).toEqual(mockCategories);
      expect(pool.query).toHaveBeenCalledWith(
        expect.stringContaining('SELECT * FROM categories'),
        expect.any(Array)
      );
    });

    test('should filter categories by search', async () => {
      const mockCategories = [{ id: 1, name: 'Electronics' }];

      pool.query.mockResolvedValueOnce({ rows: mockCategories });

      const result = await categoryService.getCategories(20, 0, { search: 'Elec' });

      expect(result).toEqual(mockCategories);
      expect(pool.query).toHaveBeenCalledWith(
        expect.stringContaining('ILIKE'),
        expect.arrayContaining(['%Elec%'])
      );
    });
  });

  describe('getCategoryById', () => {
    test('should fetch a category by ID', async () => {
      const mockCategory = { id: 1, name: 'Electronics' };

      pool.query.mockResolvedValueOnce({ rows: [mockCategory] });

      const result = await categoryService.getCategoryById(1);

      expect(result).toEqual(mockCategory);
    });

    test('should return null if category not found', async () => {
      pool.query.mockResolvedValueOnce({ rows: [] });

      const result = await categoryService.getCategoryById(999);

      expect(result).toBeNull();
    });
  });

  describe('updateCategory', () => {
    test('should update a category', async () => {
      const mockUpdatedCategory = {
        id: 1,
        name: 'Updated Electronics',
        description: 'Updated description',
      };

      pool.query.mockResolvedValueOnce({ rows: [mockUpdatedCategory] });

      const result = await categoryService.updateCategory(1, {
        name: 'Updated Electronics',
        description: 'Updated description',
      });

      expect(result).toEqual(mockUpdatedCategory);
    });

    test('should return null if category not found', async () => {
      pool.query.mockResolvedValueOnce({ rows: [] });

      const result = await categoryService.updateCategory(999, { name: 'Test' });

      expect(result).toBeNull();
    });
  });

  describe('deleteCategory', () => {
    test('should soft delete a category', async () => {
      const mockDeletedCategory = { id: 1, name: 'Electronics', active: false };

      pool.query.mockResolvedValueOnce({ rows: [mockDeletedCategory] });

      const result = await categoryService.deleteCategory(1);

      expect(result).toEqual(mockDeletedCategory);
    });
  });

  describe('getCategoryCount', () => {
    test('should return total count of categories', async () => {
      pool.query.mockResolvedValueOnce({ rows: [{ total: '10' }] });

      const result = await categoryService.getCategoryCount();

      expect(result).toBe(10);
    });
  });
});

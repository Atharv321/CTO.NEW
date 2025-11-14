import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import { categoryService } from './categoryService';
import * as db from '../db';

// Mock the db module
vi.mock('../db', () => ({
  query: vi.fn(),
}));

describe('CategoryService', () => {
  beforeAll(() => {
    vi.clearAllMocks();
  });

  afterAll(() => {
    vi.clearAllMocks();
  });

  describe('createCategory', () => {
    it('should create a category successfully', async () => {
      const mockCategory = {
        id: 'cat-1',
        name: 'Electronics',
        description: 'Electronic items',
        created_at: new Date(),
        updated_at: new Date(),
      };

      (db.query as any).mockResolvedValueOnce({ rows: [mockCategory] });

      const result = await categoryService.createCategory({
        name: 'Electronics',
        description: 'Electronic items',
      });

      expect(result).toEqual(mockCategory);
      expect(db.query).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO categories'),
        ['Electronics', 'Electronic items']
      );
    });

    it('should create a category without description', async () => {
      const mockCategory = {
        id: 'cat-2',
        name: 'Books',
        description: null,
        created_at: new Date(),
        updated_at: new Date(),
      };

      (db.query as any).mockResolvedValueOnce({ rows: [mockCategory] });

      const result = await categoryService.createCategory({ name: 'Books' });

      expect(result).toEqual(mockCategory);
      expect(db.query).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO categories'),
        ['Books', null]
      );
    });
  });

  describe('getCategories', () => {
    it('should retrieve paginated categories', async () => {
      const mockCategories = [
        {
          id: 'cat-1',
          name: 'Electronics',
          description: 'Electronic items',
          created_at: new Date(),
          updated_at: new Date(),
        },
      ];

      (db.query as any)
        .mockResolvedValueOnce({ rows: [{ count: '1' }] })
        .mockResolvedValueOnce({ rows: mockCategories });

      const result = await categoryService.getCategories({ page: 1, limit: 10, offset: 0 });

      expect(result.data).toEqual(mockCategories);
      expect(result.total).toBe(1);
      expect(result.page).toBe(1);
      expect(result.limit).toBe(10);
      expect(result.totalPages).toBe(1);
    });
  });

  describe('getCategoryById', () => {
    it('should retrieve a category by ID', async () => {
      const mockCategory = {
        id: 'cat-1',
        name: 'Electronics',
        description: 'Electronic items',
        created_at: new Date(),
        updated_at: new Date(),
      };

      (db.query as any).mockResolvedValueOnce({ rows: [mockCategory] });

      const result = await categoryService.getCategoryById('cat-1');

      expect(result).toEqual(mockCategory);
    });

    it('should return null if category not found', async () => {
      (db.query as any).mockResolvedValueOnce({ rows: [] });

      const result = await categoryService.getCategoryById('non-existent');

      expect(result).toBeNull();
    });
  });

  describe('updateCategory', () => {
    it('should update a category successfully', async () => {
      const mockCategory = {
        id: 'cat-1',
        name: 'Updated Electronics',
        description: 'Updated description',
        created_at: new Date(),
        updated_at: new Date(),
      };

      (db.query as any).mockResolvedValueOnce({ rows: [mockCategory] });

      const result = await categoryService.updateCategory('cat-1', {
        name: 'Updated Electronics',
        description: 'Updated description',
      });

      expect(result).toEqual(mockCategory);
    });

    it('should return null if category not found', async () => {
      (db.query as any).mockResolvedValueOnce({ rows: [] });

      const result = await categoryService.updateCategory('non-existent', { name: 'New Name' });

      expect(result).toBeNull();
    });
  });

  describe('deleteCategory', () => {
    it('should delete a category successfully', async () => {
      (db.query as any).mockResolvedValueOnce({ rowCount: 1 });

      const result = await categoryService.deleteCategory('cat-1');

      expect(result).toBe(true);
    });

    it('should return false if category not found', async () => {
      (db.query as any).mockResolvedValueOnce({ rowCount: 0 });

      const result = await categoryService.deleteCategory('non-existent');

      expect(result).toBe(false);
    });
  });

  describe('getCategoryByName', () => {
    it('should retrieve a category by name', async () => {
      const mockCategory = {
        id: 'cat-1',
        name: 'Electronics',
        description: 'Electronic items',
        created_at: new Date(),
        updated_at: new Date(),
      };

      (db.query as any).mockResolvedValueOnce({ rows: [mockCategory] });

      const result = await categoryService.getCategoryByName('Electronics');

      expect(result).toEqual(mockCategory);
    });

    it('should return null if category not found by name', async () => {
      (db.query as any).mockResolvedValueOnce({ rows: [] });

      const result = await categoryService.getCategoryByName('Non-existent');

      expect(result).toBeNull();
    });
  });
});

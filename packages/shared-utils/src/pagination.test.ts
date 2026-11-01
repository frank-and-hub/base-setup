import { parsePaginationParams, buildPaginatedResult } from './pagination';

describe('Pagination Utilities', () => {
  describe('parsePaginationParams', () => {
    it('should apply defaults when empty params provided', () => {
      const parsed = parsePaginationParams({});
      expect(parsed.page).toBe(1);
      expect(parsed.limit).toBe(10);
      expect(parsed.skip).toBe(0);
      expect(parsed.sortBy).toBe('createdAt');
      expect(parsed.sortOrder).toBe('desc');
    });

    it('should clamp limit within bounds and calculate skip offset', () => {
      const parsed = parsePaginationParams({ page: 3, limit: 25 }, 10, 100);
      expect(parsed.page).toBe(3);
      expect(parsed.limit).toBe(25);
      expect(parsed.skip).toBe(50);
    });

    it('should enforce maximum limit ceiling', () => {
      const parsed = parsePaginationParams({ page: 1, limit: 500 }, 10, 100);
      expect(parsed.limit).toBe(100);
    });
  });

  describe('buildPaginatedResult', () => {
    it('should compute pagination metadata correctly', () => {
      const items = [{ id: 1 }, { id: 2 }];
      const result = buildPaginatedResult(items, 50, 2, 10);

      expect(result.data).toHaveLength(2);
      expect(result.meta.page).toBe(2);
      expect(result.meta.limit).toBe(10);
      expect(result.meta.totalItems).toBe(50);
      expect(result.meta.totalPages).toBe(5);
      expect(result.meta.hasNextPage).toBe(true);
      expect(result.meta.hasPrevPage).toBe(true);
    });
  });
});


import { PaginatedResult, PaginationMeta, PaginationParams } from '@monorepo/shared-types';

export function parsePaginationParams(params: PaginationParams, defaultLimit = 10, maxLimit = 100) {
  const page = Math.max(1, Number(params.page) || 1);
  const rawLimit = Number(params.limit) || defaultLimit;
  const limit = Math.min(Math.max(1, rawLimit), maxLimit);
  const skip = (page - 1) * limit;

  return {
    page,
    limit,
    skip,
    search: params.search?.trim() || undefined,
    sortBy: params.sortBy || 'createdAt',
    sortOrder: (params.sortOrder === 'asc' ? 'asc' : 'desc') as 'asc' | 'desc',
  };
}

export function buildPaginatedResult<T>(
  items: T[],
  totalItems: number,
  page: number,
  limit: number,
): PaginatedResult<T> {
  const totalPages = Math.ceil(totalItems / limit) || 1;

  const meta: PaginationMeta = {
    page,
    limit,
    totalItems,
    totalPages,
    hasNextPage: page < totalPages,
    hasPrevPage: page > 1,
  };

  return {
    data: items,
    meta,
  };
}


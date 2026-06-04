import { PaginationMeta } from '../interfaces';

export const getPagination = (
  page: number | string,
  limit: number | string
): { skip: number; limit: number; page: number } => {
  const parsedPage = Math.max(1, parseInt(String(page)) || 1);
  const parsedLimit = Math.min(100, Math.max(1, parseInt(String(limit)) || 10));
  const skip = (parsedPage - 1) * parsedLimit;

  return { skip, limit: parsedLimit, page: parsedPage };
};

export const buildPaginationMeta = (
  total: number,
  page: number,
  limit: number
): PaginationMeta => {
  const totalPages = Math.ceil(total / limit);

  return {
    total,
    page,
    limit,
    totalPages,
    hasNext: page < totalPages,
    hasPrev: page > 1,
  };
};

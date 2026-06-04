import { Response } from 'express';
import { PaginationMeta } from '../interfaces';

export const successResponse = (
  res: Response,
  data: unknown,
  message = 'Success',
  statusCode = 200
): Response => {
  return res.status(statusCode).json({
    success: true,
    message,
    data,
  });
};

export const errorResponse = (
  res: Response,
  message = 'Error',
  statusCode = 500,
  errors?: unknown
): Response => {
  const body: Record<string, unknown> = {
    success: false,
    message,
  };

  if (errors !== undefined) {
    body['errors'] = errors;
  }

  return res.status(statusCode).json(body);
};

export const paginatedResponse = (
  res: Response,
  data: unknown,
  pagination: PaginationMeta,
  message = 'Success'
): Response => {
  return res.status(200).json({
    success: true,
    message,
    data,
    pagination,
  });
};

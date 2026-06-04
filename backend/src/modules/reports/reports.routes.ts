import { Router } from 'express';
import * as reportsController from './reports.controller';
import { authenticate, authorize } from '../../middleware/auth.middleware';
import { query } from 'express-validator';
import { validateRequest } from '../../middleware/validate.middleware';

const router = Router();

// All report routes require admin authentication
router.use(authenticate, authorize('ADMIN'));

/**
 * @swagger
 * /api/reports/revenue:
 *   get:
 *     summary: Get revenue report (Admin only)
 *     tags: [Reports]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: dateFrom
 *         required: true
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: dateTo
 *         required: true
 *         schema:
 *           type: string
 *           format: date
 *     responses:
 *       200:
 *         description: Revenue report data
 */
router.get(
  '/revenue',
  [
    query('dateFrom').isDate().withMessage('dateFrom must be a valid date (YYYY-MM-DD)'),
    query('dateTo').isDate().withMessage('dateTo must be a valid date (YYYY-MM-DD)'),
  ],
  validateRequest,
  reportsController.getRevenueReport
);

/**
 * @swagger
 * /api/reports/reservations:
 *   get:
 *     summary: Get reservations report (Admin only)
 *     tags: [Reports]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: dateFrom
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: dateTo
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: fieldId
 *         schema:
 *           type: string
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [pending, confirmed, cancelled, completed]
 *     responses:
 *       200:
 *         description: Reservations report data
 */
router.get('/reservations', reportsController.getReservationsReport);

/**
 * @swagger
 * /api/reports/occupancy:
 *   get:
 *     summary: Get occupancy report per field (Admin only)
 *     tags: [Reports]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Occupancy report data for last 30 days
 */
router.get('/occupancy', reportsController.getOccupancyReport);

export default router;

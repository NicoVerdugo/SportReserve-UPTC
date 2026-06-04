import { Router } from 'express';
import * as reservationsController from './reservations.controller';
import { authenticate, authorize } from '../../middleware/auth.middleware';
import { validateRequest } from '../../middleware/validate.middleware';
import { body, param } from 'express-validator';

const router = Router();

// All routes require authentication
router.use(authenticate);

const createReservationValidators = [
  body('fieldId').isMongoId().withMessage('Invalid field ID'),
  body('date').isDate().withMessage('Date must be a valid date (YYYY-MM-DD)'),
  body('startTime')
    .matches(/^([01]\d|2[0-3]):([0-5]\d)$/)
    .withMessage('Start time must be in HH:mm format'),
  body('endTime')
    .matches(/^([01]\d|2[0-3]):([0-5]\d)$/)
    .withMessage('End time must be in HH:mm format'),
  body('notes').optional().trim().isLength({ max: 500 }),
];

/**
 * @swagger
 * /api/reservations:
 *   post:
 *     summary: Create a new reservation
 *     tags: [Reservations]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [fieldId, date, startTime, endTime]
 *             properties:
 *               fieldId:
 *                 type: string
 *               date:
 *                 type: string
 *                 format: date
 *               startTime:
 *                 type: string
 *               endTime:
 *                 type: string
 *               notes:
 *                 type: string
 *     responses:
 *       201:
 *         description: Reservation created
 *       409:
 *         description: Time slot not available
 */
router.post('/', createReservationValidators, validateRequest, reservationsController.create);

/**
 * @swagger
 * /api/reservations:
 *   get:
 *     summary: Get all reservations (Admin gets all, Users get their own)
 *     tags: [Reservations]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
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
 *     responses:
 *       200:
 *         description: List of reservations
 */
router.get('/', reservationsController.getAll);

/**
 * @swagger
 * /api/reservations/{id}:
 *   get:
 *     summary: Get reservation by ID
 *     tags: [Reservations]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Reservation data
 */
router.get(
  '/:id',
  [param('id').isMongoId().withMessage('Invalid reservation ID')],
  validateRequest,
  reservationsController.getById
);

/**
 * @swagger
 * /api/reservations/{id}/cancel:
 *   patch:
 *     summary: Cancel a reservation
 *     tags: [Reservations]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Reservation cancelled
 */
router.patch(
  '/:id/cancel',
  [param('id').isMongoId().withMessage('Invalid reservation ID')],
  validateRequest,
  reservationsController.cancel
);

/**
 * @swagger
 * /api/reservations/{id}/confirm:
 *   patch:
 *     summary: Confirm a reservation (Admin only)
 *     tags: [Reservations]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Reservation confirmed
 */
router.patch(
  '/:id/confirm',
  authorize('ADMIN'),
  [param('id').isMongoId().withMessage('Invalid reservation ID')],
  validateRequest,
  reservationsController.confirm
);

/**
 * @swagger
 * /api/reservations/{id}/complete:
 *   patch:
 *     summary: Mark reservation as completed (Admin only)
 *     tags: [Reservations]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Reservation completed
 */
router.patch(
  '/:id/complete',
  authorize('ADMIN'),
  [param('id').isMongoId().withMessage('Invalid reservation ID')],
  validateRequest,
  reservationsController.complete
);

export default router;

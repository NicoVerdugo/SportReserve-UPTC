import { Router } from 'express';
import * as paymentsController from './payments.controller';
import { authenticate, authorize } from '../../middleware/auth.middleware';
import { validateRequest } from '../../middleware/validate.middleware';
import { body, param } from 'express-validator';

const router = Router();

router.use(authenticate);

/**
 * @swagger
 * /api/payments:
 *   post:
 *     summary: Create a new payment for a reservation
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [reservationId, method]
 *             properties:
 *               reservationId:
 *                 type: string
 *               method:
 *                 type: string
 *                 enum: [card, paypal, transfer, cash]
 *               transactionId:
 *                 type: string
 *     responses:
 *       201:
 *         description: Payment created
 */
router.post(
  '/',
  [
    body('reservationId').isMongoId().withMessage('Invalid reservation ID'),
    body('method')
      .isIn(['card', 'paypal', 'transfer', 'cash'])
      .withMessage('Invalid payment method'),
    body('transactionId').optional().trim(),
  ],
  validateRequest,
  paymentsController.create
);

/**
 * @swagger
 * /api/payments/my:
 *   get:
 *     summary: Get current user's payments
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User's payments
 */
router.get('/my', paymentsController.getMyPayments);

/**
 * @swagger
 * /api/payments:
 *   get:
 *     summary: Get all payments (Admin only)
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: All payments
 */
router.get('/', authorize('ADMIN'), paymentsController.getAll);

/**
 * @swagger
 * /api/payments/{id}:
 *   get:
 *     summary: Get payment by ID
 *     tags: [Payments]
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
 *         description: Payment data
 */
router.get(
  '/:id',
  [param('id').isMongoId().withMessage('Invalid payment ID')],
  validateRequest,
  paymentsController.getById
);

/**
 * @swagger
 * /api/payments/{id}/status:
 *   patch:
 *     summary: Update payment status (Admin only)
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [status]
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [pending, paid, rejected, refunded]
 *               receipt:
 *                 type: string
 *     responses:
 *       200:
 *         description: Status updated
 */
router.patch(
  '/:id/status',
  authorize('ADMIN'),
  [
    param('id').isMongoId().withMessage('Invalid payment ID'),
    body('status')
      .isIn(['pending', 'paid', 'rejected', 'refunded'])
      .withMessage('Status must be one of: pending, paid, rejected, refunded'),
    body('receipt').optional().trim(),
  ],
  validateRequest,
  paymentsController.updateStatus
);

export default router;

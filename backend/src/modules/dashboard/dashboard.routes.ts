import { Router } from 'express';
import * as dashboardController from './dashboard.controller';
import { authenticate, authorize } from '../../middleware/auth.middleware';

const router = Router();

router.use(authenticate);

/**
 * @swagger
 * /api/dashboard/admin:
 *   get:
 *     summary: Get admin dashboard statistics (Admin only)
 *     tags: [Dashboard]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Admin stats including revenue, reservations, users, fields
 */
router.get('/admin', authorize('ADMIN'), dashboardController.getAdminStats);

/**
 * @swagger
 * /api/dashboard/user:
 *   get:
 *     summary: Get user dashboard statistics
 *     tags: [Dashboard]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User stats including upcoming reservations, total spent
 */
router.get('/user', dashboardController.getUserStats);

export default router;

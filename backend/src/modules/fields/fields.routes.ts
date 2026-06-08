/**
 * @file fields.routes.ts
 * @module fields
 * @description Definición de rutas REST para la gestión de canchas deportivas en SportReserve-UPTC.
 *
 * Rutas públicas (sin autenticación):
 * - GET  /api/fields                    → Listar canchas con paginación y filtros.
 * - GET  /api/fields/:id                → Obtener cancha por ID.
 * - GET  /api/fields/:id/availability   → Consultar disponibilidad por fecha.
 *
 * Rutas protegidas (requieren JWT + rol ADMIN):
 * - POST   /api/fields       → Crear nueva cancha.
 * - PUT    /api/fields/:id   → Actualizar cancha existente.
 * - DELETE /api/fields/:id   → Eliminar cancha.
 */

import { Router } from 'express';
import * as fieldsController from './fields.controller';
import { authenticate, authorize } from '../../middleware/auth.middleware';
import { validateRequest } from '../../middleware/validate.middleware';
import { body, param, query } from 'express-validator';

const router = Router();

/**
 * Validadores reutilizables para creación y actualización de canchas.
 * Se aplican tanto en POST como en PUT para mantener consistencia.
 *
 * Valida:
 * - Campos de texto: nombre, ubicación, descripción.
 * - Tipo de deporte: enum estricto.
 * - Imágenes: URLs http/https o base64 data URIs.
 * - Capacidad y precio: valores numéricos con restricciones mínimas.
 * - Horario: array de slots con día, apertura y cierre en formato HH:mm.
 * - Estado: enum opcional.
 */
const createFieldValidators = [
  body('name').trim().notEmpty().withMessage('Field name is required').isLength({ max: 100 }),
  body('sportType')
    .isIn(['football', 'basketball', 'volleyball', 'tennis', 'multiple'])
    .withMessage('Invalid sport type'),
  body('location').trim().notEmpty().withMessage('Location is required').isLength({ max: 200 }),
  body('description').optional().trim().isLength({ max: 1000 }),
  body('images').optional().isArray(),
  body('images.*').optional().custom((val: string) => {
    if (!val || typeof val !== 'string') return true;
    return val.startsWith('data:image/') || /^https?:\/\/.+/.test(val);
  }).withMessage('Each image must be a valid URL or base64 data URI'),
  body('capacity').isInt({ min: 1 }).withMessage('Capacity must be a positive integer'),
  body('pricePerHour').isFloat({ min: 0 }).withMessage('Price per hour must be non-negative'),
  body('schedule').optional().isArray(),
  body('schedule.*.dayOfWeek')
    .optional()
    .isInt({ min: 0, max: 6 })
    .withMessage('Day of week must be 0-6'),
  body('schedule.*.openTime')
    .optional()
    .matches(/^([01]\d|2[0-3]):([0-5]\d)$/)
    .withMessage('Open time must be in HH:mm format'),
  body('schedule.*.closeTime')
    .optional()
    .matches(/^([01]\d|2[0-3]):([0-5]\d)$/)
    .withMessage('Close time must be in HH:mm format'),
  body('status')
    .optional()
    .isIn(['active', 'inactive', 'maintenance'])
    .withMessage('Invalid status'),
];

/**
 * @swagger
 * /api/fields:
 *   get:
 *     summary: Get all sport fields (public)
 *     tags: [Fields]
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
 *         name: search
 *         schema:
 *           type: string
 *       - in: query
 *         name: sportType
 *         schema:
 *           type: string
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of fields
 */
router.get('/', fieldsController.getAll);

/**
 * @swagger
 * /api/fields/{id}/availability:
 *   get:
 *     summary: Get field availability for a specific date (public)
 *     tags: [Fields]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: date
 *         required: true
 *         schema:
 *           type: string
 *           format: date
 *     responses:
 *       200:
 *         description: Available time slots
 */
router.get(
  '/:id/availability',
  [
    param('id').isMongoId().withMessage('Invalid field ID'),
    query('date').isDate().withMessage('Date must be a valid date (YYYY-MM-DD)'),
  ],
  validateRequest,
  fieldsController.getAvailability
);

/**
 * @swagger
 * /api/fields/{id}:
 *   get:
 *     summary: Get field by ID (public)
 *     tags: [Fields]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Field data
 *       404:
 *         description: Field not found
 */
router.get(
  '/:id',
  [param('id').isMongoId().withMessage('Invalid field ID')],
  validateRequest,
  fieldsController.getById
);

/**
 * @swagger
 * /api/fields:
 *   post:
 *     summary: Create a new field (Admin only)
 *     tags: [Fields]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       201:
 *         description: Field created
 */
router.post(
  '/',
  authenticate,
  authorize('ADMIN'),
  createFieldValidators,   // Validadores de creación reutilizables
  validateRequest,
  fieldsController.create
);

/**
 * @swagger
 * /api/fields/{id}:
 *   put:
 *     summary: Update a field (Admin only)
 *     tags: [Fields]
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
 *         description: Field updated
 */
router.put(
  '/:id',
  authenticate,
  authorize('ADMIN'),
  [param('id').isMongoId().withMessage('Invalid field ID'), ...createFieldValidators], // Reutiliza validadores + valida ID
  validateRequest,
  fieldsController.update
);

/**
 * @swagger
 * /api/fields/{id}:
 *   delete:
 *     summary: Delete a field (Admin only)
 *     tags: [Fields]
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
 *         description: Field deleted
 */
router.delete(
  '/:id',
  authenticate,
  authorize('ADMIN'),
  [param('id').isMongoId().withMessage('Invalid field ID')],
  validateRequest,
  fieldsController.deleteField
);

export default router;
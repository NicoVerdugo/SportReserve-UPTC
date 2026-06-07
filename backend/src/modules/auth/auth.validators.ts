/**
 * @file auth.validators.ts
 * @description Validadores del módulo de autenticación usando express-validator.
 * Cada validador es un array de reglas que se ejecutan antes del controlador
 * para verificar que los datos del body sean correctos.
 */

import { body } from 'express-validator';

/**
 * Validaciones para el registro de un nuevo usuario.
 * Campos requeridos: firstName, lastName, email, password, confirmPassword.
 * Campo opcional: phone.
 *
 * Reglas:
 * - firstName y lastName: solo letras (incluyendo tildes y ñ), entre 2 y 50 caracteres
 * - email: formato válido de correo electrónico
 * - password: mínimo 8 caracteres, debe tener mayúscula, minúscula y número
 * - confirmPassword: debe coincidir con password
 * - phone: formato internacional opcional (ej: +57 300 123 4567)
 */
export const registerValidator = [
  body('firstName')
    .trim()
    .notEmpty().withMessage('First name is required')
    .isLength({ min: 2, max: 50 }).withMessage('First name must be between 2 and 50 characters')
    .matches(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/).withMessage('First name can only contain letters'),

  body('lastName')
    .trim()
    .notEmpty().withMessage('Last name is required')
    .isLength({ min: 2, max: 50 }).withMessage('Last name must be between 2 and 50 characters')
    .matches(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/).withMessage('Last name can only contain letters'),

  body('email')
    .trim()
    .notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Please provide a valid email address')
    .normalizeEmail(),

  body('password')
    .notEmpty().withMessage('Password is required')
    .isLength({ min: 8 }).withMessage('Password must be at least 8 characters')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/).withMessage(
      'Password must contain at least one uppercase letter, one lowercase letter, and one number'
    ),

  body('confirmPassword')
    .notEmpty().withMessage('Confirm password is required')
    .custom((value, { req }) => {
      if (value !== req.body.password) {
        throw new Error('Passwords do not match');
      }
      return true;
    }),

  body('phone')
    .optional()
    .trim()
    .matches(/^\+?[\d\s\-()]{7,20}$/).withMessage('Please provide a valid phone number'),
];

/**
 * Validaciones para el inicio de sesión.
 * Campos requeridos: email, password.
 */
export const loginValidator = [
  body('email')
    .trim()
    .notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Please provide a valid email address')
    .normalizeEmail(),

  body('password')
    .notEmpty().withMessage('Password is required'),
];

/**
 * Validaciones para solicitar recuperación de contraseña.
 * Campo requerido: email con formato válido.
 */
export const forgotPasswordValidator = [
  body('email')
    .trim()
    .notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Please provide a valid email address')
    .normalizeEmail(),
];

/**
 * Validaciones para restablecer la contraseña con token.
 * Campos requeridos: token, password, confirmPassword.
 *
 * Reglas:
 * - token: no puede estar vacío
 * - password: mínimo 8 caracteres, debe tener mayúscula, minúscula y número
 * - confirmPassword: debe coincidir con password
 */
export const resetPasswordValidator = [
  body('token')
    .trim()
    .notEmpty().withMessage('Reset token is required'),

  body('password')
    .notEmpty().withMessage('Password is required')
    .isLength({ min: 8 }).withMessage('Password must be at least 8 characters')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/).withMessage(
      'Password must contain at least one uppercase letter, one lowercase letter, and one number'
    ),

  body('confirmPassword')
    .notEmpty().withMessage('Confirm password is required')
    .custom((value, { req }) => {
      if (value !== req.body.password) {
        throw new Error('Passwords do not match');
      }
      return true;
    }),
];

/**
 * Validaciones para actualizar el perfil propio.
 * Todos los campos son opcionales.
 *
 * Reglas:
 * - firstName y lastName: solo letras, entre 2 y 50 caracteres
 * - phone: formato internacional válido
 * - avatar: debe ser una URL válida
 */
export const updateMeValidator = [
  body('firstName')
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 }).withMessage('First name must be between 2 and 50 characters')
    .matches(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/).withMessage('First name can only contain letters'),

  body('lastName')
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 }).withMessage('Last name must be between 2 and 50 characters')
    .matches(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/).withMessage('Last name can only contain letters'),

  body('phone')
    .optional()
    .trim()
    .matches(/^\+?[\d\s\-()]{7,20}$/).withMessage('Please provide a valid phone number'),

  body('avatar')
    .optional()
    .trim()
    .isURL().withMessage('Avatar must be a valid URL'),
];

/**
 * Validaciones para cambiar la contraseña del usuario autenticado.
 * Campos requeridos: currentPassword, newPassword, confirmPassword.
 *
 * Reglas:
 * - currentPassword: no puede estar vacío
 * - newPassword: mínimo 8 caracteres, debe tener mayúscula, minúscula y número
 * - confirmPassword: debe coincidir con newPassword
 */
export const changePasswordValidator = [
  body('currentPassword')
    .notEmpty().withMessage('Current password is required'),

  body('newPassword')
    .notEmpty().withMessage('New password is required')
    .isLength({ min: 8 }).withMessage('New password must be at least 8 characters')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/).withMessage(
      'Password must contain at least one uppercase letter, one lowercase letter, and one number'
    ),

  body('confirmPassword')
    .notEmpty().withMessage('Confirm password is required')
    .custom((value, { req }) => {
      if (value !== req.body.newPassword) {
        throw new Error('Passwords do not match');
      }
      return true;
    }),
];

/**
 * Validaciones para renovar el access token.
 * Campo requerido: refreshToken (string no vacío).
 */
export const refreshTokenValidator = [
  body('refreshToken')
    .trim()
    .notEmpty().withMessage('Refresh token is required'),
];
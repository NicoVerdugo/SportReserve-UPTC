/**
 * @file auth.controller.ts
 * @description Controlador de autenticación. Recibe las peticiones HTTP, llama al servicio
 * correspondiente y devuelve la respuesta al cliente. No contiene lógica de negocio.
 */

import { Request, Response, NextFunction } from 'express';
import { AuthRequest } from '../../interfaces';
import * as authService from './auth.service';
import { successResponse, errorResponse } from '../../utils/response.utils';

/**
 * POST /api/auth/register
 * Registra un nuevo usuario en la plataforma.
 * Espera en el body: firstName, lastName, email, password, confirmPassword, phone (opcional).
 */
export const register = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const result = await authService.register(req.body);
    successResponse(res, result, 'User registered successfully', 201);
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/auth/login
 * Inicia sesión con email y contraseña.
 * Retorna el usuario autenticado junto con los tokens JWT de acceso y refresco.
 */
export const login = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const result = await authService.login(req.body);
    successResponse(res, result, 'Login successful');
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/auth/logout
 * Cierra la sesión del usuario autenticado.
 * En esta implementación stateless con JWT, el cierre de sesión se maneja en el cliente.
 * Requiere token JWT en el header Authorization.
 */
export const logout = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // En JWT stateless el logout lo maneja el cliente eliminando el token
    successResponse(res, null, 'Logged out successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/auth/refresh-token
 * Renueva el access token usando un refresh token válido.
 * Espera en el body: refreshToken (string).
 */
export const refreshToken = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { refreshToken } = req.body;
    const tokens = await authService.refreshToken(refreshToken);
    successResponse(res, tokens, 'Tokens refreshed successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/auth/forgot-password
 * Solicita el envío de un correo para recuperar la contraseña.
 * Espera en el body: email (string).
 * Siempre responde con éxito para evitar revelar si el email existe.
 */
export const forgotPassword = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    await authService.forgotPassword(req.body.email);
    successResponse(
      res,
      null,
      'If an account with that email exists, a password reset link has been sent.'
    );
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/auth/reset-password
 * Restablece la contraseña usando el token recibido por correo.
 * Espera en el body: token (string), password (string), confirmPassword (string).
 */
export const resetPassword = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { token, password } = req.body;
    await authService.resetPassword(token, password);
    successResponse(res, null, 'Password reset successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/auth/me
 * Retorna el perfil del usuario actualmente autenticado.
 * Requiere token JWT en el header Authorization.
 */
export const getMe = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      errorResponse(res, 'Authentication required', 401);
      return;
    }
    const user = await authService.getMe(String(req.user._id));
    successResponse(res, user, 'User profile retrieved successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /api/auth/me
 * Actualiza los datos del perfil del usuario autenticado.
 * Campos permitidos en el body: firstName, lastName, phone, avatar (todos opcionales).
 * Requiere token JWT en el header Authorization.
 */
export const updateMe = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      errorResponse(res, 'Authentication required', 401);
      return;
    }
    const user = await authService.updateMe(String(req.user._id), req.body);
    successResponse(res, user, 'Profile updated successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /api/auth/change-password
 * Cambia la contraseña del usuario autenticado.
 * Espera en el body: currentPassword (string), newPassword (string).
 * Requiere token JWT en el header Authorization.
 */
export const changePassword = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      errorResponse(res, 'Authentication required', 401);
      return;
    }
    await authService.changePassword(String(req.user._id), req.body);
    successResponse(res, null, 'Password changed successfully');
  } catch (error) {
    next(error);
  }
};
/**
 * @file auth.service.ts
 * @description Servicio de autenticación. Contiene la lógica de negocio para registro,
 * inicio de sesión, manejo de tokens, recuperación de contraseña y gestión del perfil propio.
 */

import crypto from 'crypto';
import User from '../users/user.model';
import { IUser } from '../../interfaces';
import {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
} from '../../utils/jwt.utils';
import { sendPasswordResetEmail } from '../../utils/email.utils';

// ─── DTOs (Data Transfer Objects) ────────────────────────────────────────────

/** Datos requeridos para registrar un nuevo usuario */
export interface RegisterDto {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  phone?: string; // Opcional
}

/** Datos requeridos para iniciar sesión */
export interface LoginDto {
  email: string;
  password: string;
}

/** Datos opcionales para actualizar el perfil propio */
export interface UpdateMeDto {
  firstName?: string;
  lastName?: string;
  phone?: string;
  avatar?: string;
}

/** Datos requeridos para cambiar la contraseña */
export interface ChangePasswordDto {
  currentPassword: string;
  newPassword: string;
}

/** Par de tokens JWT generados tras autenticación */
export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

/** Respuesta estándar tras registro o login exitoso */
export interface AuthResponse {
  user: Omit<IUser, 'password'>; // El usuario sin la contraseña
  accessToken: string;
  refreshToken: string;
}

// ─── Utilidad interna ─────────────────────────────────────────────────────────

/**
 * Elimina campos sensibles del objeto usuario antes de enviarlo al cliente.
 * Remueve: password, resetPasswordToken, resetPasswordExpires.
 * @param user - Documento de usuario de Mongoose
 * @returns Objeto usuario sin campos sensibles
 */
const sanitizeUser = (user: IUser) => {
  const userObj = user.toObject() as Record<string, unknown>;
  delete userObj['password'];
  delete userObj['resetPasswordToken'];
  delete userObj['resetPasswordExpires'];
  return userObj;
};

// ─── Funciones del servicio ───────────────────────────────────────────────────

/**
 * Registra un nuevo usuario en la plataforma.
 * Verifica que el email no esté ya registrado, crea el usuario
 * y genera tokens JWT de acceso y refresco.
 *
 * @param dto - Datos del nuevo usuario (nombre, email, contraseña, etc.)
 * @returns Usuario creado (sin contraseña) y tokens JWT
 * @throws 409 si el email ya está registrado
 */
export const register = async (dto: RegisterDto): Promise<AuthResponse> => {
  const existingUser = await User.findOne({ email: dto.email.toLowerCase() });
  if (existingUser) {
    throw Object.assign(new Error('Email is already registered'), { statusCode: 409 });
  }

  const user = await User.create({
    firstName: dto.firstName,
    lastName: dto.lastName,
    email: dto.email.toLowerCase(),
    password: dto.password,
    phone: dto.phone,
  });

  const accessToken = generateAccessToken(String(user._id), user.role);
  const refreshToken = generateRefreshToken(String(user._id));

  return {
    user: sanitizeUser(user) as unknown as Omit<IUser, 'password'>,
    accessToken,
    refreshToken,
  };
};

/**
 * Autentica a un usuario con email y contraseña.
 * Verifica que el usuario exista, que su cuenta esté activa
 * y que la contraseña sea correcta.
 *
 * @param dto - Credenciales del usuario (email y contraseña)
 * @returns Usuario autenticado (sin contraseña) y tokens JWT
 * @throws 401 si las credenciales son inválidas
 * @throws 403 si la cuenta está bloqueada o inactiva
 */
export const login = async (dto: LoginDto): Promise<AuthResponse> => {
  const user = await User.findOne({ email: dto.email.toLowerCase() }).select('+password');

  if (!user) {
    throw Object.assign(new Error('Invalid email or password'), { statusCode: 401 });
  }

  if (user.status === 'blocked') {
    throw Object.assign(new Error('Your account has been blocked. Contact support.'), {
      statusCode: 403,
    });
  }

  if (user.status === 'inactive') {
    throw Object.assign(new Error('Your account is inactive.'), { statusCode: 403 });
  }

  const isPasswordValid = await user.comparePassword(dto.password);
  if (!isPasswordValid) {
    throw Object.assign(new Error('Invalid email or password'), { statusCode: 401 });
  }

  const accessToken = generateAccessToken(String(user._id), user.role);
  const refreshToken = generateRefreshToken(String(user._id));

  return {
    user: sanitizeUser(user) as unknown as Omit<IUser, 'password'>,
    accessToken,
    refreshToken,
  };
};

/**
 * Renueva el access token usando un refresh token válido.
 * Verifica que el token sea válido y que el usuario exista y esté activo.
 *
 * @param token - Refresh token JWT
 * @returns Nuevos tokens de acceso y refresco
 * @throws 401 si el token es inválido o el usuario no existe
 * @throws 403 si la cuenta no está activa
 */
export const refreshToken = async (token: string): Promise<AuthTokens> => {
  const decoded = verifyRefreshToken(token);

  const user = await User.findById(decoded.userId);
  if (!user) {
    throw Object.assign(new Error('User not found'), { statusCode: 401 });
  }

  if (user.status !== 'active') {
    throw Object.assign(new Error('Account is not active'), { statusCode: 403 });
  }

  const accessToken = generateAccessToken(String(user._id), user.role);
  const newRefreshToken = generateRefreshToken(String(user._id));

  return { accessToken, refreshToken: newRefreshToken };
};

/**
 * Inicia el proceso de recuperación de contraseña.
 * Genera un token seguro, lo guarda hasheado en la base de datos
 * y envía un correo al usuario con el enlace de recuperación.
 * Nota: siempre responde con éxito para evitar enumeración de emails.
 *
 * @param email - Correo del usuario que quiere recuperar su contraseña
 * @throws 500 si falla el envío del correo
 */
export const forgotPassword = async (email: string): Promise<void> => {
  const user = await User.findOne({ email: email.toLowerCase() });

  // Siempre retorna éxito para evitar revelar si el email existe
  if (!user) return;

  const resetToken = crypto.randomBytes(32).toString('hex');
  const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');

  user.resetPasswordToken = hashedToken;
  user.resetPasswordExpires = new Date(Date.now() + 60 * 60 * 1000); // Expira en 1 hora
  await user.save({ validateBeforeSave: false });

  try {
    await sendPasswordResetEmail(user.email, resetToken, user.firstName);
  } catch {
    // Si falla el correo, limpia el token para no dejarlo huérfano
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save({ validateBeforeSave: false });
    throw Object.assign(new Error('Error sending reset email. Please try again.'), {
      statusCode: 500,
    });
  }
};

/**
 * Restablece la contraseña de un usuario usando el token de recuperación.
 * Verifica que el token sea válido y no haya expirado.
 *
 * @param token - Token de recuperación enviado por correo (sin hashear)
 * @param newPassword - Nueva contraseña del usuario
 * @throws 400 si el token es inválido o ha expirado
 */
export const resetPassword = async (
  token: string,
  newPassword: string
): Promise<void> => {
  const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

  const user = await User.findOne({
    resetPasswordToken: hashedToken,
    resetPasswordExpires: { $gt: new Date() }, // Token aún vigente
  }).select('+resetPasswordToken +resetPasswordExpires');

  if (!user) {
    throw Object.assign(new Error('Invalid or expired reset token'), { statusCode: 400 });
  }

  user.password = newPassword;
  user.resetPasswordToken = undefined;
  user.resetPasswordExpires = undefined;
  await user.save();
};

/**
 * Obtiene el perfil del usuario autenticado actualmente.
 *
 * @param userId - ID del usuario autenticado
 * @returns Datos del usuario sin campos sensibles
 * @throws 404 si el usuario no existe
 */
export const getMe = async (userId: string): Promise<Omit<IUser, 'password'>> => {
  const user = await User.findById(userId);
  if (!user) {
    throw Object.assign(new Error('User not found'), { statusCode: 404 });
  }
  return sanitizeUser(user) as unknown as Omit<IUser, 'password'>;
};

/**
 * Actualiza los datos del perfil del usuario autenticado.
 * Solo permite modificar: nombre, apellido, teléfono y avatar.
 *
 * @param userId - ID del usuario autenticado
 * @param dto - Campos a actualizar (todos opcionales)
 * @returns Usuario actualizado sin campos sensibles
 * @throws 404 si el usuario no existe
 */
export const updateMe = async (
  userId: string,
  dto: UpdateMeDto
): Promise<Omit<IUser, 'password'>> => {
  const user = await User.findByIdAndUpdate(
    userId,
    {
      ...(dto.firstName && { firstName: dto.firstName }),
      ...(dto.lastName && { lastName: dto.lastName }),
      ...(dto.phone !== undefined && { phone: dto.phone }),
      ...(dto.avatar !== undefined && { avatar: dto.avatar }),
    },
    { new: true, runValidators: true }
  );

  if (!user) {
    throw Object.assign(new Error('User not found'), { statusCode: 404 });
  }

  return sanitizeUser(user) as unknown as Omit<IUser, 'password'>;
};

/**
 * Cambia la contraseña del usuario autenticado.
 * Verifica que la contraseña actual sea correcta antes de actualizarla.
 *
 * @param userId - ID del usuario autenticado
 * @param dto - Contraseña actual y nueva contraseña
 * @throws 404 si el usuario no existe
 * @throws 400 si la contraseña actual es incorrecta
 */
export const changePassword = async (
  userId: string,
  dto: ChangePasswordDto
): Promise<void> => {
  const user = await User.findById(userId).select('+password');
  if (!user) {
    throw Object.assign(new Error('User not found'), { statusCode: 404 });
  }

  const isCurrentPasswordValid = await user.comparePassword(dto.currentPassword);
  if (!isCurrentPasswordValid) {
    throw Object.assign(new Error('Current password is incorrect'), { statusCode: 400 });
  }

  user.password = dto.newPassword;
  await user.save();
};
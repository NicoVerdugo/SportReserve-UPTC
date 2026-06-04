import crypto from 'crypto';
import User from '../users/user.model';
import { IUser } from '../../interfaces';
import {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
} from '../../utils/jwt.utils';
import { sendPasswordResetEmail } from '../../utils/email.utils';

export interface RegisterDto {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  phone?: string;
}

export interface LoginDto {
  email: string;
  password: string;
}

export interface UpdateMeDto {
  firstName?: string;
  lastName?: string;
  phone?: string;
  avatar?: string;
}

export interface ChangePasswordDto {
  currentPassword: string;
  newPassword: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface AuthResponse {
  user: Omit<IUser, 'password'>;
  accessToken: string;
  refreshToken: string;
}

const sanitizeUser = (user: IUser) => {
  const userObj = user.toObject() as Record<string, unknown>;
  delete userObj['password'];
  delete userObj['resetPasswordToken'];
  delete userObj['resetPasswordExpires'];
  return userObj;
};

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

export const forgotPassword = async (email: string): Promise<void> => {
  const user = await User.findOne({ email: email.toLowerCase() });

  // Always return success to prevent email enumeration
  if (!user) return;

  const resetToken = crypto.randomBytes(32).toString('hex');
  const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');

  user.resetPasswordToken = hashedToken;
  user.resetPasswordExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
  await user.save({ validateBeforeSave: false });

  try {
    await sendPasswordResetEmail(user.email, resetToken, user.firstName);
  } catch {
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save({ validateBeforeSave: false });
    throw Object.assign(new Error('Error sending reset email. Please try again.'), {
      statusCode: 500,
    });
  }
};

export const resetPassword = async (
  token: string,
  newPassword: string
): Promise<void> => {
  const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

  const user = await User.findOne({
    resetPasswordToken: hashedToken,
    resetPasswordExpires: { $gt: new Date() },
  }).select('+resetPasswordToken +resetPasswordExpires');

  if (!user) {
    throw Object.assign(new Error('Invalid or expired reset token'), { statusCode: 400 });
  }

  user.password = newPassword;
  user.resetPasswordToken = undefined;
  user.resetPasswordExpires = undefined;
  await user.save();
};

export const getMe = async (userId: string): Promise<Omit<IUser, 'password'>> => {
  const user = await User.findById(userId);
  if (!user) {
    throw Object.assign(new Error('User not found'), { statusCode: 404 });
  }
  return sanitizeUser(user) as unknown as Omit<IUser, 'password'>;
};

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

import { Response, NextFunction } from 'express';
import { AuthRequest } from '../interfaces';
import { verifyAccessToken } from '../utils/jwt.utils';
import User from '../modules/users/user.model';
import { errorResponse } from '../utils/response.utils';

export const authenticate = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      errorResponse(res, 'Access token is required', 401);
      return;
    }

    const token = authHeader.split(' ')[1];

    const decoded = verifyAccessToken(token);

    const user = await User.findById(decoded.userId).select('+password');

    if (!user) {
      errorResponse(res, 'User not found', 401);
      return;
    }

    if (user.status !== 'active') {
      errorResponse(res, 'Account is inactive or blocked', 403);
      return;
    }

    req.user = user;
    next();
  } catch (error) {
    if (error instanceof Error) {
      if (error.name === 'TokenExpiredError') {
        errorResponse(res, 'Access token has expired', 401);
        return;
      }
      if (error.name === 'JsonWebTokenError') {
        errorResponse(res, 'Invalid access token', 401);
        return;
      }
    }
    errorResponse(res, 'Authentication failed', 401);
  }
};

export const authorize = (...roles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      errorResponse(res, 'Authentication required', 401);
      return;
    }

    if (!roles.includes(req.user.role)) {
      errorResponse(
        res,
        `Role '${req.user.role}' is not authorized to access this route`,
        403
      );
      return;
    }

    next();
  };
};

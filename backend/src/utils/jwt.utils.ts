import jwt from 'jsonwebtoken';
import { config } from '../config/env';
import { JwtPayload } from '../interfaces';

export const generateAccessToken = (userId: string, role: string): string => {
  return jwt.sign({ userId, role }, config.jwt.secret, {
    expiresIn: config.jwt.expiresIn as jwt.SignOptions['expiresIn'],
  });
};

export const generateRefreshToken = (userId: string): string => {
  return jwt.sign({ userId }, config.jwt.refreshSecret, {
    expiresIn: config.jwt.refreshExpiresIn as jwt.SignOptions['expiresIn'],
  });
};

export const verifyAccessToken = (token: string): JwtPayload => {
  const decoded = jwt.verify(token, config.jwt.secret) as JwtPayload;
  return decoded;
};

export const verifyRefreshToken = (token: string): JwtPayload => {
  const decoded = jwt.verify(token, config.jwt.refreshSecret) as JwtPayload;
  return decoded;
};

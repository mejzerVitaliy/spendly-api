import jwt, { SignOptions } from 'jsonwebtoken';
import { environmentVariables } from '../../config';

const ACCESS_TOKEN_EXPIRATION = '15m';
const REFRESH_TOKEN_EXPIRATION = '7d';

const signJwtToken = (
  payload: string | object | Buffer,
  options?: SignOptions,
  expiresIn?: typeof ACCESS_TOKEN_EXPIRATION | typeof REFRESH_TOKEN_EXPIRATION,
) => {
  return jwt.sign(payload, environmentVariables.APPLICATION_SECRET, {
    expiresIn,
    ...options,
  });
};

const verifyJwtToken = (token: string) => {
  try {
    return jwt.verify(token, environmentVariables.APPLICATION_SECRET);
  } catch (error) {
    return null;
  }
};

export {
  signJwtToken,
  verifyJwtToken,
  ACCESS_TOKEN_EXPIRATION,
  REFRESH_TOKEN_EXPIRATION,
};

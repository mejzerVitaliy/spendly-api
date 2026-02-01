import { userRepository } from '@/database/repositories/user';
import bcrypt from 'bcryptjs';
import {
  ACCESS_TOKEN_EXPIRATION,
  REFRESH_TOKEN_EXPIRATION,
  signJwtToken,
  verifyJwtToken,
  BadRequestError,
  LoginInput,
  RegisterInput,
  UnauthorizedError,
  LoginTwoFactorInput,
  LoginTwoFactorResendInput,
} from '@/business/lib';
import { JwtPayload } from 'jsonwebtoken';
import { tokenService } from '@/business/services/tokens/token.service';
import { walletService } from '@/business/services/wallet';
import { TokenType } from '@prisma/client';
import { emailService } from '@/bootstrap/email';

const generateTwoFactorCode = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

const register = async (user: RegisterInput) => {
  const existingUser = await userRepository.findFirst({
    where: {
      email: {
        equals: user.email,
        mode: 'insensitive',
      },
    },
  });

  if (existingUser) {
    throw new BadRequestError('User with this email already exists');
  }

  const hashedPassword = await bcrypt.hash(user.password, 10);

  const createdUser = await userRepository.create({
    data: {
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      password: hashedPassword,
      avatarUrl: '',
    },
  });

  await walletService.createDefaultWallet(
    createdUser.id,
    createdUser.mainCurrencyCode,
  );

  await emailService.sendWelcomeEmail(createdUser.email);

  const { accessToken, refreshToken } = await generateTokens(createdUser.id);

  return {
    createdUser,
    accessToken,
    refreshToken,
  };
};

const login = async ({ email, password }: LoginInput) => {
  const user = await userRepository.findFirst({
    where: {
      email: {
        equals: email,
        mode: 'insensitive',
      },
    },
  });

  if (!user) {
    throw new BadRequestError('User not found');
  }

  const isPasswordValid = await bcrypt.compare(password, user.password);

  if (!isPasswordValid) {
    throw new BadRequestError('Invalid password');
  }

  await tokenService.removeAllByUserId(user.id, TokenType.REFRESH);

  console.log('🔐 User 2FA Status:', {
    email: user.email,
    isTwoFactorEnabled: user.isTwoFactorEnabled,
  });

  if (user.isTwoFactorEnabled) {
    console.log('📧 Sending 2FA code...');

    const twoFactorCode = generateTwoFactorCode();
    const twoFactorExpiresAt = new Date(Date.now() + 5 * 60 * 1000);

    await userRepository.update({
      where: {
        id: user.id,
      },
      data: {
        twoFactorCode,
        twoFactorExpiresAt,
      },
    });

    try {
      await emailService.sendEmail(
        user.email,
        'Two-Factor Authentication Code',
        `<p>Your two-factor authentication code is: <strong>${twoFactorCode}</strong></p>`,
      );
    } catch (error) {
      throw new BadRequestError(
        'Failed to send verification code. Please try again.',
      );
    }

    return {
      user,
      requiresTwoFactor: true,
      message: 'Two-factor authentication code sent to your email',
    };
  } else {
    const { accessToken, refreshToken } = await generateTokens(user.id);

    return {
      user,
      accessToken,
      refreshToken,
    };
  }
};

const loginTwoFactor = async ({ email, code }: LoginTwoFactorInput) => {
  const user = await userRepository.findFirst({
    where: {
      email,
    },
  });

  if (!user || !user.twoFactorCode || !user.twoFactorExpiresAt) {
    throw new BadRequestError('2FA not requested or expired');
  }

  const isValidCode = user.twoFactorCode === code;
  const isExpired = new Date() > user.twoFactorExpiresAt;

  if (!isValidCode || isExpired) {
    throw new BadRequestError('Invalid or expired 2FA code');
  }

  await userRepository.update({
    where: { id: user.id },
    data: {
      twoFactorCode: null,
      twoFactorExpiresAt: null,
    },
  });

  const { accessToken, refreshToken } = await generateTokens(user.id);

  return {
    user,
    accessToken,
    refreshToken,
  };
};

const loginTwoFactorResend = async ({ email }: LoginTwoFactorResendInput) => {
  const user = await userRepository.findFirst({
    where: { email },
  });

  if (!user) {
    throw new BadRequestError('User not found');
  }

  const twoFactorCode = generateTwoFactorCode();
  const twoFactorExpiresAt = new Date(Date.now() + 5 * 60 * 1000);

  await userRepository.update({
    where: { id: user.id },
    data: { twoFactorCode, twoFactorExpiresAt },
  });

  await emailService.sendEmail(
    user.email,
    'Two-Factor Authentication Code',
    `<p>Your two-factor authentication code is: <strong>${twoFactorCode}</strong></p>`,
  );
};

const toggleTwoFactor = async (userId: string) => {
  const user = await userRepository.findFirst({
    where: { id: userId },
  });

  if (!user) {
    throw new BadRequestError('User not found');
  }

  const newState = !user.isTwoFactorEnabled;

  await userRepository.update({
    where: { id: userId },
    data: { isTwoFactorEnabled: newState },
  });
};

const generateTokens = async (userId: string) => {
  const accessToken = signJwtToken(
    { userId },
    { expiresIn: ACCESS_TOKEN_EXPIRATION },
  );

  const refreshToken = signJwtToken(
    { userId },
    { expiresIn: REFRESH_TOKEN_EXPIRATION },
  );

  await tokenService.save(userId, refreshToken, TokenType.REFRESH);

  return {
    accessToken,
    refreshToken,
  };
};

const getMe = async (userId: string) => {
  return await userRepository.findFirst({
    where: {
      id: userId,
    },
  });
};

const refresh = async (refreshToken: string) => {
  const userData = verifyJwtToken(refreshToken) as JwtPayload;

  if (!userData) {
    throw new UnauthorizedError('Invalid refresh token');
  }

  try {
    const token = await tokenService.getByToken(refreshToken);

    if (!token || token.userId !== userData.userId) {
      throw new UnauthorizedError('Invalid refresh token');
    }

    // Remove the used refresh token
    await tokenService.removeByToken(refreshToken);

    // Generate new tokens
    const { accessToken, refreshToken: newRefreshToken } = await generateTokens(
      userData.userId,
    );

    return {
      accessToken,
      newRefreshToken,
    };
  } catch (error) {
    throw new UnauthorizedError('Invalid refresh token');
  }
};

export const authService = {
  register,
  login,
  loginTwoFactor,
  loginTwoFactorResend,
  toggleTwoFactor,
  getMe,
  refresh,
};

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
  GuestInput,
  UpgradeGuestInput,
} from '@/business/lib';
import { JwtPayload } from 'jsonwebtoken';
import { tokenService } from '@/business/services/tokens/token.service';
import { walletService } from '@/business/services/wallet';
import { TokenType, UserType } from '@prisma/client';
import { emailService } from '@/bootstrap/email';
import { categoryRepository } from '@/database/repositories';

const generateTwoFactorCode = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

const createGuest = async (input: GuestInput) => {
  const createdUser = await userRepository.create({
    data: {
      type: UserType.GUEST,
      mainCurrencyCode: input.mainCurrencyCode,
      onboardingCompleted: true,
    },
  });

  await walletService.createDefaultWallet(
    createdUser.id,
    input.mainCurrencyCode,
    input.walletInitialBalance,
  );

  for (const [index, categoryId] of input.favoriteCategories.entries()) {
    await categoryRepository.addUserFavoriteCategory(
      createdUser.id,
      categoryId,
      index,
    );
  }

  const { accessToken, refreshToken } = await generateTokens(createdUser.id);

  return {
    createdUser,
    accessToken,
    refreshToken,
  };
};

const upgradeGuest = async (userId: string, input: UpgradeGuestInput) => {
  const user = await userRepository.findFirst({
    where: { id: userId },
  });

  if (!user) {
    throw new BadRequestError('User not found');
  }

  if (user.type !== UserType.GUEST) {
    throw new BadRequestError('User is already registered');
  }

  const existingUser = await userRepository.findFirst({
    where: {
      email: {
        equals: input.email,
        mode: 'insensitive',
      },
    },
  });

  if (existingUser) {
    throw new BadRequestError('User with this email already exists');
  }

  const hashedPassword = await bcrypt.hash(input.password, 10);

  const updatedUser = await userRepository.update({
    where: { id: userId },
    data: {
      type: UserType.REGISTERED,
      email: input.email,
      password: hashedPassword,
    },
  });

  await emailService.sendWelcomeEmail(input.email);

  await tokenService.removeAllByUserId(userId, TokenType.REFRESH);
  const { accessToken, refreshToken } = await generateTokens(userId);

  return {
    user: updatedUser,
    accessToken,
    refreshToken,
  };
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
      type: UserType.REGISTERED,
      email: user.email,
      password: hashedPassword,
      onboardingCompleted: true,
    },
  });

  await walletService.createDefaultWallet(
    createdUser.id,
    createdUser.mainCurrencyCode,
  );

  await emailService.sendWelcomeEmail(createdUser.email!);

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

  if (!user || !user.password) {
    throw new BadRequestError('User not found');
  }

  const isPasswordValid = await bcrypt.compare(password, user.password);

  if (!isPasswordValid) {
    throw new BadRequestError('Invalid password');
  }

  await tokenService.removeAllByUserId(user.id, TokenType.REFRESH);

  const { accessToken, refreshToken } = await generateTokens(user.id);

  return {
    user,
    accessToken,
    refreshToken,
  };
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
  createGuest,
  upgradeGuest,
  register,
  login,
  getMe,
  refresh,
};

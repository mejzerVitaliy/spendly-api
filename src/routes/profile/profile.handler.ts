import { FastifyReply, FastifyRequest } from 'fastify';
import { JwtPayload } from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { userRepository } from '@/database/repositories/user';
import { categoryRepository } from '@/database/repositories/category';
import { currencyService } from '@/business/services/currency';
import { tokenService } from '@/business/services/tokens/token.service';
import { analyticsService } from '@/business/services/analytics/analytics.service';
import { BadRequestError } from '@/business/lib';
import { TokenType, TransactionType } from '@prisma/client';

interface UpdateSettingsBody {
  mainCurrencyCode?: string;
  defaultIncomeCategoryId?: string | null;
  defaultExpenseCategoryId?: string | null;
  defaultCurrencyCode?: string | null;
}

const updateSettings = async (
  req: FastifyRequest<{ Body: UpdateSettingsBody }>,
  reply: FastifyReply,
) => {
  const { userId } = req.user as JwtPayload;
  const {
    mainCurrencyCode,
    defaultIncomeCategoryId,
    defaultExpenseCategoryId,
    defaultCurrencyCode,
  } = req.body;

  const data: Record<string, unknown> = {};

  if (mainCurrencyCode !== undefined) {
    await currencyService.getCurrencyByCode(mainCurrencyCode);
    data.mainCurrencyCode = mainCurrencyCode;
  }

  if (defaultIncomeCategoryId !== undefined) {
    if (defaultIncomeCategoryId !== null) {
      const category = await categoryRepository.findById(
        defaultIncomeCategoryId,
      );
      if (!category || category.type !== TransactionType.INCOME) {
        throw new BadRequestError('Invalid default income category');
      }
    }
    data.defaultIncomeCategoryId = defaultIncomeCategoryId;
  }

  if (defaultExpenseCategoryId !== undefined) {
    if (defaultExpenseCategoryId !== null) {
      const category = await categoryRepository.findById(
        defaultExpenseCategoryId,
      );
      if (!category || category.type !== TransactionType.EXPENSE) {
        throw new BadRequestError('Invalid default expense category');
      }
    }
    data.defaultExpenseCategoryId = defaultExpenseCategoryId;
  }

  if (defaultCurrencyCode !== undefined) {
    if (defaultCurrencyCode !== null) {
      await currencyService.getCurrencyByCode(defaultCurrencyCode);
    }
    data.defaultCurrencyCode = defaultCurrencyCode;
  }

  await userRepository.update({
    where: { id: userId },
    data,
  });

  if (mainCurrencyCode !== undefined) {
    analyticsService.track('currency_changed', userId, {
      currency: mainCurrencyCode,
    });
  }

  reply.send({ message: 'Settings updated successfully' });
};

const updateEmail = async (
  req: FastifyRequest<{ Body: { email: string } }>,
  reply: FastifyReply,
) => {
  const { userId } = req.user as JwtPayload;
  const { email } = req.body;

  const existing = await userRepository.findFirst({
    where: { email: { equals: email, mode: 'insensitive' } },
  });

  if (existing && existing.id !== userId) {
    throw new BadRequestError('This email is already in use');
  }

  await userRepository.update({
    where: { id: userId },
    data: { email },
  });

  analyticsService.track('email_updated', userId);

  reply.send({ message: 'Email updated successfully' });
};

const changePassword = async (
  req: FastifyRequest<{
    Body: { currentPassword: string; newPassword: string };
  }>,
  reply: FastifyReply,
) => {
  const { userId } = req.user as JwtPayload;
  const { currentPassword, newPassword } = req.body;

  const user = await userRepository.findFirst({ where: { id: userId } });

  if (!user?.password) {
    throw new BadRequestError('User not found');
  }

  const isValid = await bcrypt.compare(currentPassword, user.password);
  if (!isValid) {
    throw new BadRequestError('Current password is incorrect');
  }

  const hashed = await bcrypt.hash(newPassword, 10);

  await userRepository.update({
    where: { id: userId },
    data: { password: hashed },
  });

  analyticsService.track('password_changed', userId);

  reply.send({ message: 'Password changed successfully' });
};

const deleteAccount = async (req: FastifyRequest, reply: FastifyReply) => {
  const { userId } = req.user as JwtPayload;

  analyticsService.track('account_deleted', userId);

  await tokenService.removeAllByUserId(userId, TokenType.REFRESH);
  await userRepository.delete({ where: { id: userId } });

  reply.send({ message: 'Account deleted successfully' });
};

export const profileHandler = {
  updateSettings,
  updateEmail,
  changePassword,
  deleteAccount,
};

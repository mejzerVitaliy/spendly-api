import { pushTokenRepository } from '@/database/repositories';
import { userRepository } from '@/database/repositories';

const register = async (userId: string, token: string, language?: string) => {
  await pushTokenRepository.upsertForUser(userId, token);
  if (language) {
    await userRepository.update({ where: { id: userId }, data: { language } });
  }
};

const unregister = async (userId: string, token: string) => {
  await pushTokenRepository.deleteByToken(userId, token);
};

export const pushTokenService = {
  register,
  unregister,
};

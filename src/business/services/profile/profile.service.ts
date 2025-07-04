import { userRepository } from '@/database/repositories';
import { cloudinaryService } from '@/business/services';
import {
  BadRequestError,
  UnauthorizedError,
  UpdatePasswordInput,
  UpdateProfileInput,
  UpdateSettingsInput,
} from '@/business/lib';
import { FastifyRequest } from 'fastify';
import bcrypt from 'bcryptjs';

const updateProfile = async (userId: string, data: UpdateProfileInput) => {
  const updatedUser = await userRepository.update({
    where: {
      id: userId,
    },
    data,
  });

  return updatedUser;
};

const uploadAvatar = async (userId: string, request: FastifyRequest) => {
  try {
    const data = await request.file();

    if (!data) {
      throw new BadRequestError('No file uploaded');
    }

    if (!data.mimetype.startsWith('image/')) {
      throw new BadRequestError('Only image files are allowed');
    }

    const chunks: Buffer[] = [];

    for await (const chunk of data.file) {
      chunks.push(chunk);
    }
    const fileBuffer = Buffer.concat(chunks);

    const MAX_SIZE = 5 * 1024 * 1024;

    if (fileBuffer.length > MAX_SIZE) {
      throw new BadRequestError('File size too large. Maximum 5MB allowed');
    }

    const user = await userRepository.findFirst({
      where: {
        id: userId,
      },
    });

    if (!user) {
      throw new BadRequestError('User not found');
    }

    if (user.avatarUrl) {
      const publicId = extractPublicIdFromUrl(user.avatarUrl);

      if (publicId) {
        await cloudinaryService.deleteAvatar(publicId);
      }
    }

    const { url } = await cloudinaryService.uploadAvatar(fileBuffer, userId);

    const updatedUser = await userRepository.update({
      where: {
        id: userId,
      },
      data: {
        avatarUrl: url,
      },
    });

    return updatedUser;
  } catch (error) {
    console.error('Upload error:', error);
  }
};

const deleteAvatar = async (userId: string) => {
  const user = await userRepository.findFirst({
    where: {
      id: userId,
    },
  });

  if (!user) {
    throw new BadRequestError('User not found');
  }

  if (!user.avatarUrl) {
    throw new BadRequestError('User has no avatar to delete');
  }

  const publicId = extractPublicIdFromUrl(user.avatarUrl);
  if (publicId) {
    await cloudinaryService.deleteAvatar(publicId);
  }

  const updatedUser = await userRepository.update({
    where: {
      id: userId,
    },
    data: {
      avatarUrl: '',
    },
  });

  return updatedUser;
};

const extractPublicIdFromUrl = (url: string): string | null => {
  try {
    const regex = /\/v\d+\/(.+?)\.(jpg|jpeg|png|gif|webp)$/i;
    const match = url.match(regex);
    return match ? match[1] : null;
  } catch {
    return null;
  }
};

const verifyPassword = async (password: string, hashedPassword: string) => {
  return await bcrypt.compare(password, hashedPassword);
};

const updatePassword = async (userId: string, data: UpdatePasswordInput) => {
  const user = await userRepository.findFirst({
    where: {
      id: userId,
    },
  });

  if (!user) {
    throw new BadRequestError('User not found');
  }

  const isPasswordValid = await verifyPassword(data.oldPassword, user.password);

  if (!isPasswordValid) {
    throw new UnauthorizedError('Invalid password');
  }

  const hashedPassword = await bcrypt.hash(data.newPassword, 10);

  await userRepository.update({
    where: {
      id: userId,
    },
    data: {
      password: hashedPassword,
    },
  });
};

const deleteUser = async (userId: string) => {
  await userRepository.delete({
    where: { id: userId },
  });
};

const updateSettings = async (userId: string, data: UpdateSettingsInput) => {
  await userRepository.update({
    where: { id: userId },
    data,
  });
};

export const profileService = {
  updateProfile,
  uploadAvatar,
  deleteAvatar,
  updatePassword,
  deleteUser,
  updateSettings,
};

import { userRepository } from '@/database/repositories/user';
import { cloudinaryService } from '@/business/services/cloudinary/cloudinary.service';
import { BadRequestError, UpdateProfileInput } from '@/business/lib';
import { FastifyRequest } from 'fastify';

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
  // Отладочная информация
  console.log('Content-Type:', request.headers['content-type']);
  console.log('Content-Length:', request.headers['content-length']);

  try {
    // Простой подход с request.file()
    const data = await request.file();
    console.log('File data:', data ? 'File found' : 'No file');

    if (!data) {
      throw new BadRequestError('No file uploaded');
    }

    console.log('File info:', {
      fieldname: data.fieldname,
      filename: data.filename,
      mimetype: data.mimetype,
      encoding: data.encoding,
    });

    if (!data.mimetype.startsWith('image/')) {
      throw new BadRequestError('Only image files are allowed');
    }

    const chunks: Buffer[] = [];
    for await (const chunk of data.file) {
      chunks.push(chunk);
    }
    const fileBuffer = Buffer.concat(chunks);

    console.log('File buffer size:', fileBuffer.length);

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
    throw error;
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

export const profileService = {
  updateProfile,
  uploadAvatar,
  deleteAvatar,
};

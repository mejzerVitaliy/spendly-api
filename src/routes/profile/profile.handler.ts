import { FastifyReply, FastifyRequest } from 'fastify';
import {
  UpdateProfileInput,
  UpdatePasswordInput,
  UpdateSettingsInput,
} from '@/business/lib';
import { JwtPayload } from 'jsonwebtoken';
import { profileService } from '@/business/services/profile/profile.service';

const updateProfile = async (
  request: FastifyRequest<{
    Body: UpdateProfileInput;
  }>,
  reply: FastifyReply,
) => {
  const { userId } = request.user as JwtPayload;
  const { body } = request;

  await profileService.updateProfile(userId, body);

  const response = {
    message: 'Profile updated successfully',
  };

  reply.send(response);
};

const updateAvatar = async (request: FastifyRequest, reply: FastifyReply) => {
  const { userId } = request.user as JwtPayload;

  await profileService.uploadAvatar(userId, request);

  const response = {
    message: 'Avatar uploaded successfully',
  };

  reply.send(response);
};

const deleteAvatar = async (request: FastifyRequest, reply: FastifyReply) => {
  const { userId } = request.user as JwtPayload;

  await profileService.deleteAvatar(userId);

  const response = {
    message: 'Avatar deleted successfully',
  };

  reply.send(response);
};

const updatePassword = async (
  request: FastifyRequest<{
    Body: UpdatePasswordInput;
  }>,
  reply: FastifyReply,
) => {
  const { userId } = request.user as JwtPayload;
  const { body } = request;

  await profileService.updatePassword(userId, body);

  const response = {
    message: 'Password updated successfully',
  };

  reply.send(response);
};

const deleteUser = async (request: FastifyRequest, reply: FastifyReply) => {
  const { userId } = request.user as JwtPayload;

  await profileService.deleteUser(userId);

  const response = {
    message: 'User is deleted successfully',
  };

  reply.send(response);
};

const updateSettings = async (
  request: FastifyRequest<{
    Body: UpdateSettingsInput;
  }>,
  reply: FastifyReply,
) => {
  const { userId } = request.user as JwtPayload;
  const { body } = request;

  await profileService.updateSettings(userId, body);

  const response = {
    message: 'Settings updated successfully',
  };

  reply.send(response);
};

export const profileHandler = {
  updateProfile,
  updateAvatar,
  deleteAvatar,
  updatePassword,
  deleteUser,
  updateSettings,
};

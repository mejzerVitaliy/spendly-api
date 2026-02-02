import {
  CreateWalletInput,
  UpdateWalletInput,
  SetDefaultWalletInput,
} from '@/business';
import { walletService } from '@/business/services/wallet';
import { FastifyReply, FastifyRequest } from 'fastify';
import { JwtPayload } from 'jsonwebtoken';

const create = async (
  req: FastifyRequest<{
    Body: CreateWalletInput;
  }>,
  reply: FastifyReply,
) => {
  const { userId } = req.user as JwtPayload;
  const { body } = req;

  const wallet = await walletService.create(userId, body);

  const response = {
    message: 'Wallet created successfully',
    data: wallet,
  };

  reply.send(response);
};

const getAll = async (
  req: FastifyRequest<{
    Querystring: { includeArchived?: string };
  }>,
  reply: FastifyReply,
) => {
  const { userId } = req.user as JwtPayload;
  const includeArchived = req.query.includeArchived === 'true';

  const wallets = await walletService.getAll(userId, includeArchived);

  const response = {
    message: 'Wallets fetched successfully',
    data: wallets,
  };

  reply.send(response);
};

const getById = async (
  req: FastifyRequest<{
    Params: { id: string };
  }>,
  reply: FastifyReply,
) => {
  const { userId } = req.user as JwtPayload;
  const { id } = req.params;

  const wallet = await walletService.getById(userId, id);

  const response = {
    message: 'Wallet fetched successfully',
    data: wallet,
  };

  reply.send(response);
};

const getDefault = async (req: FastifyRequest, reply: FastifyReply) => {
  const { userId } = req.user as JwtPayload;

  const wallet = await walletService.getDefaultWallet(userId);

  const response = {
    message: 'Default wallet fetched successfully',
    data: wallet,
  };

  reply.send(response);
};

const update = async (
  req: FastifyRequest<{
    Params: { id: string };
    Body: UpdateWalletInput;
  }>,
  reply: FastifyReply,
) => {
  const { userId } = req.user as JwtPayload;
  const { id } = req.params;
  const { body } = req;

  const wallet = await walletService.update(userId, id, body);

  const response = {
    message: 'Wallet updated successfully',
    data: wallet,
  };

  reply.send(response);
};

const archive = async (
  req: FastifyRequest<{
    Params: { id: string };
  }>,
  reply: FastifyReply,
) => {
  const { userId } = req.user as JwtPayload;
  const { id } = req.params;

  await walletService.archive(userId, id);

  const response = {
    message: 'Wallet archived successfully',
  };

  reply.send(response);
};

const unarchive = async (
  req: FastifyRequest<{
    Params: { id: string };
  }>,
  reply: FastifyReply,
) => {
  const { userId } = req.user as JwtPayload;
  const { id } = req.params;

  await walletService.unarchive(userId, id);

  const response = {
    message: 'Wallet unarchived successfully',
  };

  reply.send(response);
};

const setDefault = async (
  req: FastifyRequest<{
    Body: SetDefaultWalletInput;
  }>,
  reply: FastifyReply,
) => {
  const { userId } = req.user as JwtPayload;
  const { walletId } = req.body;

  const wallet = await walletService.setDefault(userId, walletId);

  const response = {
    message: 'Default wallet updated successfully',
    data: wallet,
  };

  reply.send(response);
};

const getTotalBalance = async (req: FastifyRequest, reply: FastifyReply) => {
  const { userId } = req.user as JwtPayload;

  const data = await walletService.getTotalBalance(userId);

  const response = {
    message: 'Total balance fetched successfully',
    data,
  };

  reply.send(response);
};

export const walletHandler = {
  create,
  getAll,
  getById,
  getDefault,
  update,
  archive,
  unarchive,
  setDefault,
  getTotalBalance,
};

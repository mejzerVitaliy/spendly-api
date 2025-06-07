import { CreateTransactionInput, UpdateTransactionInput } from '@/business';
import { transactionService } from '@/business/services/transaction';
import { FastifyReply, FastifyRequest } from 'fastify';
import { JwtPayload } from 'jsonwebtoken';

const create = async (
  req: FastifyRequest<{
    Body: CreateTransactionInput;
  }>,
  reply: FastifyReply,
) => {
  const { userId } = req.user as JwtPayload;
  const { body } = req;

  const transaction = await transactionService.create(userId, body);

  const response = {
    message: 'Transaction created successfully',
    data: transaction,
  };

  reply.send(response);
};

const getAll = async (req: FastifyRequest, reply: FastifyReply) => {
  const { userId } = req.user as JwtPayload;

  const transactions = await transactionService.getAll(userId);

  const response = {
    message: 'Transactions fetched successfully',
    data: transactions,
  };

  reply.send(response);
};

const getById = async (
  req: FastifyRequest<{
    Params: {
      id: string;
    };
  }>,
  reply: FastifyReply,
) => {
  const { userId } = req.user as JwtPayload;
  const { id } = req.params;

  const transaction = await transactionService.getById(userId, id);

  const response = {
    message: 'Transaction fetched successfully',
    data: transaction,
  };

  reply.send(response);
};

const update = async (
  req: FastifyRequest<{
    Params: {
      id: string;
    };
    Body: UpdateTransactionInput;
  }>,
  reply: FastifyReply,
) => {
  const { id } = req.params;
  const { body } = req;

  const transaction = await transactionService.update(id, body);

  const response = {
    message: 'Transaction updated successfully',
    data: transaction,
  };

  reply.send(response);
};

const remove = async (
  req: FastifyRequest<{
    Params: {
      id: string;
    };
  }>,
  reply: FastifyReply,
) => {
  const { id } = req.params;

  await transactionService.remove(id);

  const response = {
    message: 'Transaction deleted successfully',
  };

  reply.send(response);
};

export const transactionHandler = {
  create,
  getAll,
  getById,
  update,
  remove,
};

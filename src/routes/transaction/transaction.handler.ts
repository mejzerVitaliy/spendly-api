import {
  CreateTransactionInput,
  ParseTextTransactionInput,
  UpdateTransactionInput,
} from '@/business';
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

const getAll = async (
  req: FastifyRequest<{
    Querystring: {
      startDate?: string;
      endDate?: string;
      search?: string;
    };
  }>,
  reply: FastifyReply,
) => {
  const { userId } = req.user as JwtPayload;
  const { startDate, endDate, search } = req.query;

  const transactions = await transactionService.getAll({
    userId,
    startDate,
    endDate,
    search,
  });

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

const createFromText = async (
  req: FastifyRequest<{
    Body: ParseTextTransactionInput;
  }>,
  reply: FastifyReply,
) => {
  const { userId } = req.user as JwtPayload;
  const { text } = req.body;

  const transactions = await transactionService.createFromText(userId, text);

  const response = {
    message: 'Transactions created from text successfully',
    data: transactions,
  };

  reply.send(response);
};

const createFromVoice = async (req: FastifyRequest, reply: FastifyReply) => {
  const { userId } = req.user as JwtPayload;

  const data = await req.file();

  if (!data) {
    reply.status(400).send({ message: 'Audio file is required' });
    return;
  }

  const audioBuffer = await data.toBuffer();
  const filename = data.filename || 'audio.m4a';

  const transactions = await transactionService.createFromVoice(
    userId,
    audioBuffer,
    filename,
  );

  reply.send({
    message: 'Transactions created from voice successfully',
    data: transactions,
  });
};

export const transactionHandler = {
  create,
  createFromText,
  createFromVoice,
  getAll,
  getById,
  update,
  remove,
};

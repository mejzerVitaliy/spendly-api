import { CreateTransactionInput, IdInput, UpdateTransactionInput } from "@/business";
import { transactionsService } from "@/business/services/transactions/transactions.service";
import { FastifyReply, FastifyRequest } from "fastify";
import { JwtPayload } from "jsonwebtoken";

const create = async (
    request: FastifyRequest<{Body: CreateTransactionInput}>, 
    reply: FastifyReply
  ) => {
  const {body} = request;
  const {userId} = request.user as JwtPayload;

  const data = await transactionsService.create(body, userId);

  const response = {
    message: 'Transaction is created successfully',
  };

  reply.send(response)
}

const getAll = async (
  request: FastifyRequest, 
  reply: FastifyReply
) => {
  const {userId} = request.user as JwtPayload;

  const data = await transactionsService.getAllByUserId(userId);

  const response = {
    message: 'Transactions are retrieved successfully',
    data
  };

  reply.send(response)
}

const update = async (
  request: FastifyRequest<{Body: UpdateTransactionInput, Params: IdInput}>, 
  reply: FastifyReply
) => {
  const {body} = request;
  const {id} = request.params;
  const {userId} = request.user as JwtPayload;

  const data = await transactionsService.update(id, body);

  const response = {
    message: 'Transaction is updated successfully',
    data
  };

  reply.send(response)
}
const remove = async (
  request: FastifyRequest<{Params: IdInput}>, 
  reply: FastifyReply
) => {
  const {id} = request.params;
  const {userId} = request.user as JwtPayload;

  await transactionsService.remove(id, userId);

  const response = {
    message: 'Transaction is deleted successfully',
  };

  reply.send(response)
}

export const transactionsHandler = {
  create,
  getAll,
  update,
  remove
}
import { FastifyInstance } from "fastify";
import { transactionsHandler } from "./transactions.handler";
import { createTransactionBodySchema, getAllTransactionsResponseSchema, messageResponseSchema, updateTransactionBodySchema } from "@/business";
import { get } from "http";

export const transactionsRoutes = async (fastify: FastifyInstance) => {
/*************  ✨ Codeium Command 🌟  *************/
  fastify.post(
    "/",
    {
      preHandler: [fastify.authenticate],
      schema: {
        tags: ['transactions'],
        summary: 'Create a new transaction',
        body: createTransactionBodySchema,
        response: {
          200: messageResponseSchema
        },
      }
    },
    transactionsHandler.create
  ),

  fastify.get(
    "/",
    {
      preHandler: [fastify.authenticate],
      schema: {
        tags: ['transactions'],
        summary: 'Get all transactions',
        response: {
          200: getAllTransactionsResponseSchema
        },
      }
    },
    transactionsHandler.getAll
  )

  fastify.put(
    "/:id",
    {
      preHandler: [fastify.authenticate],
      schema: {
        tags: ['transactions'],
        summary: 'Update a transaction',
        body: updateTransactionBodySchema,
        response: {
          200: messageResponseSchema
        },
      }
    },
    transactionsHandler.update
  )
  
  fastify.delete(
    "/:id",
    {
      preHandler: [fastify.authenticate],
      schema: {
        tags: ['transactions'],
        summary: 'Delete a transaction',
        response: {
          200: messageResponseSchema
        },
      }
    },
    transactionsHandler.remove
  )
}

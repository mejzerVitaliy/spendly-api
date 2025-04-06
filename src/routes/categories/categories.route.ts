import { getAllCategorioesResponceSchema } from "@/business";
import { FastifyInstance } from "fastify";
import { categoriesHandler } from "./categories.handler";

export const categoryRoutes = async (fastify: FastifyInstance) => {
  fastify.get(
    '/',
    {
      preHandler: [fastify.authenticate],
      schema: {
        tags: ['categories'],
        summary: 'Get all categories',
        response: {
          200: getAllCategorioesResponceSchema
        },
      }
    },
    categoriesHandler.getAll
  )
}
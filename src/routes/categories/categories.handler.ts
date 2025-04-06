import { categoriesService } from "@/business/services/categories/categories.service";
import { FastifyReply, FastifyRequest } from "fastify";

const getAll = async (
  request: FastifyRequest,
  reply: FastifyReply
) => {
  const data = await categoriesService.getAll();

  const response = {
    message: 'Categories are retrieved successfully',
    data
  };

  reply.send(response)
}

export const categoriesHandler = {
  getAll
}
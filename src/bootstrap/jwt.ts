import fastify, { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { environmentVariables } from "@/config";
import fastifyJwt from "@fastify/jwt";


export const configureJwt = async (fastify: FastifyInstance) => {
  await fastify.register(fastifyJwt, {
    secret: environmentVariables.APPLICATION_SECRET,
  });

  fastify.decorate(
    "authenticate", 
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        await request.jwtVerify();
      } catch (err) {
        reply.send(err);
      }
    }
  );
}
import "fastify";

declare module "fastify" {
    export interface FastifyRequest {
        oauth: any
    }
    export interface FastifyInstance {
        authenticate: any
    }
}
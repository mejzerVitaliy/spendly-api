import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { environmentVariables } from '@/config';
import { transactionService } from '@/business/services/transaction/transaction.service';

export async function configureCronRoutes(fastify: FastifyInstance) {
  fastify.post(
    '/cron/recurring',
    {
      schema: {
        headers: z.object({
          authorization: z.string(),
        }),
        response: {
          200: z.object({
            ok: z.boolean(),
            processed: z.number(),
            failed: z.number(),
            total: z.number(),
          }),
        },
      },
    },
    async (request, reply) => {
      const token = request.headers.authorization?.replace('Bearer ', '');
      if (token !== environmentVariables.CRON_SECRET) {
        return reply.status(401).send({ message: 'Unauthorized' });
      }

      const result = await transactionService.processAllRecurringDue();
      return reply.send({ ok: true, ...result });
    },
  );
}

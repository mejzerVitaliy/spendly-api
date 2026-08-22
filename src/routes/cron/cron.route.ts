import { timingSafeEqual } from 'crypto';
import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { environmentVariables } from '@/config';
import { transactionService } from '@/business/services/transaction/transaction.service';

const isValidCronSecret = (token: string | undefined): boolean => {
  if (!token) return false;

  const providedBuf = Buffer.from(token);
  const expectedBuf = Buffer.from(environmentVariables.CRON_SECRET);

  if (providedBuf.length !== expectedBuf.length) {
    // Still do a same-length comparison so a length mismatch doesn't
    // short-circuit and leak length information via timing.
    timingSafeEqual(expectedBuf, expectedBuf);
    return false;
  }

  return timingSafeEqual(providedBuf, expectedBuf);
};

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
      if (!isValidCronSecret(token)) {
        return reply.status(401).send({ message: 'Unauthorized' });
      }

      const result = await transactionService.processAllRecurringDue();
      return reply.send({ ok: true, ...result });
    },
  );
}

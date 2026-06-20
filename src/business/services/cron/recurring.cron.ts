import cron from 'node-cron';
import { transactionService } from '../transaction/transaction.service';

export function startRecurringCron(logger: {
  info: (msg: string) => void;
  error: (msg: string, err?: unknown) => void;
}) {
  // Runs every day at 00:05 to process all due recurring transactions
  cron.schedule('5 0 * * *', async () => {
    logger.info('[RecurringCron] Processing due recurring transactions...');
    try {
      const result = await transactionService.processAllRecurringDue();
      logger.info(
        `[RecurringCron] Done: ${result.processed} processed, ${result.failed} failed out of ${result.total} total`,
      );
    } catch (err) {
      logger.error('[RecurringCron] Fatal error during processing', err);
    }
  });

  logger.info('[RecurringCron] Scheduled daily at 00:05');
}

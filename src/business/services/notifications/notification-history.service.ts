import { notificationLogRepository } from '@/database/repositories';

const HISTORY_LIMIT = 50;

interface NotificationHistoryItem {
  id: string;
  type: string;
  titleKey: string;
  bodyKey: string;
  bodyParams: Record<string, string | number> | null;
  createdAt: string;
}

/**
 * Backfill source for the client's in-app notification list. Covers only
 * the server-dispatched types (reminder/streak/inactivity/weekly_summary/
 * monthly_recap - see notification-dispatch.service.ts), which are the only
 * ones a push can arrive for while the app is fully closed - exactly the
 * case where the client's own addNotificationReceivedListener never fires,
 * so without this the in-app list silently never learns about them.
 */
const getRecent = async (
  userId: string,
): Promise<NotificationHistoryItem[]> => {
  const rows = await notificationLogRepository.findRecentForUser({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    take: HISTORY_LIMIT,
  });

  return rows.map((row) => ({
    id: row.id,
    type: row.type,
    titleKey: row.titleKey,
    bodyKey: row.bodyKey,
    bodyParams:
      (row.bodyParams as Record<string, string | number> | null) ?? null,
    createdAt: row.createdAt.toISOString(),
  }));
};

export const notificationHistoryService = {
  getRecent,
};

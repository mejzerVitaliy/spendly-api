import { prisma } from '@/database/prisma/prisma';

const create = async (data: {
  userId?: string | null;
  event: string;
  properties?: Record<string, unknown>;
  createdAt?: Date;
}) => {
  return prisma.analyticsEvent.create({
    data: {
      userId: data.userId ?? null,
      event: data.event,
      properties: (data.properties ?? {}) as object,
      createdAt: data.createdAt,
    },
  });
};

const getDashboardData = async () => {
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const sevenDaysAgo = new Date(todayStart);
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
  const thirtyDaysAgo = new Date(todayStart);
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 29);

  const [
    dauResult,
    mauResult,
    totalEventsToday,
    totalEvents7d,
    topEvents,
    dauSeries,
    eventSeries,
  ] = await Promise.all([
    prisma.$queryRaw<{ count: bigint }[]>`
        SELECT COUNT(DISTINCT "user_id") as count
        FROM "analytics_events"
        WHERE "user_id" IS NOT NULL AND "created_at" >= ${todayStart}
      `,
    prisma.$queryRaw<{ count: bigint }[]>`
        SELECT COUNT(DISTINCT "user_id") as count
        FROM "analytics_events"
        WHERE "user_id" IS NOT NULL AND "created_at" >= ${thirtyDaysAgo}
      `,
    prisma.analyticsEvent.count({ where: { createdAt: { gte: todayStart } } }),
    prisma.analyticsEvent.count({
      where: { createdAt: { gte: sevenDaysAgo } },
    }),
    prisma.$queryRaw<{ event: string; count: bigint }[]>`
        SELECT "event", COUNT(*) as count
        FROM "analytics_events"
        WHERE "created_at" >= ${sevenDaysAgo}
        GROUP BY "event"
        ORDER BY count DESC
        LIMIT 10
      `,
    prisma.$queryRaw<{ date: Date; dau: bigint }[]>`
        SELECT DATE("created_at") as date, COUNT(DISTINCT "user_id") as dau
        FROM "analytics_events"
        WHERE "user_id" IS NOT NULL AND "created_at" >= ${sevenDaysAgo}
        GROUP BY DATE("created_at")
        ORDER BY date ASC
      `,
    prisma.$queryRaw<{ date: Date; count: bigint }[]>`
        SELECT DATE("created_at") as date, COUNT(*) as count
        FROM "analytics_events"
        WHERE "created_at" >= ${sevenDaysAgo}
        GROUP BY DATE("created_at")
        ORDER BY date ASC
      `,
  ]);

  return {
    dau: Number(dauResult[0]?.count ?? 0),
    mau: Number(mauResult[0]?.count ?? 0),
    totalEventsToday,
    totalEvents7d,
    topEvents: topEvents.map((e: { event: string; count: bigint }) => ({
      event: e.event,
      count: Number(e.count),
    })),
    dauSeries: dauSeries.map((e: { date: Date; dau: bigint }) => ({
      date: new Date(e.date).toISOString().split('T')[0],
      dau: Number(e.dau),
    })),
    eventSeries: eventSeries.map((e: { date: Date; count: bigint }) => ({
      date: new Date(e.date).toISOString().split('T')[0],
      count: Number(e.count),
    })),
  };
};

export const analyticsRepository = { create, getDashboardData };

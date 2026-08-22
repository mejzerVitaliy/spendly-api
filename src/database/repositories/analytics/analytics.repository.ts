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
    onboardingFunnel,
    day1Activation,
    retention,
    aiAdoption,
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
    // Onboarding funnel: how many people who started onboarding finished it
    // (aggregate counts, not per-user - there's no anonymous device id to
    // correlate a pre-signup "started" event to the same person's later
    // "completed" event, so this reads as a ratio over the window, not an
    // exact per-user conversion rate).
    prisma.$queryRaw<{ started: bigint; completed: bigint }[]>`
        SELECT
          COUNT(*) FILTER (WHERE "event" = 'onboarding_started') as started,
          COUNT(*) FILTER (WHERE "event" IN ('guest_created', 'signup_completed')) as completed
        FROM "analytics_events"
        WHERE "created_at" >= ${thirtyDaysAgo}
      `,
    // % of new accounts that created their first transaction within 24h of signup.
    prisma.$queryRaw<{ total_signups: bigint; activated_day1: bigint }[]>`
        WITH signups AS (
          SELECT "user_id", MIN("created_at") as signup_at
          FROM "analytics_events"
          WHERE "event" IN ('guest_created', 'signup_completed') AND "user_id" IS NOT NULL
          GROUP BY "user_id"
        ),
        first_tx AS (
          SELECT "user_id", MIN("created_at") as first_tx_at
          FROM "analytics_events"
          WHERE "event" = 'transaction_created' AND "user_id" IS NOT NULL
          GROUP BY "user_id"
        )
        SELECT
          COUNT(*) as total_signups,
          COUNT(*) FILTER (
            WHERE first_tx.first_tx_at IS NOT NULL
              AND first_tx.first_tx_at <= signups.signup_at + INTERVAL '24 hours'
          ) as activated_day1
        FROM signups
        LEFT JOIN first_tx ON first_tx."user_id" = signups."user_id"
      `,
    // D1/D7 retention, computed per-user relative to their own signup date
    // (not a fixed calendar window) so it starts producing real numbers as
    // soon as the first cohort ages past day 1/7, instead of needing a
    // pre-picked date range.
    prisma.$queryRaw<
      {
        eligible_for_d1: bigint;
        d1_returned: bigint;
        eligible_for_d7: bigint;
        d7_returned: bigint;
      }[]
    >`
        WITH signups AS (
          SELECT "user_id", MIN("created_at")::date as signup_date
          FROM "analytics_events"
          WHERE "event" IN ('guest_created', 'signup_completed') AND "user_id" IS NOT NULL
          GROUP BY "user_id"
        ),
        activity AS (
          SELECT DISTINCT "user_id", "created_at"::date as activity_date
          FROM "analytics_events"
          WHERE "user_id" IS NOT NULL
        )
        SELECT
          COUNT(DISTINCT CASE WHEN s.signup_date <= CURRENT_DATE - 1 THEN s."user_id" END) as eligible_for_d1,
          COUNT(DISTINCT CASE WHEN s.signup_date <= CURRENT_DATE - 1 AND a1."user_id" IS NOT NULL THEN s."user_id" END) as d1_returned,
          COUNT(DISTINCT CASE WHEN s.signup_date <= CURRENT_DATE - 7 THEN s."user_id" END) as eligible_for_d7,
          COUNT(DISTINCT CASE WHEN s.signup_date <= CURRENT_DATE - 7 AND a7."user_id" IS NOT NULL THEN s."user_id" END) as d7_returned
        FROM signups s
        LEFT JOIN activity a1 ON a1."user_id" = s."user_id" AND a1.activity_date = s.signup_date + 1
        LEFT JOIN activity a7 ON a7."user_id" = s."user_id" AND a7.activity_date = s.signup_date + 7
      `,
    // % of ever-signed-up users who have tried the AI parsing feature at least once.
    prisma.$queryRaw<{ total_users: bigint; ai_adopters: bigint }[]>`
        WITH signups AS (
          SELECT DISTINCT "user_id"
          FROM "analytics_events"
          WHERE "event" IN ('guest_created', 'signup_completed') AND "user_id" IS NOT NULL
        )
        SELECT
          COUNT(*) as total_users,
          COUNT(*) FILTER (
            WHERE EXISTS (
              SELECT 1 FROM "analytics_events" ai
              WHERE ai."event" = 'ai_transaction_used' AND ai."user_id" = signups."user_id"
            )
          ) as ai_adopters
        FROM signups
      `,
  ]);

  const rate = (numerator: number, denominator: number): number | null =>
    denominator > 0 ? Math.round((numerator / denominator) * 1000) / 10 : null;

  const funnel = onboardingFunnel[0];
  const activation = day1Activation[0];
  const ret = retention[0];
  const ai = aiAdoption[0];

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
    onboarding: {
      started30d: Number(funnel?.started ?? 0),
      completed30d: Number(funnel?.completed ?? 0),
      completionRatePct: rate(
        Number(funnel?.completed ?? 0),
        Number(funnel?.started ?? 0),
      ),
    },
    day1Activation: {
      totalSignups: Number(activation?.total_signups ?? 0),
      activated: Number(activation?.activated_day1 ?? 0),
      ratePct: rate(
        Number(activation?.activated_day1 ?? 0),
        Number(activation?.total_signups ?? 0),
      ),
    },
    retention: {
      d1: {
        eligible: Number(ret?.eligible_for_d1 ?? 0),
        returned: Number(ret?.d1_returned ?? 0),
        ratePct: rate(
          Number(ret?.d1_returned ?? 0),
          Number(ret?.eligible_for_d1 ?? 0),
        ),
      },
      d7: {
        eligible: Number(ret?.eligible_for_d7 ?? 0),
        returned: Number(ret?.d7_returned ?? 0),
        ratePct: rate(
          Number(ret?.d7_returned ?? 0),
          Number(ret?.eligible_for_d7 ?? 0),
        ),
      },
    },
    aiAdoption: {
      totalUsers: Number(ai?.total_users ?? 0),
      adopters: Number(ai?.ai_adopters ?? 0),
      ratePct: rate(Number(ai?.ai_adopters ?? 0), Number(ai?.total_users ?? 0)),
    },
  };
};

export const analyticsRepository = { create, getDashboardData };

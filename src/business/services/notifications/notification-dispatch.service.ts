import axios from 'axios';
import {
  transactionRepository,
  userRepository,
  pushTokenRepository,
  notificationCooldownRepository,
} from '@/database/repositories';

// Mirrors the client's notification.service.ts rules for the four types that
// are actually meant to reach someone who currently has the app closed -
// see QA-BUG-BACKLOG.md item 4a for why those specifically. Deliberately not
// covering recurring_due (tied to the recurring cron, not a re-engagement
// nudge), spending_trend/guest_data_risk (need context this generic daily
// pass doesn't have), or category_insight/no_income (unused on the client
// too - reserved types, never actually sent).
const COOLDOWN_HOURS: Record<string, number> = {
  weekly_summary: 6 * 24,
  monthly_recap: 20 * 24,
  streak: 23,
  inactivity: 22,
};

const STREAK_MILESTONES = [3, 5, 7, 10, 14, 21, 30];

type Lang = 'en' | 'ru';

// Copied verbatim from the client's en.json/ru.json `notifications` keys so
// server-dispatched pushes read identically to the client-scheduled ones.
const STRINGS: Record<Lang, Record<string, string>> = {
  en: {
    weeklySummaryTitle: 'Your weekly summary 📊',
    weeklySummaryBody:
      'The week is ending — open the app to see how you did financially.',
    monthlyRecapTitle: 'Month is almost over 📆',
    monthlyRecapBody:
      'Check your monthly spending recap in Analytics before the month resets.',
    streakTitle: '{{days}}-day streak 🔥',
    streakBody:
      "You've tracked your expenses {{days}} days in a row. Keep it going!",
    inactivityTitle: 'Your budget needs attention 💡',
    inactivityBody:
      "You haven't tracked for {{days}} days. You might be missing expenses — catch up now.",
  },
  ru: {
    weeklySummaryTitle: 'Итоги недели 📊',
    weeklySummaryBody:
      'Неделя заканчивается — загляни в аналитику и посмотри как прошла неделя.',
    monthlyRecapTitle: 'Месяц почти закончился 📆',
    monthlyRecapBody:
      'Открой аналитику и посмотри свои расходы за месяц до его окончания.',
    streakTitle: '{{days}} дней подряд 🔥',
    streakBody:
      'Ты отслеживаешь расходы {{days}} дней подряд. Не останавливайся!',
    inactivityTitle: 'Твой бюджет требует внимания 💡',
    inactivityBody:
      'Ты не фиксировал расходы {{days}} дней. Возможно, упустил некоторые траты.',
  },
};

const t = (
  lang: Lang,
  key: string,
  params?: Record<string, string | number>,
): string => {
  let str = STRINGS[lang][key] ?? STRINGS.en[key];
  if (params) {
    for (const [k, v] of Object.entries(params)) {
      str = str.replace(`{{${k}}}`, String(v));
    }
  }
  return str;
};

interface PendingPush {
  to: string;
  title: string;
  body: string;
  // titleKey/bodyKey/bodyParams mirror the client's own i18n keys (see
  // notification.service.ts) so the client can re-render this exact
  // notification in its in-app list (t(titleKey), t(bodyKey, bodyParams))
  // the same way it renders its own locally-sent ones, instead of needing a
  // second, plain-text-only rendering path just for server-sent pushes.
  data: {
    type: string;
    titleKey: string;
    bodyKey: string;
    bodyParams?: Record<string, string | number>;
  };
}

const sendExpoPushBatch = async (messages: PendingPush[]) => {
  if (messages.length === 0) return;
  // Expo caps a single push request at 100 messages.
  for (let i = 0; i < messages.length; i += 100) {
    const chunk = messages
      .slice(i, i + 100)
      .map((m) => ({ ...m, sound: 'default' }));
    try {
      await axios.post('https://exp.host/--/api/v2/push/send', chunk, {
        headers: { 'Content-Type': 'application/json' },
      });
    } catch (err) {
      // A batch failing shouldn't take down the whole dispatch run - the
      // next day's cooldown-gated run will just try again naturally for
      // anything still due.
      console.error('[NotificationDispatch] Expo push batch failed', err);
    }
  }
};

const isOnCooldown = (
  cooldowns: { type: string; lastSentAt: Date }[],
  type: string,
): boolean => {
  const entry = cooldowns.find((c) => c.type === type);
  if (!entry) return false;
  const hours = COOLDOWN_HOURS[type] ?? 24;
  return Date.now() - entry.lastSentAt.getTime() < hours * 3600 * 1000;
};

const toDateOnly = (d: Date): string => d.toISOString().slice(0, 10);

const getStreakAndLastTxDate = async (
  userId: string,
): Promise<{ lastTransactionDate: string | null; currentStreak: number }> => {
  const transactions = await transactionRepository.findMany({
    where: { userId },
    select: { date: true },
    orderBy: { date: 'desc' },
    take: 400, // a gap of even one day resets the streak, so this is generous
  });

  if (transactions.length === 0) {
    return { lastTransactionDate: null, currentStreak: 0 };
  }

  const distinctDates = Array.from(
    new Set(transactions.map((tx) => toDateOnly(tx.date))),
  ).sort((a, b) => (a < b ? 1 : -1));

  const today = toDateOnly(new Date());
  const yesterday = toDateOnly(new Date(Date.now() - 86400000));

  let currentStreak = 0;
  if (distinctDates[0] === today || distinctDates[0] === yesterday) {
    currentStreak = 1;
    for (let i = 0; i < distinctDates.length - 1; i++) {
      const diffDays = Math.round(
        (new Date(distinctDates[i]).getTime() -
          new Date(distinctDates[i + 1]).getTime()) /
          86400000,
      );
      if (diffDays === 1) currentStreak++;
      else break;
    }
  }

  return { lastTransactionDate: distinctDates[0], currentStreak };
};

const dispatchForUser = async (userId: string): Promise<PendingPush[]> => {
  const [user, tokens, cooldowns, { lastTransactionDate, currentStreak }] =
    await Promise.all([
      userRepository.findUnique({ where: { id: userId } }),
      pushTokenRepository.findMany({ where: { userId } }),
      notificationCooldownRepository.findAllForUser(userId),
      getStreakAndLastTxDate(userId),
    ]);

  if (!user || tokens.length === 0) return [];
  const lang: Lang = user.language === 'ru' ? 'ru' : 'en';
  const recipients = tokens.map((tk) => tk.token);
  const toSend: PendingPush[] = [];
  const cooldownsToRecord: string[] = [];

  const daysSinceTx = lastTransactionDate
    ? Math.floor(
        (Date.now() - new Date(lastTransactionDate).getTime()) / 86400000,
      )
    : null;

  if (
    STREAK_MILESTONES.includes(currentStreak) &&
    !isOnCooldown(cooldowns, 'streak')
  ) {
    for (const to of recipients) {
      toSend.push({
        to,
        title: t(lang, 'streakTitle', { days: currentStreak }),
        body: t(lang, 'streakBody', { days: currentStreak }),
        data: {
          type: 'streak',
          titleKey: 'notifications.streakTitle',
          bodyKey: 'notifications.streakBody',
          bodyParams: { days: currentStreak },
        },
      });
    }
    cooldownsToRecord.push('streak');
  }

  if (
    daysSinceTx !== null &&
    daysSinceTx >= 2 &&
    !isOnCooldown(cooldowns, 'inactivity')
  ) {
    for (const to of recipients) {
      toSend.push({
        to,
        title: t(lang, 'inactivityTitle'),
        body: t(lang, 'inactivityBody', { days: daysSinceTx }),
        data: {
          type: 'inactivity',
          titleKey: 'notifications.inactivityTitle',
          bodyKey: 'notifications.inactivityBody',
          bodyParams: { days: daysSinceTx },
        },
      });
    }
    cooldownsToRecord.push('inactivity');
  }

  const now = new Date();
  if (now.getUTCDay() === 0 && !isOnCooldown(cooldowns, 'weekly_summary')) {
    for (const to of recipients) {
      toSend.push({
        to,
        title: t(lang, 'weeklySummaryTitle'),
        body: t(lang, 'weeklySummaryBody'),
        data: {
          type: 'weekly_summary',
          titleKey: 'notifications.weeklySummaryTitle',
          bodyKey: 'notifications.weeklySummaryBody',
        },
      });
    }
    cooldownsToRecord.push('weekly_summary');
  }

  const lastDayOfMonth = new Date(
    now.getUTCFullYear(),
    now.getUTCMonth() + 1,
    0,
  ).getUTCDate();
  if (
    now.getUTCDate() >= lastDayOfMonth - 2 &&
    !isOnCooldown(cooldowns, 'monthly_recap')
  ) {
    for (const to of recipients) {
      toSend.push({
        to,
        title: t(lang, 'monthlyRecapTitle'),
        body: t(lang, 'monthlyRecapBody'),
        data: {
          type: 'monthly_recap',
          titleKey: 'notifications.monthlyRecapTitle',
          bodyKey: 'notifications.monthlyRecapBody',
        },
      });
    }
    cooldownsToRecord.push('monthly_recap');
  }

  await Promise.all(
    cooldownsToRecord.map((type) =>
      notificationCooldownRepository.record(userId, type, now),
    ),
  );

  return toSend;
};

const dispatchDue = async (): Promise<{
  usersConsidered: number;
  pushesSent: number;
}> => {
  const userIds = await pushTokenRepository.findDistinctUserIds();
  let pushesSent = 0;

  for (const userId of userIds) {
    try {
      const messages = await dispatchForUser(userId);
      await sendExpoPushBatch(messages);
      pushesSent += messages.length;
    } catch (err) {
      console.error(`[NotificationDispatch] Failed for user ${userId}`, err);
    }
  }

  return { usersConsidered: userIds.length, pushesSent };
};

export const notificationDispatchService = {
  dispatchDue,
  // Exported for testing - the date/streak math is the one piece here worth
  // covering directly rather than only through the full dispatch pipeline.
  getStreakAndLastTxDate,
};

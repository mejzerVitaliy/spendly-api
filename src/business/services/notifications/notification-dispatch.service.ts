import axios from 'axios';
import {
  transactionRepository,
  userRepository,
  pushTokenRepository,
  notificationCooldownRepository,
  notificationLogRepository,
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
  // 20h (not 24) so a reminder set close to midnight still fires reliably
  // the next day even if that day's dispatch run happens a little early -
  // see dispatchDueReminders.
  reminder: 20,
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
    dailyCheckinTitle: 'Track your day 💸',
    dailyCheckinBody:
      "You haven't logged any expenses today. Take 10 seconds to stay on top of your finances.",
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
    dailyCheckinTitle: 'Не забудь записать траты 💸',
    dailyCheckinBody:
      'Сегодня не было транзакций. Потрать 10 секунд, чтобы держать финансы под контролем.',
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
  // One log row per *type* dispatched to this user, not per device token -
  // see notificationLogRepository.create callers below.
  const logsToRecord: {
    type: string;
    titleKey: string;
    bodyKey: string;
    bodyParams?: Record<string, string | number>;
  }[] = [];

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
    logsToRecord.push({
      type: 'streak',
      titleKey: 'notifications.streakTitle',
      bodyKey: 'notifications.streakBody',
      bodyParams: { days: currentStreak },
    });
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
    logsToRecord.push({
      type: 'inactivity',
      titleKey: 'notifications.inactivityTitle',
      bodyKey: 'notifications.inactivityBody',
      bodyParams: { days: daysSinceTx },
    });
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
    logsToRecord.push({
      type: 'weekly_summary',
      titleKey: 'notifications.weeklySummaryTitle',
      bodyKey: 'notifications.weeklySummaryBody',
    });
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
    logsToRecord.push({
      type: 'monthly_recap',
      titleKey: 'notifications.monthlyRecapTitle',
      bodyKey: 'notifications.monthlyRecapBody',
    });
  }

  await Promise.all([
    ...cooldownsToRecord.map((type) =>
      notificationCooldownRepository.record(userId, type, now),
    ),
    ...logsToRecord.map((log) =>
      notificationLogRepository.create(
        userId,
        log.type,
        log.titleKey,
        log.bodyKey,
        log.bodyParams,
      ),
    ),
  ]);

  return toSend;
};

// Separate cadence from dispatchDue (streak/inactivity/weekly/monthly, run
// once/day): a per-user chosen time of day needs much finer granularity to
// catch, so this runs on its own, more frequent Scheduler job (see
// /cron/reminders) against a plain time-of-day comparison instead of an
// exact-minute match - robust to a run landing a few minutes late, or even
// a whole run failing outright, since the next one just checks again. The
// cooldown is what actually prevents a duplicate once the day's reminder
// has gone out.
const isReminderTimeReached = (
  hourUtc: number,
  minuteUtc: number,
  now: Date,
): boolean => {
  const targetMinuteOfDay = hourUtc * 60 + minuteUtc;
  const nowMinuteOfDay = now.getUTCHours() * 60 + now.getUTCMinutes();
  return nowMinuteOfDay >= targetMinuteOfDay;
};

const dispatchReminderForUser = async (
  user: { id: string; language: string | null },
  hourUtc: number,
  minuteUtc: number,
  now: Date,
): Promise<PendingPush[]> => {
  if (!isReminderTimeReached(hourUtc, minuteUtc, now)) return [];

  // Sequential, cheapest-first, rather than Promise.all-ing everything:
  // once a user's time has passed for the day, every run for the rest of
  // that day re-enters this function (isReminderTimeReached stays true),
  // and the cooldown check alone is what rejects nearly all of those - so
  // it goes first, before paying for a token lookup or (worse)
  // getStreakAndLastTxDate's up-to-400-row transaction scan.
  const cooldowns = await notificationCooldownRepository.findAllForUser(
    user.id,
  );
  if (isOnCooldown(cooldowns, 'reminder')) return [];

  const tokens = await pushTokenRepository.findMany({
    where: { userId: user.id },
  });
  if (tokens.length === 0) return [];

  const { lastTransactionDate } = await getStreakAndLastTxDate(user.id);
  // Already logged something today - the whole point of the reminder is to
  // catch someone who forgot, not to nag someone who already tracked. No
  // cooldown write here: this isn't "sent", so tomorrow's check should run
  // fresh rather than being blocked by a 20h window that didn't actually
  // send anything.
  if (lastTransactionDate === toDateOnly(now)) return [];

  const lang: Lang = user.language === 'ru' ? 'ru' : 'en';
  const toSend: PendingPush[] = tokens.map((tk) => ({
    to: tk.token,
    title: t(lang, 'dailyCheckinTitle'),
    body: t(lang, 'dailyCheckinBody'),
    data: {
      type: 'daily_checkin',
      titleKey: 'notifications.dailyCheckinTitle',
      bodyKey: 'notifications.dailyCheckinBody',
    },
  }));

  await Promise.all([
    notificationCooldownRepository.record(user.id, 'reminder', now),
    notificationLogRepository.create(
      user.id,
      'daily_checkin',
      'notifications.dailyCheckinTitle',
      'notifications.dailyCheckinBody',
    ),
  ]);

  return toSend;
};

const dispatchDueReminders = async (): Promise<{
  usersConsidered: number;
  pushesSent: number;
}> => {
  const now = new Date();
  const users = await userRepository.findMany({
    where: {
      reminderEnabled: true,
      reminderHourUtc: { not: null },
      reminderMinuteUtc: { not: null },
    },
    select: {
      id: true,
      language: true,
      reminderHourUtc: true,
      reminderMinuteUtc: true,
    },
  });

  let pushesSent = 0;

  for (const user of users) {
    try {
      const messages = await dispatchReminderForUser(
        user,
        user.reminderHourUtc as number,
        user.reminderMinuteUtc as number,
        now,
      );
      await sendExpoPushBatch(messages);
      pushesSent += messages.length;
    } catch (err) {
      console.error(
        `[NotificationDispatch] Reminder failed for user ${user.id}`,
        err,
      );
    }
  }

  return { usersConsidered: users.length, pushesSent };
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
  dispatchDueReminders,
  // Exported for testing - the date/streak math is the one piece here worth
  // covering directly rather than only through the full dispatch pipeline.
  getStreakAndLastTxDate,
  isReminderTimeReached,
};

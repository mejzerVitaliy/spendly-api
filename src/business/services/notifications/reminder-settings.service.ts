import { userRepository } from '@/database/repositories';
import { NotFoundError } from '@/business/lib/errors';

interface ReminderSettings {
  enabled: boolean;
  hourUtc: number | null;
  minuteUtc: number | null;
}

const get = async (userId: string): Promise<ReminderSettings> => {
  const user = await userRepository.findUnique({ where: { id: userId } });
  if (!user) throw NotFoundError('User not found');

  return {
    enabled: user.reminderEnabled,
    hourUtc: user.reminderHourUtc,
    minuteUtc: user.reminderMinuteUtc,
  };
};

const update = async (
  userId: string,
  settings: { enabled: boolean; hourUtc: number; minuteUtc: number },
): Promise<ReminderSettings> => {
  const user = await userRepository.update({
    where: { id: userId },
    data: {
      reminderEnabled: settings.enabled,
      reminderHourUtc: settings.hourUtc,
      reminderMinuteUtc: settings.minuteUtc,
    },
  });

  return {
    enabled: user.reminderEnabled,
    hourUtc: user.reminderHourUtc,
    minuteUtc: user.reminderMinuteUtc,
  };
};

export const reminderSettingsService = {
  get,
  update,
};

import { relativeTime } from '@app-fit/shared/social';
import { onlineManager } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { Alert } from 'react-native';

import { formatShortDate } from '@/lib/dates';
import { classifyError } from '@/lib/errors';
import { useErrorMessage } from '@/lib/use-error-message';

/** "Ahora", "hace 5 min", "hace 2 h", "hace 3 d", then "4 nov". */
export function useTimeAgo() {
  const { t } = useTranslation();
  return (iso: string, now = new Date()) => {
    const at = new Date(iso);
    const time = relativeTime(at, now);
    switch (time.unit) {
      case 'now':
        return t('feed.justNow');
      case 'minutes':
        return t('feed.minutesAgo', { count: time.count });
      case 'hours':
        return t('feed.hoursAgo', { count: time.count });
      case 'days':
        return t('feed.daysAgo', { count: time.count });
      case 'date':
        return formatShortDate(at, now);
    }
  };
}

/** Shows why a social action failed: no connection, or the server's message. */
export function useSocialErrorAlert() {
  const { t } = useTranslation();
  const getErrorMessage = useErrorMessage();
  return (error: unknown) =>
    Alert.alert(
      t('social.actionFailed'),
      classifyError(error, onlineManager.isOnline()) === 'offline'
        ? t('social.offline')
        : getErrorMessage(error),
    );
}

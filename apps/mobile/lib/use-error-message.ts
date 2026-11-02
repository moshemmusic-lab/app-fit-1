import { onlineManager } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';

import { classifyError } from './errors';

/** Returns a function that turns any error into a short message for the user. */
export function useErrorMessage(): (error: unknown) => string {
  const { t } = useTranslation();

  return (error) => {
    switch (classifyError(error, onlineManager.isOnline())) {
      case 'offline':
        return t('common.offline');
      case 'rateLimited':
        return t('auth.errors.tooManyRequests');
      case 'codeRejected':
        return t('auth.errors.codeRejected');
      case 'usernameTaken':
        return t('validation.usernameTaken');
      case 'unknown':
        return t('common.genericError');
    }
  };
}

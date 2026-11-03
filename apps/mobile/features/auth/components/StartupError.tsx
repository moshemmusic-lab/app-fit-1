import { useTranslation } from 'react-i18next';

import { Wordmark } from '@/components/Wordmark';
import { Button } from '@/components/ui/Button';
import { Screen } from '@/components/ui/Screen';
import { ErrorState } from '@/components/ui/StateViews';
import { useErrorMessage } from '@/lib/use-error-message';

import { signOut } from '../api';

interface StartupErrorProps {
  error: unknown;
  onRetry: () => void;
  retrying: boolean;
}

/**
 * Signed in, but the account could not be loaded and nothing is saved on the phone yet
 * (first launch without connection, or a server error). Signing out is the way out
 * if the account no longer exists.
 */
export function StartupError({ error, onRetry, retrying }: StartupErrorProps) {
  const { t } = useTranslation();
  const getErrorMessage = useErrorMessage();

  return (
    <Screen
      withBottomInset
      header={<Wordmark />}
      footer={
        <Button label={t('settings.signOut')} variant="ghost" onPress={() => void signOut()} />
      }
    >
      <ErrorState message={getErrorMessage(error)} onRetry={onRetry} retrying={retrying} />
    </Screen>
  );
}

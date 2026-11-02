import { weightUnits, workoutVisibilities } from '@app-fit/shared/schemas';
import { useMutation } from '@tanstack/react-query';
import { router } from 'expo-router';
import { LogOut, Trash2 } from 'lucide-react-native';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert } from 'react-native';

import { Button } from '@/components/ui/Button';
import { ChipGroup } from '@/components/ui/ChipGroup';
import { FormMessage } from '@/components/ui/FormMessage';
import { Screen } from '@/components/ui/Screen';
import { ErrorState, LoadingState } from '@/components/ui/StateViews';
import { SwitchRow } from '@/components/ui/SwitchRow';
import { Text } from '@/components/ui/Text';
import { useSettings, useUpdateSettings, type SettingsPatch } from '@/features/account/api';
import { deleteAccount, signOut } from '@/features/auth/api';
import { useSession, useUserId } from '@/features/auth/session';
import { SettingsSection } from '@/features/settings/components/SettingsSection';
import { ThemePreferencePicker } from '@/features/settings/components/ThemePreferencePicker';
import { useErrorMessage } from '@/lib/use-error-message';

export default function SettingsScreen() {
  const { t } = useTranslation();
  const getErrorMessage = useErrorMessage();
  const { session } = useSession();
  const userId = useUserId();
  const settings = useSettings(userId);
  const updateSettings = useUpdateSettings(userId);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [accountError, setAccountError] = useState<string | null>(null);

  const save = (patch: SettingsPatch) => {
    setSaveError(null);
    updateSettings.mutate(patch, {
      onError: (error) => setSaveError(`${t('settings.saveFailed')} ${getErrorMessage(error)}`),
    });
  };

  // After either action the session ends and the navigation guard shows the sign-in screen.
  const signOutMutation = useMutation({
    mutationFn: signOut,
    onError: (error) => setAccountError(getErrorMessage(error)),
  });
  const deleteMutation = useMutation({
    mutationFn: deleteAccount,
    onError: () => setAccountError(t('settings.deleteFailed')),
  });

  const confirmDelete = () => {
    Alert.alert(t('settings.deleteConfirmTitle'), t('settings.deleteConfirmBody'), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('settings.deleteAccount'),
        style: 'destructive',
        onPress: () => {
          setAccountError(null);
          deleteMutation.mutate();
        },
      },
    ]);
  };

  return (
    <Screen withBottomInset onBack={() => router.back()} title={t('settings.title')}>
      {settings.data ? (
        <>
          {saveError ? <FormMessage message={saveError} /> : null}

          <SettingsSection title={t('settings.unitsTitle')}>
            <ChipGroup
              accessibilityLabel={t('settings.unitsTitle')}
              options={weightUnits.map((unit) => ({
                value: unit,
                label: t(`settings.units.${unit}`),
              }))}
              value={settings.data.units}
              onChange={(units) => save({ units })}
            />
          </SettingsSection>

          <SettingsSection
            title={t('settings.visibilityTitle')}
            hint={t('settings.visibilityHint')}
          >
            <ChipGroup
              accessibilityLabel={t('settings.visibilityTitle')}
              options={workoutVisibilities.map((visibility) => ({
                value: visibility,
                label: t(`settings.visibility.${visibility}`),
              }))}
              value={settings.data.defaultWorkoutVisibility}
              onChange={(defaultWorkoutVisibility) => save({ defaultWorkoutVisibility })}
            />
          </SettingsSection>

          <SettingsSection title={t('settings.notificationsTitle')}>
            <SwitchRow
              label={t('settings.notifySocial')}
              hint={t('settings.notifySocialHint')}
              value={settings.data.notifySocial}
              onValueChange={(notifySocial) => save({ notifySocial })}
            />
            <SwitchRow
              label={t('settings.notifyReminders')}
              hint={t('settings.notifyRemindersHint')}
              value={settings.data.notifyReminders}
              onValueChange={(notifyReminders) => save({ notifyReminders })}
            />
          </SettingsSection>
        </>
      ) : settings.isError ? (
        <ErrorState
          message={getErrorMessage(settings.error)}
          onRetry={() => void settings.refetch()}
          retrying={settings.isFetching}
        />
      ) : (
        <LoadingState />
      )}

      {/* Appearance and account work even if the settings could not load. */}
      <SettingsSection title={t('settings.appearanceTitle')} hint={t('settings.appearanceHint')}>
        <ThemePreferencePicker />
      </SettingsSection>

      <SettingsSection title={t('settings.accountTitle')}>
        {session?.user.email ? (
          <Text variant="caption" color="textMuted">
            {t('settings.signedInAs', { email: session.user.email })}
          </Text>
        ) : null}
        <Button
          label={t('settings.signOut')}
          variant="secondary"
          icon={LogOut}
          loading={signOutMutation.isPending}
          disabled={deleteMutation.isPending}
          onPress={() => {
            setAccountError(null);
            signOutMutation.mutate();
          }}
        />
        <Button
          label={t('settings.deleteAccount')}
          variant="ghost"
          icon={Trash2}
          loading={deleteMutation.isPending}
          disabled={signOutMutation.isPending}
          onPress={confirmDelete}
        />
        {accountError ? <FormMessage message={accountError} /> : null}
      </SettingsSection>
    </Screen>
  );
}

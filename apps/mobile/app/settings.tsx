import { csvColumns } from '@app-fit/shared/export';
import { weightUnits, workoutVisibilities } from '@app-fit/shared/schemas';
import { useMutation } from '@tanstack/react-query';
import { router } from 'expo-router';
import { Ban, Download, FileJson, FileSpreadsheet, LogOut, Trash2 } from 'lucide-react-native';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert } from 'react-native';

import { Button } from '@/components/ui/Button';
import { ChipGroup } from '@/components/ui/ChipGroup';
import { FormMessage } from '@/components/ui/FormMessage';
import { OptionsSheet, type OptionsSheetConfig } from '@/components/ui/OptionsSheet';
import { Screen } from '@/components/ui/Screen';
import { ErrorState, LoadingState } from '@/components/ui/StateViews';
import { SwitchRow } from '@/components/ui/SwitchRow';
import { Text } from '@/components/ui/Text';
import { useSettings, useUpdateSettings, type SettingsPatch } from '@/features/account/api';
import { exportMyData, type ExportFormat } from '@/features/account/export';
import { deleteAccount, signOut } from '@/features/auth/api';
import { useSession, useUserId } from '@/features/auth/session';
import { SettingsSection } from '@/features/settings/components/SettingsSection';
import { ThemePreferencePicker } from '@/features/settings/components/ThemePreferencePicker';
import { usePendingWorkouts, useWorkoutStore } from '@/features/workouts/workout-store';
import { formatFileDate } from '@/lib/dates';
import { useErrorMessage } from '@/lib/use-error-message';

export default function SettingsScreen() {
  const { t } = useTranslation();
  const getErrorMessage = useErrorMessage();
  const { session } = useSession();
  const userId = useUserId();
  const settings = useSettings(userId);
  const updateSettings = useUpdateSettings(userId);
  const pendingWorkouts = usePendingWorkouts(userId);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [accountError, setAccountError] = useState<string | null>(null);
  const [sheet, setSheet] = useState<OptionsSheetConfig | null>(null);

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
    // The account no longer exists: nothing of it may stay on the phone.
    onSuccess: () => useWorkoutStore.getState().clearUser(userId),
    onError: () => setAccountError(t('settings.deleteFailed')),
  });

  // Unsent workouts stay on the phone (scoped to this account) and upload on the next sign-in.
  const confirmSignOut = () => {
    setAccountError(null);
    if (pendingWorkouts.length === 0) {
      signOutMutation.mutate();
      return;
    }
    Alert.alert(t('settings.signOutPendingTitle'), t('settings.signOutPendingBody'), [
      { text: t('common.cancel'), style: 'cancel' },
      { text: t('settings.signOut'), onPress: () => signOutMutation.mutate() },
    ]);
  };

  const exportMutation = useMutation({
    mutationFn: (format: ExportFormat) => {
      const date = formatFileDate(new Date());
      return exportMyData({
        format,
        fileName:
          format === 'json'
            ? t('settings.exportFileJson', { date })
            : t('settings.exportFileCsv', { date }),
        csvLabels: {
          columns: Object.fromEntries(
            csvColumns.map((column) => [column, t(`settings.csvColumns.${column}`)]),
          ) as Record<(typeof csvColumns)[number], string>,
          setTypes: {
            warmup: t('activeWorkout.setTypes.warmup'),
            normal: t('activeWorkout.setTypes.normal'),
            drop: t('activeWorkout.setTypes.drop'),
            failure: t('activeWorkout.setTypes.failure'),
          },
        },
        dialogTitle: t('settings.exportData'),
      });
    },
    onError: (error) => setAccountError(`${t('settings.exportFailed')} ${getErrorMessage(error)}`),
  });

  // The file comes from the server: workouts still waiting to upload are not in it yet.
  const startExport = (format: ExportFormat) => {
    setAccountError(null);
    if (pendingWorkouts.length === 0) {
      exportMutation.mutate(format);
      return;
    }
    Alert.alert(t('settings.exportPendingTitle'), t('settings.exportPendingBody'), [
      { text: t('common.cancel'), style: 'cancel' },
      { text: t('settings.exportAnyway'), onPress: () => exportMutation.mutate(format) },
    ]);
  };

  const chooseExport = () =>
    setSheet({
      title: t('settings.exportSheetTitle'),
      options: [
        { label: t('settings.exportJson'), icon: FileJson, onPress: () => startExport('json') },
        {
          label: t('settings.exportCsv'),
          icon: FileSpreadsheet,
          onPress: () => startExport('csv'),
        },
      ],
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
            <Button
              label={t('settings.blockedUsers')}
              variant="ghost"
              align="start"
              icon={Ban}
              onPress={() => router.push('/blocked-users')}
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
      ) : settings.isError || settings.fetchStatus === 'paused' ? (
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
          label={t('settings.exportData')}
          variant="secondary"
          icon={Download}
          loading={exportMutation.isPending}
          disabled={signOutMutation.isPending || deleteMutation.isPending}
          onPress={chooseExport}
        />
        <Button
          label={t('settings.signOut')}
          variant="secondary"
          icon={LogOut}
          loading={signOutMutation.isPending}
          disabled={deleteMutation.isPending}
          onPress={confirmSignOut}
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

      <OptionsSheet config={sheet} onClose={() => setSheet(null)} />
    </Screen>
  );
}

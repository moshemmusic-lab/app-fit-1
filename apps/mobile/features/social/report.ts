import { reportReasons, type ReportTarget } from '@app-fit/shared/social';
import { useTranslation } from 'react-i18next';
import { Alert } from 'react-native';

import type { OptionsSheetConfig } from '@/components/ui/OptionsSheet';
import { useUserId } from '@/features/auth/session';

import { useBlock, useReport } from './api';
import { useSocialErrorAlert } from './format';

interface Person {
  id: string;
  displayName: string;
}

/** Asks before blocking someone; `onBlocked` runs once it is done (e.g. to leave the screen). */
export function useConfirmBlock() {
  const { t } = useTranslation();
  const block = useBlock(useUserId());
  const showError = useSocialErrorAlert();

  return (person: Person, onBlocked?: () => void) =>
    Alert.alert(t('social.blockTitle', { name: person.displayName }), t('social.blockBody'), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('social.block'),
        style: 'destructive',
        onPress: () => block.mutate(person.id, { onSuccess: onBlocked, onError: showError }),
      },
    ]);
}

/**
 * The report sheet: pick a reason, send it, then offer to block the person too. Returns the
 * sheet to show (the screen owns the OptionsSheet).
 */
export function useReportSheet() {
  const { t } = useTranslation();
  const report = useReport(useUserId());
  const confirmBlock = useConfirmBlock();
  const showError = useSocialErrorAlert();

  return (
    target: ReportTarget,
    targetId: string,
    owner: Person,
    onBlocked?: () => void,
  ): OptionsSheetConfig => ({
    title: t('report.title'),
    options: reportReasons.map((reason) => ({
      label: t(`report.reasons.${reason}`),
      onPress: () =>
        report.mutate(
          { target, targetId, reason },
          {
            onError: showError,
            onSuccess: () =>
              Alert.alert(t('report.thanksTitle'), t('report.thanksBody'), [
                { text: t('common.ok'), style: 'cancel' },
                {
                  text: t('social.block'),
                  style: 'destructive',
                  onPress: () => confirmBlock(owner, onBlocked),
                },
              ]),
          },
        ),
    })),
  });
}

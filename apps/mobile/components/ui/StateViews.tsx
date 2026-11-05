import { CloudOff } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, View } from 'react-native';

import { Button } from '@/components/ui/Button';
import { Text } from '@/components/ui/Text';
import { useTheme } from '@/theme/ThemeProvider';

export function LoadingState() {
  const { t } = useTranslation();
  const { colors, spacing } = useTheme();

  return (
    <View
      accessibilityLabel={t('common.loading')}
      style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing[6] }}
    >
      <ActivityIndicator color={colors.textMuted} />
    </View>
  );
}

interface ErrorStateProps {
  message: string;
  onRetry: () => void;
  retrying?: boolean;
}

/** Shown when a screen could not load its data, including when the phone is offline. */
export function ErrorState({ message, onRetry, retrying = false }: ErrorStateProps) {
  const { t } = useTranslation();
  const { colors, radius, sizes, spacing } = useTheme();

  return (
    <View
      style={{
        padding: spacing[4],
        gap: spacing[3],
        borderRadius: radius.md,
        backgroundColor: colors.surface,
        alignItems: 'flex-start',
      }}
    >
      <CloudOff size={sizes.icon} strokeWidth={1.8} color={colors.textMuted} />
      <Text variant="body">{message}</Text>
      <Button label={t('common.retry')} variant="secondary" loading={retrying} onPress={onRetry} />
    </View>
  );
}

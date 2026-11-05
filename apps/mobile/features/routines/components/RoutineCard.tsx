import { MoreHorizontal, Play } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { Button } from '@/components/ui/Button';
import { IconButton } from '@/components/ui/IconButton';
import { Text } from '@/components/ui/Text';
import { useTheme } from '@/theme/ThemeProvider';

const SHOWN_EXERCISES = 3;

interface RoutineCardProps {
  name: string;
  /** Names of its exercises, in order. */
  exerciseNames: readonly string[];
  onStart: () => void;
  onOptions: () => void;
}

export function RoutineCard({ name, exerciseNames, onStart, onOptions }: RoutineCardProps) {
  const { t } = useTranslation();
  const { colors, radius, spacing } = useTheme();
  const hidden = exerciseNames.length - SHOWN_EXERCISES;
  const summary =
    exerciseNames.slice(0, SHOWN_EXERCISES).join(', ') +
    (hidden > 0 ? ` ${t('routines.moreExercises', { count: hidden })}` : '');

  return (
    <View
      style={{
        padding: spacing[4],
        gap: spacing[3],
        borderRadius: radius.md,
        backgroundColor: colors.surface,
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: spacing[2] }}>
        <View style={{ flex: 1, gap: spacing[1] }}>
          <Text variant="bodyStrong">{name}</Text>
          <Text variant="caption" color="textMuted" numberOfLines={2}>
            {exerciseNames.length > 0 ? summary : t('routines.exerciseCount', { count: 0 })}
          </Text>
        </View>
        <IconButton icon={MoreHorizontal} label={t('routines.options')} onPress={onOptions} />
      </View>
      {/* Lime: starting a routine is the main thing to do here ("Empezar entreno vacío" is a row). */}
      <Button
        label={t('routines.start')}
        accessibilityLabel={t('routines.startLabel', { name })}
        icon={Play}
        onPress={onStart}
      />
    </View>
  );
}

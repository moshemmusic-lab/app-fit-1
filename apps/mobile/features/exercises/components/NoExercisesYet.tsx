import { Dumbbell, Plus } from 'lucide-react-native';
import { View } from 'react-native';

import { Button } from '@/components/ui/Button';
import { Text } from '@/components/ui/Text';
import { useTheme } from '@/theme/ThemeProvider';

interface NoExercisesYetProps {
  message: string;
  actionLabel: string;
  onAdd: () => void;
}

/** A routine or workout with no exercises: one line and a big button to add the first one. */
export function NoExercisesYet({ message, actionLabel, onAdd }: NoExercisesYetProps) {
  const { colors, sizes, spacing } = useTheme();

  return (
    <View style={{ alignItems: 'center', gap: spacing[4], paddingVertical: spacing[6] }}>
      <Dumbbell size={sizes.icon * 2} strokeWidth={1.5} color={colors.textMuted} />
      <Text color="textMuted" style={{ textAlign: 'center' }}>
        {message}
      </Text>
      <View style={{ alignSelf: 'stretch' }}>
        <Button label={actionLabel} icon={Plus} onPress={onAdd} />
      </View>
    </View>
  );
}

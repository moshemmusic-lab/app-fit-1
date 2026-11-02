import { CircleAlert, CircleCheck } from 'lucide-react-native';
import { View } from 'react-native';

import { Text } from '@/components/ui/Text';
import { useTheme } from '@/theme/ThemeProvider';

interface FormMessageProps {
  message: string;
  tone?: 'error' | 'success';
}

/**
 * Inline feedback under a field or a form. The design system has no error color,
 * so the state is carried by the icon and the text (never by color alone).
 */
export function FormMessage({ message, tone = 'error' }: FormMessageProps) {
  const { colors, spacing } = useTheme();
  const Icon = tone === 'error' ? CircleAlert : CircleCheck;

  return (
    <View
      accessibilityLiveRegion="polite"
      accessibilityRole={tone === 'error' ? 'alert' : 'text'}
      style={{ flexDirection: 'row', alignItems: 'flex-start', gap: spacing[2] }}
    >
      <Icon
        size={16}
        strokeWidth={1.8}
        color={tone === 'error' ? colors.text : colors.accentText}
        style={{ marginTop: 1 }}
      />
      <Text variant="caption" style={{ flex: 1 }}>
        {message}
      </Text>
    </View>
  );
}

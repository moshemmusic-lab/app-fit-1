import { Lock, ShieldCheck, Trash2, type LucideIcon } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { Checkbox } from '@/components/ui/Checkbox';
import { Text } from '@/components/ui/Text';
import { useTheme } from '@/theme/ThemeProvider';

interface ConsentStepProps {
  consent: boolean;
  onChange: (consent: boolean) => void;
}

const points = [
  { icon: ShieldCheck, key: 'onboarding.consentPoints.storage' },
  { icon: Lock, key: 'onboarding.consentPoints.control' },
  { icon: Trash2, key: 'onboarding.consentPoints.withdraw' },
] as const satisfies readonly { icon: LucideIcon; key: string }[];

/** Explicit consent for health data (GDPR art. 9). The box always starts unchecked. */
export function ConsentStep({ consent, onChange }: ConsentStepProps) {
  const { t } = useTranslation();
  const { colors, radius, sizes, spacing } = useTheme();

  return (
    <View style={{ gap: spacing[6] }}>
      <Text variant="body" color="textMuted">
        {t('onboarding.consentBody')}
      </Text>
      <View
        style={{
          padding: spacing[4],
          gap: spacing[3],
          borderRadius: radius.md,
          backgroundColor: colors.surface,
        }}
      >
        {points.map(({ icon: Icon, key }) => (
          <View key={key} style={{ flexDirection: 'row', gap: spacing[3] }}>
            <Icon size={sizes.icon} strokeWidth={1.8} color={colors.accentText} />
            <Text variant="body" style={{ flex: 1 }}>
              {t(key)}
            </Text>
          </View>
        ))}
      </View>
      <Checkbox label={t('onboarding.consentCheckbox')} checked={consent} onChange={onChange} />
    </View>
  );
}

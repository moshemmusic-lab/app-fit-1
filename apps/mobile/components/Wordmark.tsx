import { useTranslation } from 'react-i18next';
import { Text as NativeText } from 'react-native';

import { fontNameFor } from '@/theme/font-names';
import { useTheme } from '@/theme/ThemeProvider';

/** Text-only logo: MOVYN in Barlow Condensed 700, followed by an accent dot (docs/DESIGN.md). */
export function Wordmark() {
  const { t } = useTranslation();
  const { colors, typography } = useTheme();
  const { fontSize, lineHeight } = typography.screenTitle;

  return (
    <NativeText
      accessibilityRole="header"
      style={{
        color: colors.text,
        fontFamily: fontNameFor('display', 700),
        fontSize,
        lineHeight,
        letterSpacing: fontSize * 0.04,
        textTransform: 'uppercase',
      }}
    >
      {t('app.name')}
      <NativeText style={{ color: colors.accentText }}>.</NativeText>
    </NativeText>
  );
}

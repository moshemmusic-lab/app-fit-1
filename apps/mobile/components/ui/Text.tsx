import type { TextColorToken, TypographyVariant } from '@app-fit/shared/theme';
import { Text as NativeText, type TextProps as NativeTextProps } from 'react-native';

import { fontNameForVariant } from '@/theme/font-names';
import { useTheme } from '@/theme/ThemeProvider';

export interface TextProps extends NativeTextProps {
  variant?: TypographyVariant;
  /** Only text-safe colors: `lime` is a fill color and cannot be used here. */
  color?: TextColorToken;
}

export function Text({ variant = 'body', color = 'text', style, ...props }: TextProps) {
  const { colors, typography } = useTheme();
  const variantStyle = typography[variant];
  const letterSpacing = 'letterSpacing' in variantStyle ? variantStyle.letterSpacing : undefined;
  const textTransform = 'textTransform' in variantStyle ? variantStyle.textTransform : undefined;

  return (
    <NativeText
      style={[
        {
          color: colors[color],
          fontFamily: fontNameForVariant(variant),
          fontSize: variantStyle.fontSize,
          lineHeight: variantStyle.lineHeight,
          letterSpacing,
          textTransform,
        },
        style,
      ]}
      {...props}
    />
  );
}

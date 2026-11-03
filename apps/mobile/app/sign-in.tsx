import { emailSchema, validationErrorOf } from '@app-fit/shared/schemas';
import { onlineManager, useMutation } from '@tanstack/react-query';
import { router } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { Wordmark } from '@/components/Wordmark';
import { Button } from '@/components/ui/Button';
import { FormMessage } from '@/components/ui/FormMessage';
import { Screen } from '@/components/ui/Screen';
import { Text } from '@/components/ui/Text';
import { TextField } from '@/components/ui/TextField';
import { sendSignInCode, signInWithApple, SignInCanceledError } from '@/features/auth/api';
import { AppleSignInButton } from '@/features/auth/components/AppleSignInButton';
import { classifyError } from '@/lib/errors';
import { useErrorMessage } from '@/lib/use-error-message';
import { useTheme } from '@/theme/ThemeProvider';

export default function SignInScreen() {
  const { t } = useTranslation();
  const { colors, spacing } = useTheme();
  const getErrorMessage = useErrorMessage();
  const [email, setEmail] = useState('');
  const [showFieldError, setShowFieldError] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const emailError = validationErrorOf(emailSchema, email);

  const sendCode = useMutation({
    mutationFn: sendSignInCode,
    onSuccess: (_result, normalizedEmail) => {
      router.push({ pathname: '/verify-code', params: { email: normalizedEmail } });
    },
    onError: (error) => setFormError(getErrorMessage(error)),
  });

  const apple = useMutation({
    mutationFn: signInWithApple,
    onError: (error) => {
      if (error instanceof SignInCanceledError) return;
      const isOffline = classifyError(error, onlineManager.isOnline()) === 'offline';
      setFormError(isOffline ? t('common.offline') : t('auth.errors.appleFailed'));
    },
  });

  const handleSendCode = () => {
    setShowFieldError(true);
    setFormError(null);
    if (emailError) return;
    sendCode.mutate(emailSchema.parse(email));
  };

  return (
    <Screen withBottomInset header={<Wordmark />}>
      <Text variant="displayL">{t('auth.tagline')}</Text>

      <View style={{ gap: spacing[3] }}>
        <TextField
          label={t('auth.emailLabel')}
          placeholder={t('auth.emailPlaceholder')}
          value={email}
          onChangeText={setEmail}
          error={showFieldError && emailError ? t(`validation.${emailError}`) : null}
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
          autoComplete="email"
          textContentType="emailAddress"
          returnKeyType="send"
          onSubmitEditing={handleSendCode}
        />
        <Button
          label={t('auth.sendCode')}
          loading={sendCode.isPending}
          disabled={apple.isPending}
          onPress={handleSendCode}
        />
      </View>

      <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing[3] }}>
        <View style={{ flex: 1, height: 1, backgroundColor: colors.line }} />
        <Text variant="caption" color="textMuted">
          {t('auth.divider')}
        </Text>
        <View style={{ flex: 1, height: 1, backgroundColor: colors.line }} />
      </View>

      <AppleSignInButton
        onPress={() => {
          setFormError(null);
          apple.mutate();
        }}
      />

      {formError ? <FormMessage message={formError} /> : null}
    </Screen>
  );
}

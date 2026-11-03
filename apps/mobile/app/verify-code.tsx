import { accountLimits, signInCodeSchema, validationErrorOf } from '@app-fit/shared/schemas';
import { useMutation } from '@tanstack/react-query';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { Button } from '@/components/ui/Button';
import { FormMessage } from '@/components/ui/FormMessage';
import { Screen } from '@/components/ui/Screen';
import { Text } from '@/components/ui/Text';
import { TextField } from '@/components/ui/TextField';
import { sendSignInCode, verifySignInCode } from '@/features/auth/api';
import { useErrorMessage } from '@/lib/use-error-message';
import { useTheme } from '@/theme/ThemeProvider';

// Supabase allows a new email every 60 s on hosted projects.
const RESEND_COOLDOWN_S = 60;

export default function VerifyCodeScreen() {
  const { t } = useTranslation();
  const { spacing } = useTheme();
  const getErrorMessage = useErrorMessage();
  const { email = '' } = useLocalSearchParams<{ email: string }>();
  const [code, setCode] = useState('');
  const [message, setMessage] = useState<{ text: string; tone: 'error' | 'success' } | null>(null);
  const [cooldown, setCooldown] = useState(RESEND_COOLDOWN_S);

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setTimeout(() => setCooldown(cooldown - 1), 1000);
    return () => clearTimeout(timer);
  }, [cooldown]);

  // On success the session changes and the navigation guard opens onboarding or the app
  // once the account has loaded; the button keeps spinning until then.
  const verify = useMutation({
    mutationFn: (value: string) => verifySignInCode(email, value),
    onError: (error) => {
      setCode('');
      setMessage({ text: getErrorMessage(error), tone: 'error' });
    },
  });

  const resend = useMutation({
    mutationFn: () => sendSignInCode(email),
    onSuccess: () => {
      setCooldown(RESEND_COOLDOWN_S);
      setMessage({ text: t('auth.codeResent'), tone: 'success' });
    },
    onError: (error) => setMessage({ text: getErrorMessage(error), tone: 'error' }),
  });

  const submit = (value: string) => {
    if (validationErrorOf(signInCodeSchema, value) || verify.isPending) return;
    setMessage(null);
    verify.mutate(value);
  };

  const handleChange = (value: string) => {
    const digits = value.replace(/\D/g, '').slice(0, accountLimits.signInCodeLength);
    setCode(digits);
    // Submit as soon as the 6 digits are in (also when iOS autofills the code).
    if (digits.length === accountLimits.signInCodeLength) submit(digits);
  };

  return (
    <Screen
      withBottomInset
      onBack={() => router.back()}
      title={t('auth.codeTitle')}
      footer={
        <Button
          label={t('auth.signIn')}
          loading={verify.isPending || verify.isSuccess}
          disabled={code.length !== accountLimits.signInCodeLength}
          onPress={() => submit(code)}
        />
      }
    >
      <Text variant="body" color="textMuted">
        {t('auth.codeBody', { email })}
      </Text>

      <View style={{ gap: spacing[3] }}>
        <TextField
          label={t('auth.codeLabel')}
          value={code}
          onChangeText={handleChange}
          keyboardType="number-pad"
          textContentType="oneTimeCode"
          autoComplete="one-time-code"
          maxLength={accountLimits.signInCodeLength}
          autoFocus
        />
        {message ? <FormMessage message={message.text} tone={message.tone} /> : null}
      </View>

      <View style={{ alignItems: 'flex-start', gap: spacing[1] }}>
        <Button
          variant="ghost"
          label={cooldown > 0 ? t('auth.resendIn', { seconds: cooldown }) : t('auth.resendCode')}
          disabled={cooldown > 0}
          loading={resend.isPending}
          onPress={() => resend.mutate()}
        />
        <Button variant="ghost" label={t('auth.changeEmail')} onPress={() => router.back()} />
      </View>
    </Screen>
  );
}

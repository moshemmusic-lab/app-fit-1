import {
  accountLimits,
  displayNameSchema,
  experienceLevels,
  onboardingSchema,
  trainingGoals,
  usernameSchema,
  validationErrorOf,
  weightUnits,
} from '@app-fit/shared/schemas';
import { onlineManager } from '@tanstack/react-query';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { Button } from '@/components/ui/Button';
import { FormMessage } from '@/components/ui/FormMessage';
import { Screen } from '@/components/ui/Screen';
import { Text } from '@/components/ui/Text';
import { TextField } from '@/components/ui/TextField';
import { isUsernameAvailable, useCompleteOnboarding } from '@/features/account/api';
import { useUserId } from '@/features/auth/session';
import { ChoiceList } from '@/features/onboarding/components/ChoiceList';
import { ConsentStep } from '@/features/onboarding/components/ConsentStep';
import { OnboardingProgress } from '@/features/onboarding/components/OnboardingProgress';
import { useOnboardingDraftStore } from '@/features/onboarding/onboarding-draft-store';
import { isStepComplete, onboardingSteps, type OnboardingDraft } from '@/features/onboarding/steps';
import { classifyError } from '@/lib/errors';
import { useErrorMessage } from '@/lib/use-error-message';
import { useTheme } from '@/theme/ThemeProvider';

const titleKeys = {
  profile: 'onboarding.profileTitle',
  goal: 'onboarding.goalTitle',
  level: 'onboarding.levelTitle',
  units: 'onboarding.unitsTitle',
  consent: 'onboarding.consentTitle',
} as const;

export default function OnboardingScreen() {
  const { t } = useTranslation();
  const { spacing } = useTheme();
  const userId = useUserId();
  const getErrorMessage = useErrorMessage();
  const suggestedDisplayName = useOnboardingDraftStore((state) => state.suggestedDisplayName);
  const completeOnboarding = useCompleteOnboarding(userId);

  const [stepIndex, setStepIndex] = useState(0);
  const [draft, setDraft] = useState<OnboardingDraft>({
    username: '',
    displayName: suggestedDisplayName,
    trainingGoal: null,
    experienceLevel: null,
    units: 'kg',
    healthDataConsent: false,
  });
  const [showFieldErrors, setShowFieldErrors] = useState(false);
  const [usernameTaken, setUsernameTaken] = useState(false);
  const [checkingUsername, setCheckingUsername] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const step = onboardingSteps[stepIndex] ?? 'profile';
  const isLastStep = stepIndex === onboardingSteps.length - 1;
  // Choosing an option is the only thing to do on these steps: nothing to explain with an error.
  const isChoiceStep = step === 'goal' || step === 'level';
  const update = (patch: Partial<OnboardingDraft>) =>
    setDraft((current) => ({ ...current, ...patch }));

  const usernameError = validationErrorOf(usernameSchema, draft.username);
  const displayNameError = validationErrorOf(displayNameSchema, draft.displayName);

  const goTo = (index: number) => {
    setFormError(null);
    setStepIndex(index);
  };

  const finish = () => {
    const answers = onboardingSchema.parse(draft);
    completeOnboarding.mutate(answers, {
      onError: (error) => {
        if (classifyError(error, onlineManager.isOnline()) === 'usernameTaken') {
          setUsernameTaken(true);
          setShowFieldErrors(true);
          goTo(0);
          return;
        }
        setFormError(getErrorMessage(error));
      },
    });
  };

  const handleContinue = async () => {
    setShowFieldErrors(true);
    if (!isStepComplete(step, draft)) return;

    if (step === 'profile') {
      setCheckingUsername(true);
      setFormError(null);
      try {
        const available = await isUsernameAvailable(usernameSchema.parse(draft.username), userId);
        setUsernameTaken(!available);
        if (!available) return;
      } catch (error) {
        setFormError(getErrorMessage(error));
        return;
      } finally {
        setCheckingUsername(false);
      }
    }

    if (isLastStep) {
      finish();
    } else {
      setShowFieldErrors(false);
      goTo(stepIndex + 1);
    }
  };

  const usernameMessage = usernameTaken
    ? t('validation.usernameTaken')
    : showFieldErrors && usernameError
      ? t(`validation.${usernameError}`)
      : null;

  return (
    <Screen
      withBottomInset
      keepTopBar
      onBack={stepIndex > 0 ? () => goTo(stepIndex - 1) : undefined}
      header={<OnboardingProgress current={stepIndex + 1} total={onboardingSteps.length} />}
      title={t(titleKeys[step])}
      footer={
        <>
          {formError ? <FormMessage message={formError} /> : null}
          <Button
            label={isLastStep ? t('onboarding.finish') : t('common.continue')}
            loading={checkingUsername || completeOnboarding.isPending}
            disabled={(showFieldErrors || isChoiceStep) && !isStepComplete(step, draft)}
            onPress={() => void handleContinue()}
          />
        </>
      }
    >
      {step === 'profile' ? (
        <View style={{ gap: spacing[4] }}>
          <Text variant="body" color="textMuted">
            {t('onboarding.profileBody')}
          </Text>
          <TextField
            label={t('onboarding.usernameLabel')}
            hint={t('onboarding.usernameHint')}
            value={draft.username}
            onChangeText={(username) => {
              setUsernameTaken(false);
              update({ username: username.toLowerCase() });
            }}
            error={usernameMessage}
            autoCapitalize="none"
            autoCorrect={false}
            autoComplete="username-new"
            textContentType="username"
            maxLength={accountLimits.usernameMax}
          />
          <TextField
            label={t('onboarding.displayNameLabel')}
            value={draft.displayName}
            onChangeText={(displayName) => update({ displayName })}
            error={showFieldErrors && displayNameError ? t(`validation.${displayNameError}`) : null}
            autoComplete="name"
            textContentType="name"
            maxLength={accountLimits.displayNameMax}
          />
        </View>
      ) : null}

      {step === 'goal' ? (
        <ChoiceList
          options={trainingGoals.map((goal) => ({
            value: goal,
            title: t(`onboarding.goals.${goal}`),
            description: t(`onboarding.goalHints.${goal}`),
          }))}
          value={draft.trainingGoal}
          onChange={(trainingGoal) => update({ trainingGoal })}
        />
      ) : null}

      {step === 'level' ? (
        <ChoiceList
          options={experienceLevels.map((level) => ({
            value: level,
            title: t(`onboarding.levels.${level}`),
            description: t(`onboarding.levelHints.${level}`),
          }))}
          value={draft.experienceLevel}
          onChange={(experienceLevel) => update({ experienceLevel })}
        />
      ) : null}

      {step === 'units' ? (
        <View style={{ gap: spacing[4] }}>
          <Text variant="body" color="textMuted">
            {t('onboarding.unitsBody')}
          </Text>
          <ChoiceList
            options={weightUnits.map((unit) => ({
              value: unit,
              title: t(`onboarding.units.${unit}`),
            }))}
            value={draft.units}
            onChange={(units) => update({ units })}
          />
        </View>
      ) : null}

      {step === 'consent' ? (
        <View style={{ gap: spacing[3] }}>
          <ConsentStep
            consent={draft.healthDataConsent}
            onChange={(healthDataConsent) => update({ healthDataConsent })}
          />
          {showFieldErrors && !draft.healthDataConsent ? (
            <FormMessage message={t('validation.consentRequired')} />
          ) : null}
        </View>
      ) : null}
    </Screen>
  );
}

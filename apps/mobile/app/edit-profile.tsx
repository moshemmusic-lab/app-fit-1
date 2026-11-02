import {
  accountLimits,
  bioSchema,
  displayNameSchema,
  profileUpdateSchema,
  usernameSchema,
  validationErrorOf,
} from '@app-fit/shared/schemas';
import { onlineManager } from '@tanstack/react-query';
import { router } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Pressable, View } from 'react-native';

import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { FormMessage } from '@/components/ui/FormMessage';
import { Screen } from '@/components/ui/Screen';
import { ErrorState, LoadingState } from '@/components/ui/StateViews';
import { SwitchRow } from '@/components/ui/SwitchRow';
import { TextField } from '@/components/ui/TextField';
import { useProfile, useUpdateProfile, type Profile } from '@/features/account/api';
import { avatarUrl, pickAvatar, useUploadAvatar } from '@/features/account/avatar';
import { useUserId } from '@/features/auth/session';
import { classifyError } from '@/lib/errors';
import { useErrorMessage } from '@/lib/use-error-message';
import { useTheme } from '@/theme/ThemeProvider';

const AVATAR_SIZE = 96;

export default function EditProfileScreen() {
  const { t } = useTranslation();
  const getErrorMessage = useErrorMessage();
  const profile = useProfile(useUserId());

  return profile.data ? (
    <EditProfileForm profile={profile.data} />
  ) : (
    <Screen withBottomInset onBack={() => router.back()} title={t('editProfile.title')}>
      {profile.isError ? (
        <ErrorState
          message={getErrorMessage(profile.error)}
          onRetry={() => void profile.refetch()}
          retrying={profile.isFetching}
        />
      ) : (
        <LoadingState />
      )}
    </Screen>
  );
}

function EditProfileForm({ profile }: { profile: Profile }) {
  const { t } = useTranslation();
  const { colors, radius, spacing } = useTheme();
  const userId = useUserId();
  const getErrorMessage = useErrorMessage();
  const updateProfile = useUpdateProfile(userId);
  const uploadAvatar = useUploadAvatar(userId);

  const [username, setUsername] = useState(profile.username ?? '');
  const [displayName, setDisplayName] = useState(profile.displayName ?? '');
  const [bio, setBio] = useState(profile.bio ?? '');
  const [isPrivate, setIsPrivate] = useState(profile.isPrivate);
  const [showFieldErrors, setShowFieldErrors] = useState(false);
  const [usernameTaken, setUsernameTaken] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [photoError, setPhotoError] = useState<string | null>(null);

  const usernameError = validationErrorOf(usernameSchema, username);
  const displayNameError = validationErrorOf(displayNameSchema, displayName);
  const bioError = validationErrorOf(bioSchema, bio);
  const hasChanges =
    username !== (profile.username ?? '') ||
    displayName !== (profile.displayName ?? '') ||
    bio !== (profile.bio ?? '') ||
    isPrivate !== profile.isPrivate;

  const changePhoto = async () => {
    setPhotoError(null);
    const uri = await pickAvatar();
    if (!uri) return;
    uploadAvatar.mutate(
      { uri, previousPath: profile.avatarPath },
      {
        onError: (error) => {
          const isOffline = classifyError(error, onlineManager.isOnline()) === 'offline';
          setPhotoError(isOffline ? t('common.offline') : t('editProfile.photoUploadFailed'));
        },
      },
    );
  };

  const save = () => {
    setShowFieldErrors(true);
    setFormError(null);
    const parsed = profileUpdateSchema.safeParse({ username, displayName, bio, isPrivate });
    if (!parsed.success) return;
    updateProfile.mutate(parsed.data, {
      onSuccess: () => router.back(),
      onError: (error) => {
        if (classifyError(error, onlineManager.isOnline()) === 'usernameTaken') {
          setUsernameTaken(true);
          return;
        }
        setFormError(getErrorMessage(error));
      },
    });
  };

  const fieldError = (error: typeof usernameError) =>
    showFieldErrors && error ? t(`validation.${error}`) : null;

  return (
    <Screen
      withBottomInset
      onBack={() => router.back()}
      title={t('editProfile.title')}
      footer={
        <>
          {formError ? <FormMessage message={formError} /> : null}
          <Button
            label={t('common.save')}
            loading={updateProfile.isPending}
            disabled={!hasChanges || uploadAvatar.isPending}
            onPress={save}
          />
        </>
      }
    >
      <View style={{ alignItems: 'center', gap: spacing[2] }}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('editProfile.changePhoto')}
          disabled={uploadAvatar.isPending}
          onPress={() => void changePhoto()}
        >
          <Avatar
            uri={avatarUrl(profile.avatarPath)}
            name={displayName}
            size={AVATAR_SIZE}
            accessibilityLabel={t('profile.avatarLabel', { name: displayName })}
          />
          {uploadAvatar.isPending ? (
            <View
              style={{
                position: 'absolute',
                inset: 0,
                borderRadius: radius.pill,
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: colors.surface2,
              }}
            >
              <ActivityIndicator color={colors.text} />
            </View>
          ) : null}
        </Pressable>
        <Button
          variant="ghost"
          label={t('editProfile.changePhoto')}
          disabled={uploadAvatar.isPending}
          onPress={() => void changePhoto()}
        />
        {photoError ? <FormMessage message={photoError} /> : null}
      </View>

      <View style={{ gap: spacing[4] }}>
        <TextField
          label={t('editProfile.usernameLabel')}
          value={username}
          onChangeText={(value) => {
            setUsernameTaken(false);
            setUsername(value.toLowerCase());
          }}
          error={usernameTaken ? t('validation.usernameTaken') : fieldError(usernameError)}
          autoCapitalize="none"
          autoCorrect={false}
          maxLength={accountLimits.usernameMax}
        />
        <TextField
          label={t('editProfile.displayNameLabel')}
          value={displayName}
          onChangeText={setDisplayName}
          error={fieldError(displayNameError)}
          maxLength={accountLimits.displayNameMax}
        />
        <TextField
          label={t('editProfile.bioLabel')}
          placeholder={t('editProfile.bioPlaceholder')}
          value={bio}
          onChangeText={setBio}
          error={fieldError(bioError)}
          trailingHint={t('editProfile.bioCounter', {
            count: bio.length,
            max: accountLimits.bioMax,
          })}
          multiline
          maxLength={accountLimits.bioMax}
        />
        <SwitchRow
          label={t('editProfile.privateLabel')}
          hint={t('editProfile.privateHint')}
          value={isPrivate}
          onValueChange={setIsPrivate}
        />
      </View>
    </Screen>
  );
}

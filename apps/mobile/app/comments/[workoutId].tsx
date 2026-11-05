import { commentMaxLength } from '@app-fit/shared/social';
import { router, useLocalSearchParams } from 'expo-router';
import { Ellipsis, Flag, SendHorizontal, Trash2 } from 'lucide-react-native';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, FlatList, Pressable, TextInput, View } from 'react-native';

import { Avatar } from '@/components/ui/Avatar';
import { EmptyState } from '@/components/ui/EmptyState';
import { IconButton } from '@/components/ui/IconButton';
import { OptionsSheet, type OptionsSheetConfig } from '@/components/ui/OptionsSheet';
import { Screen } from '@/components/ui/Screen';
import { ErrorState, LoadingState } from '@/components/ui/StateViews';
import { Text } from '@/components/ui/Text';
import { avatarUrl } from '@/features/account/avatar';
import { useUserId } from '@/features/auth/session';
import { useAddComment, useComments, useDeleteComment } from '@/features/social/api';
import { useSocialErrorAlert, useTimeAgo } from '@/features/social/format';
import { openUser } from '@/features/social/navigation';
import { useReportSheet } from '@/features/social/report';
import type { Comment } from '@/features/social/types';
import { useErrorMessage } from '@/lib/use-error-message';
import { fontNameForVariant } from '@/theme/font-names';
import { useTheme } from '@/theme/ThemeProvider';

const AVATAR_SIZE = 36;

/** A workout's comments, oldest first, with a field to write one. */
export default function CommentsScreen() {
  const { t } = useTranslation();
  const { colors, radius, sizes, spacing, typography } = useTheme();
  const getErrorMessage = useErrorMessage();
  const { workoutId } = useLocalSearchParams<{ workoutId: string }>();
  const viewer = useUserId();
  const comments = useComments(viewer, workoutId);
  const addComment = useAddComment(viewer);
  const deleteComment = useDeleteComment(viewer);
  const reportSheet = useReportSheet();
  const showError = useSocialErrorAlert();
  const [body, setBody] = useState('');
  const [sheet, setSheet] = useState<OptionsSheetConfig | null>(null);
  const canSend = body.trim() !== '' && !addComment.isPending;

  const send = () => {
    if (!canSend) return;
    addComment.mutate(
      { workoutId, body: body.trim() },
      { onSuccess: () => setBody(''), onError: showError },
    );
  };

  const openOptions = (comment: Comment) =>
    setSheet({
      title: t('comments.options'),
      options: [
        ...(comment.canDelete
          ? [
              {
                label: t('comments.delete'),
                icon: Trash2,
                onPress: () =>
                  Alert.alert(t('comments.deleteTitle'), undefined, [
                    { text: t('common.cancel'), style: 'cancel' },
                    {
                      text: t('comments.delete'),
                      style: 'destructive',
                      onPress: () => deleteComment.mutate(comment.id, { onError: showError }),
                    },
                  ]),
              },
            ]
          : []),
        ...(comment.user.id !== viewer
          ? [
              {
                label: t('comments.report'),
                icon: Flag,
                onPress: () => setSheet(reportSheet('comment', comment.id, comment.user)),
              },
            ]
          : []),
      ],
    });

  const unavailable = comments.data === null;

  return (
    <Screen
      title={t('comments.title')}
      onBack={() => router.back()}
      withBottomInset
      scroll={false}
      footer={
        unavailable ? undefined : (
          <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: spacing[2] }}>
            <TextInput
              accessibilityLabel={t('comments.label')}
              placeholder={t('comments.placeholder')}
              placeholderTextColor={colors.textMuted}
              value={body}
              onChangeText={setBody}
              maxLength={commentMaxLength}
              multiline
              selectionColor={colors.accentText}
              cursorColor={colors.accentText}
              style={{
                flex: 1,
                minHeight: sizes.touchMin,
                maxHeight: sizes.touchMin * 3,
                paddingHorizontal: spacing[3],
                paddingTop: spacing[3],
                paddingBottom: spacing[3],
                borderRadius: radius.md,
                backgroundColor: colors.surface2,
                color: colors.text,
                fontFamily: fontNameForVariant('body'),
                fontSize: typography.body.fontSize,
              }}
            />
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={t('comments.send')}
              accessibilityState={{ disabled: !canSend }}
              disabled={!canSend}
              onPress={send}
              style={({ pressed }) => ({
                width: sizes.touchMin,
                height: sizes.touchMin,
                borderRadius: radius.md,
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: canSend ? colors.lime : colors.surface2,
                opacity: pressed ? 0.8 : 1,
              })}
            >
              <SendHorizontal
                size={sizes.icon * 0.85}
                strokeWidth={2}
                color={canSend ? colors.inkOnLime : colors.textMuted}
              />
            </Pressable>
          </View>
        )
      }
    >
      {comments.data ? (
        <FlatList
          style={{ flex: 1 }}
          data={comments.data}
          keyExtractor={(comment) => comment.id}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ gap: spacing[4], paddingBottom: spacing[4] }}
          renderItem={({ item }) => (
            <CommentRow comment={item} viewer={viewer} onOptions={() => openOptions(item)} />
          )}
          ListEmptyComponent={
            <EmptyState title={t('comments.emptyTitle')} body={t('comments.emptyBody')} />
          }
        />
      ) : unavailable ? (
        <EmptyState title={t('comments.unavailableTitle')} body={t('comments.unavailableBody')} />
      ) : comments.isError || comments.fetchStatus === 'paused' ? (
        <ErrorState
          message={getErrorMessage(comments.error)}
          onRetry={() => void comments.refetch()}
          retrying={comments.isFetching}
        />
      ) : (
        <LoadingState />
      )}
      <OptionsSheet config={sheet} onClose={() => setSheet(null)} />
    </Screen>
  );
}

function CommentRow({
  comment,
  viewer,
  onOptions,
}: {
  comment: Comment;
  viewer: string;
  onOptions: () => void;
}) {
  const { t } = useTranslation();
  const { spacing } = useTheme();
  const timeAgo = useTimeAgo();
  const hasOptions = comment.canDelete || comment.user.id !== viewer;

  return (
    <View style={{ flexDirection: 'row', gap: spacing[3] }}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={t('feed.openProfile', { name: comment.user.displayName })}
        onPress={() => openUser(comment.user.id, viewer)}
      >
        <Avatar
          uri={avatarUrl(comment.user.avatarPath)}
          name={comment.user.displayName}
          size={AVATAR_SIZE}
          accessibilityLabel={t('profile.avatarLabel', { name: comment.user.displayName })}
        />
      </Pressable>
      <View style={{ flex: 1, gap: 2 }}>
        <Text variant="caption" color="textMuted">
          <Text variant="caption">{comment.user.displayName}</Text>
          {` · ${timeAgo(comment.createdAt)}`}
        </Text>
        <Text variant="body">{comment.body}</Text>
      </View>
      {hasOptions ? (
        <IconButton icon={Ellipsis} label={t('comments.options')} onPress={onOptions} />
      ) : null}
    </View>
  );
}

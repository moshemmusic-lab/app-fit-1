import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { KeyboardAvoidingView, Modal, Platform, Pressable, View } from 'react-native';

import { Button } from '@/components/ui/Button';
import { Text } from '@/components/ui/Text';
import { TextField } from '@/components/ui/TextField';
import { useTheme } from '@/theme/ThemeProvider';

interface NamePromptModalProps {
  visible: boolean;
  title: string;
  label: string;
  placeholder?: string;
  initialValue?: string;
  maxLength: number;
  /** Returns an error message to show, or null when the name is valid. */
  validate: (name: string) => string | null;
  onSubmit: (name: string) => void;
  onClose: () => void;
  submitting?: boolean;
}

/** Asks for a name (Alert.prompt only exists on iOS). Mounted fresh each time it opens. */
export function NamePromptModal(props: NamePromptModalProps) {
  return (
    <Modal visible={props.visible} transparent animationType="fade" onRequestClose={props.onClose}>
      {props.visible ? <NamePromptContent {...props} /> : null}
    </Modal>
  );
}

function NamePromptContent({
  title,
  label,
  placeholder,
  initialValue = '',
  maxLength,
  validate,
  onSubmit,
  onClose,
  submitting = false,
}: NamePromptModalProps) {
  const { t } = useTranslation();
  const { colors, radius, spacing } = useTheme();
  const [name, setName] = useState(initialValue);
  const [error, setError] = useState<string | null>(null);

  const submit = () => {
    const message = validate(name);
    setError(message);
    if (!message) onSubmit(name);
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={{ flex: 1, justifyContent: 'center', padding: spacing[4] }}
    >
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={t('common.cancel')}
        onPress={onClose}
        style={{ position: 'absolute', top: 0, right: 0, bottom: 0, left: 0 }}
      >
        <View style={{ flex: 1, backgroundColor: colors.bg, opacity: 0.7 }} />
      </Pressable>
      <View
        style={{
          padding: spacing[4],
          gap: spacing[4],
          borderRadius: radius.xl,
          backgroundColor: colors.surface,
        }}
      >
        <Text variant="heading" accessibilityRole="header">
          {title}
        </Text>
        <TextField
          label={label}
          placeholder={placeholder}
          value={name}
          onChangeText={(text) => {
            setName(text);
            setError(null);
          }}
          error={error}
          maxLength={maxLength}
          autoFocus
          returnKeyType="done"
          onSubmitEditing={submit}
        />
        <View style={{ flexDirection: 'row', gap: spacing[2] }}>
          <View style={{ flex: 1 }}>
            <Button label={t('common.cancel')} variant="secondary" tall onPress={onClose} />
          </View>
          <View style={{ flex: 1 }}>
            <Button label={t('common.save')} loading={submitting} onPress={submit} />
          </View>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

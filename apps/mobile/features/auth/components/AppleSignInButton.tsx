import * as AppleAuthentication from 'expo-apple-authentication';
import { useEffect, useState } from 'react';
import { Platform } from 'react-native';

import { useTheme } from '@/theme/ThemeProvider';

interface AppleSignInButtonProps {
  onPress: () => void;
}

/** Apple's own button (required by Apple). Only on iOS devices that support it. */
export function AppleSignInButton({ onPress }: AppleSignInButtonProps) {
  const { mode, radius, sizes } = useTheme();
  const [isAvailable, setIsAvailable] = useState(false);

  useEffect(() => {
    if (Platform.OS !== 'ios') return;
    void AppleAuthentication.isAvailableAsync().then(setIsAvailable);
  }, []);

  if (!isAvailable) return null;

  return (
    <AppleAuthentication.AppleAuthenticationButton
      buttonType={AppleAuthentication.AppleAuthenticationButtonType.CONTINUE}
      buttonStyle={
        mode === 'dark'
          ? AppleAuthentication.AppleAuthenticationButtonStyle.WHITE
          : AppleAuthentication.AppleAuthenticationButtonStyle.BLACK
      }
      cornerRadius={radius.md}
      style={{ height: sizes.buttonPrimary }}
      onPress={onPress}
    />
  );
}

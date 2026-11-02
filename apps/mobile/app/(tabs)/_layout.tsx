import { Tabs } from 'expo-router';
import { ChartLine, Dumbbell, House, LayoutGrid, User, type LucideIcon } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { Text } from 'react-native';

import { TabIcon } from '@/components/TabIcon';
import { fontNameFor } from '@/theme/font-names';
import { useTheme } from '@/theme/ThemeProvider';

const tabs = [
  { name: 'index', labelKey: 'tabs.home', icon: House },
  { name: 'workout', labelKey: 'tabs.workout', icon: Dumbbell },
  { name: 'programs', labelKey: 'tabs.programs', icon: LayoutGrid },
  { name: 'progress', labelKey: 'tabs.progress', icon: ChartLine },
  { name: 'profile', labelKey: 'tabs.profile', icon: User },
] as const satisfies readonly { name: string; labelKey: string; icon: LucideIcon }[];

export default function TabLayout() {
  const { t } = useTranslation();
  const { colors, typography } = useTheme();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.text,
        tabBarInactiveTintColor: colors.textSubtle,
        tabBarStyle: { backgroundColor: colors.surface, borderTopColor: colors.line },
      }}
    >
      {tabs.map((tab) => (
        <Tabs.Screen
          key={tab.name}
          name={tab.name}
          options={{
            title: t(tab.labelKey),
            tabBarIcon: ({ focused, color }) => (
              <TabIcon icon={tab.icon} focused={focused} color={color} />
            ),
            // Active tab: different color, heavier weight and the lime bar.
            tabBarLabel: ({ focused, color, children }) => (
              <Text
                style={{
                  color,
                  fontFamily: fontNameFor('sans', focused ? 700 : 500),
                  fontSize: typography.label.fontSize,
                  lineHeight: typography.label.lineHeight,
                }}
              >
                {children}
              </Text>
            ),
          }}
        />
      ))}
    </Tabs>
  );
}

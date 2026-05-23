import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

import { HistoryScreen } from '../features/actionStart';
import { SettingsScreen } from '../features/settings/screens/SettingsScreen';
import { ACCENT } from '../shared/theme/colors';
import type { RootTabParamList } from './types';
import { StartStack } from './StartStack';

const Tab = createBottomTabNavigator<RootTabParamList>();

export function RootNavigator() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: ACCENT,
        tabBarInactiveTintColor: '#9ca3af',
        tabBarStyle: {
          borderTopColor: '#e5e7eb',
          backgroundColor: '#ffffff',
        },
      }}
    >
      <Tab.Screen
        name="HomeTab"
        component={StartStack}
        options={{ title: 'Home' }}
      />
      <Tab.Screen
        name="HistoryTab"
        component={HistoryScreen}
        options={{ title: 'History' }}
      />
      <Tab.Screen
        name="SettingsTab"
        component={SettingsScreen}
        options={{ title: 'Settings' }}
      />
    </Tab.Navigator>
  );
}

import { Ionicons } from '@expo/vector-icons';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import type { ComponentProps } from 'react';

import { HistoryScreen } from '../features/actionStart';
import { SettingsScreen } from '../features/settings/screens/SettingsScreen';
import { ACCENT } from '../shared/theme/colors';
import type { RootTabParamList } from './types';
import { StartStack } from './StartStack';

const Tab = createBottomTabNavigator<RootTabParamList>();

type IoniconName = ComponentProps<typeof Ionicons>['name'];

function tabIcon(
  focusedName: IoniconName,
  outlineName: IoniconName,
) {
  return ({
    color,
    size,
    focused,
  }: {
    color: string;
    size: number;
    focused: boolean;
  }) => (
    <Ionicons
      name={focused ? focusedName : outlineName}
      size={size}
      color={color}
    />
  );
}

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
        options={{
          title: 'Home',
          tabBarIcon: tabIcon('home', 'home-outline'),
        }}
      />
      <Tab.Screen
        name="HistoryTab"
        component={HistoryScreen}
        options={{
          title: 'History',
          tabBarIcon: tabIcon('time', 'time-outline'),
        }}
      />
      <Tab.Screen
        name="SettingsTab"
        component={SettingsScreen}
        options={{
          title: 'Settings',
          tabBarIcon: tabIcon('settings', 'settings-outline'),
        }}
      />
    </Tab.Navigator>
  );
}

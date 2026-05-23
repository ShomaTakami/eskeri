import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { HomeScreen, TimerScreen } from '../features/actionStart';
import type { StartStackParamList } from './types';

const Stack = createNativeStackNavigator<StartStackParamList>();

export function StartStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="HomeScreen" component={HomeScreen} />
      <Stack.Screen
        name="TimerScreen"
        component={TimerScreen}
        options={{ animation: 'fade' }}
      />
    </Stack.Navigator>
  );
}

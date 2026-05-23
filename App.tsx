import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ActionStartProvider } from './src/features/actionStart';
import { MomentumProvider } from './src/features/momentum';
import { initializeNotifications } from './src/features/actionStart/services/timerNotifications';
import { AppRoot } from './src/navigation/AppRoot';

export default function App() {
  useEffect(() => {
    initializeNotifications();
  }, []);

  return (
    <SafeAreaProvider>
      <MomentumProvider>
        <ActionStartProvider>
          <AppRoot />
          <StatusBar style="auto" />
        </ActionStartProvider>
      </MomentumProvider>
    </SafeAreaProvider>
  );
}

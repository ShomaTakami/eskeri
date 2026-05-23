import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ActionStartProvider } from './src/features/actionStart';
import { MomentumProvider } from './src/features/momentum';
import { AppRoot } from './src/navigation/AppRoot';

export default function App() {
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

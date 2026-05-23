import { NavigationContainer } from '@react-navigation/native';
import { useEffect, useState } from 'react';
import { ActivityIndicator, AppState, StyleSheet, View } from 'react-native';

import {
  handleInitialNotificationResponse,
  initializeNotifications,
} from '../features/actionStart/services/timerNotifications';
import { OnboardingScreen } from '../shared/onboarding/OnboardingScreen';
import { isOnboardingCompleted } from '../shared/onboarding/onboardingStorage';
import {
  flushPendingNotificationNavigation,
  navigationRef,
} from './notificationNavigation';
import { resumeActiveTaskIfNeeded } from './resumeActiveTask';
import { RootNavigator } from './RootNavigator';

export function AppRoot() {
  const [booting, setBooting] = useState(true);
  const [showOnboarding, setShowOnboarding] = useState(false);

  useEffect(() => {
    void (async () => {
      try {
        const completed = await isOnboardingCompleted();
        setShowOnboarding(!completed);
      } catch {
        setShowOnboarding(true);
      } finally {
        setBooting(false);
      }
    })();
  }, []);

  useEffect(() => {
    if (booting || showOnboarding) {
      return;
    }

    const subscription = AppState.addEventListener('change', (nextState) => {
      if (nextState === 'active') {
        void resumeActiveTaskIfNeeded();
      }
    });

    return () => subscription.remove();
  }, [booting, showOnboarding]);

  if (booting) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color="#111827" />
      </View>
    );
  }

  if (showOnboarding) {
    return (
      <OnboardingScreen onComplete={() => setShowOnboarding(false)} />
    );
  }

  const handleNavigationReady = () => {
    initializeNotifications();
    flushPendingNotificationNavigation();
    void (async () => {
      await handleInitialNotificationResponse();
      await resumeActiveTaskIfNeeded();
    })();
  };

  return (
    <NavigationContainer ref={navigationRef} onReady={handleNavigationReady}>
      <RootNavigator />
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ffffff',
  },
});

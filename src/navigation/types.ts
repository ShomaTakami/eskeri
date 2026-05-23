import type { NavigatorScreenParams } from '@react-navigation/native';

export type StartStackParamList = {
  HomeScreen: undefined;
  TimerScreen: {
    taskId: string;
    title: string;
    startedAt: string;
    heavinessBefore: number;
  };
  TaskComplete: {
    taskId: string;
  };
};

export type RootTabParamList = {
  HomeTab: NavigatorScreenParams<StartStackParamList> | undefined;
  HistoryTab: undefined;
  SettingsTab: undefined;
};

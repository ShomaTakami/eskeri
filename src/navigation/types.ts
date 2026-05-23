export type StartStackParamList = {
  HomeScreen: undefined;
  TimerScreen: {
    title: string;
    startedAt: string;
    heavinessBefore: number;
  };
};

export type RootTabParamList = {
  HomeTab: undefined;
  HistoryTab: undefined;
  SettingsTab: undefined;
};

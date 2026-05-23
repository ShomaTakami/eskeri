export type FeelingAfter = 'light' | 'normal' | 'heavy';

export type ActionLog = {
  id: string;
  title: string;
  startedAt: string;
  duration: number;
  heavinessBefore: number;
  feelingAfter: FeelingAfter;
  momentumAwarded?: boolean;
};

export type CreateActionLogInput = {
  title: string;
  startedAt: string;
  duration: number;
  heavinessBefore: number;
  feelingAfter: FeelingAfter;
  momentumAwarded?: boolean;
};

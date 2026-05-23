export type ActionLog = {
  id: string;
  title: string;
  startedAt: string;
  duration: number;
  heavinessBefore: number;
  feelingAfter: number;
  momentumAwarded?: boolean;
};

export type CreateActionLogInput = {
  title: string;
  startedAt: string;
  duration: number;
  heavinessBefore: number;
  feelingAfter: number;
  momentumAwarded?: boolean;
};

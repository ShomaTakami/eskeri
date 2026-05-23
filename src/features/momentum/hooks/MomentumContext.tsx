import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

import { createId } from '../../actionStart/utils/id';
import {
  loadMomentumPoints,
  saveMomentumPoints,
} from '../storage/momentumStorage';
import { loadRewards, saveRewards } from '../storage/rewardStorage';
import { MAX_REWARDS, type Reward } from '../types/reward';

type MomentumContextValue = {
  momentumPoints: number;
  rewards: Reward[];
  loading: boolean;
  awardMomentum: (amount: number) => Promise<void>;
  useReward: (reward: Reward) => Promise<boolean>;
  upsertReward: (input: {
    id?: string;
    title: string;
    requiredMomentum: number;
  }) => Promise<boolean>;
  removeReward: (id: string) => Promise<void>;
  refresh: () => Promise<void>;
  resetPoints: () => Promise<void>;
  clearRewards: () => Promise<void>;
};

const MomentumContext = createContext<MomentumContextValue | null>(null);

export function MomentumProvider({ children }: { children: ReactNode }) {
  const [momentumPoints, setMomentumPoints] = useState(0);
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void (async () => {
      try {
        const [points, storedRewards] = await Promise.all([
          loadMomentumPoints(),
          loadRewards(),
        ]);
        setMomentumPoints(points);
        setRewards(storedRewards);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const refresh = useCallback(async () => {
    const [points, storedRewards] = await Promise.all([
      loadMomentumPoints(),
      loadRewards(),
    ]);
    setMomentumPoints(points);
    setRewards(storedRewards);
  }, []);

  const resetPoints = useCallback(async () => {
    await saveMomentumPoints(0);
    setMomentumPoints(0);
  }, []);

  const clearRewards = useCallback(async () => {
    await saveRewards([]);
    setRewards([]);
  }, []);

  const awardMomentum = useCallback(async (amount: number) => {
    const delta = Math.max(0, Math.floor(amount));
    if (delta === 0) {
      return;
    }
    setMomentumPoints((prev) => {
      const next = prev + delta;
      void saveMomentumPoints(next);
      return next;
    });
  }, []);

  const useReward = useCallback(async (reward: Reward) => {
    let success = false;
    setMomentumPoints((prev) => {
      if (prev < reward.requiredMomentum) {
        return prev;
      }
      success = true;
      const next = prev - reward.requiredMomentum;
      void saveMomentumPoints(next);
      return next;
    });
    return success;
  }, []);

  const upsertReward = useCallback(
    async (input: {
      id?: string;
      title: string;
      requiredMomentum: number;
    }) => {
      const title = input.title.trim();
      const requiredMomentum = Math.max(1, Math.floor(input.requiredMomentum));
      if (!title) {
        return false;
      }

      let saved = false;
      setRewards((prev) => {
        const existingIndex = input.id
          ? prev.findIndex((reward) => reward.id === input.id)
          : -1;
        const nextReward: Reward = {
          id: input.id ?? createId(),
          title,
          requiredMomentum,
        };

        let next: Reward[];
        if (existingIndex >= 0) {
          next = [...prev];
          next[existingIndex] = nextReward;
        } else if (prev.length >= MAX_REWARDS) {
          return prev;
        } else {
          next = [...prev, nextReward];
        }

        saved = true;
        void saveRewards(next);
        return next;
      });
      return saved;
    },
    [],
  );

  const removeReward = useCallback(async (id: string) => {
    setRewards((prev) => {
      const next = prev.filter((reward) => reward.id !== id);
      void saveRewards(next);
      return next;
    });
  }, []);

  const value = useMemo(
    () => ({
      momentumPoints,
      rewards,
      loading,
      awardMomentum,
      useReward,
      upsertReward,
      removeReward,
      refresh,
      resetPoints,
      clearRewards,
    }),
    [
      momentumPoints,
      rewards,
      loading,
      awardMomentum,
      useReward,
      upsertReward,
      removeReward,
      refresh,
      resetPoints,
      clearRewards,
    ],
  );

  return (
    <MomentumContext.Provider value={value}>{children}</MomentumContext.Provider>
  );
}

export function useMomentum(): MomentumContextValue {
  const context = useContext(MomentumContext);
  if (!context) {
    throw new Error('useMomentum must be used within MomentumProvider');
  }
  return context;
}

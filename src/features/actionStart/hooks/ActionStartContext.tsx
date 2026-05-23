import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

import {
  appendActionLog,
  clearActionLogs,
  loadActionLogs,
} from '../storage/actionLogRepository';
import type { ActionLog, CreateActionLogInput } from '../types/actionLog';
import { createId } from '../utils/id';

type ActionStartContextValue = {
  actionLogs: ActionLog[];
  loading: boolean;
  saveAction: (input: CreateActionLogInput) => Promise<void>;
  refresh: () => Promise<void>;
  clearLogs: () => Promise<void>;
};

const ActionStartContext = createContext<ActionStartContextValue | null>(null);

export function ActionStartProvider({ children }: { children: ReactNode }) {
  const [actionLogs, setActionLogs] = useState<ActionLog[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    const logs = await loadActionLogs();
    setActionLogs(logs);
  }, []);

  useEffect(() => {
    void (async () => {
      try {
        await refresh();
      } catch (error) {
        console.error('[ActionStart] initial load failed', error);
      } finally {
        setLoading(false);
      }
    })();
  }, [refresh]);

  const clearLogs = useCallback(async () => {
    await clearActionLogs();
    setActionLogs([]);
  }, []);

  const saveAction = useCallback(async (input: CreateActionLogInput) => {
    const log: ActionLog = {
      id: createId(),
      title: input.title.trim(),
      startedAt: input.startedAt,
      duration: input.duration,
      heavinessBefore: input.heavinessBefore,
      feelingAfter: input.feelingAfter,
      ...(input.momentumAwarded === true ? { momentumAwarded: true } : {}),
    };
    const next = await appendActionLog(log);
    setActionLogs(next);
  }, []);

  const value = useMemo(
    () => ({
      actionLogs,
      loading,
      saveAction,
      refresh,
      clearLogs,
    }),
    [actionLogs, loading, saveAction, refresh, clearLogs],
  );

  return (
    <ActionStartContext.Provider value={value}>
      {children}
    </ActionStartContext.Provider>
  );
}

export function useActionStart(): ActionStartContextValue {
  const context = useContext(ActionStartContext);
  if (!context) {
    throw new Error('useActionStart must be used within ActionStartProvider');
  }
  return context;
}

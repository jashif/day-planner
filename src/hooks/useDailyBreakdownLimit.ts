import { useCallback, useEffect, useState } from "react";
import {
  DAILY_BREAKDOWN_LIMIT,
  recordBreakdownUsage,
  subscribeToBreakdownUsage,
} from "../db/usageDb";

export interface BreakdownLimit {
  count: number;
  limit: number;
  remaining: number;
  isLimitReached: boolean;
  recordUsage: () => Promise<void>;
}

export const useDailyBreakdownLimit = (uid: string): BreakdownLimit => {
  const [count, setCount] = useState(0);

  useEffect(() => {
    const unsubscribe = subscribeToBreakdownUsage(uid, setCount);
    return unsubscribe;
  }, [uid]);

  const recordUsage = useCallback(() => recordBreakdownUsage(uid), [uid]);

  return {
    count,
    limit: DAILY_BREAKDOWN_LIMIT,
    remaining: Math.max(0, DAILY_BREAKDOWN_LIMIT - count),
    isLimitReached: count >= DAILY_BREAKDOWN_LIMIT,
    recordUsage,
  };
};

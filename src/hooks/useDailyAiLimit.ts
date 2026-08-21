import { useCallback, useEffect, useState } from "react";
import { DAILY_AI_LIMIT, recordAiUsage, subscribeToAiUsage } from "../db/usageDb";

export interface AiLimit {
  count: number;
  limit: number;
  remaining: number;
  isLimitReached: boolean;
  recordUsage: () => Promise<void>;
}

/** Shared daily quota for all Gemini-powered actions (task breakdown, voice task capture). */
export const useDailyAiLimit = (uid: string): AiLimit => {
  const [count, setCount] = useState(0);

  useEffect(() => {
    const unsubscribe = subscribeToAiUsage(uid, setCount);
    return unsubscribe;
  }, [uid]);

  const recordUsage = useCallback(() => recordAiUsage(uid), [uid]);

  return {
    count,
    limit: DAILY_AI_LIMIT,
    remaining: Math.max(0, DAILY_AI_LIMIT - count),
    isLimitReached: count >= DAILY_AI_LIMIT,
    recordUsage,
  };
};

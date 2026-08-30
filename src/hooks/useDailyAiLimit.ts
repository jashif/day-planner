import { useCallback, useEffect, useState } from "react";
import { redeemAiBoost } from "../db/profileDb";
import {
  DAILY_AI_LIMIT,
  recordAiUsage,
  subscribeToAiLimit,
  subscribeToAiUsage,
} from "../db/usageDb";

export interface AiLimit {
  count: number;
  limit: number;
  remaining: number;
  isLimitReached: boolean;
  recordUsage: () => Promise<void>;
  redeemBoost: () => Promise<void>;
}

/** Shared daily quota for all Gemini-powered actions (task breakdown, voice task capture). */
export const useDailyAiLimit = (uid: string): AiLimit => {
  const [count, setCount] = useState(0);
  const [limit, setLimit] = useState(DAILY_AI_LIMIT);

  useEffect(() => {
    const unsubscribe = subscribeToAiUsage(uid, setCount);
    return unsubscribe;
  }, [uid]);

  useEffect(() => {
    const unsubscribe = subscribeToAiLimit(uid, setLimit);
    return unsubscribe;
  }, [uid]);

  const recordUsage = useCallback(() => recordAiUsage(uid), [uid]);
  const redeemBoost = useCallback(() => redeemAiBoost(uid), [uid]);

  return {
    count,
    limit,
    remaining: Math.max(0, limit - count),
    isLimitReached: count >= limit,
    recordUsage,
    redeemBoost,
  };
};

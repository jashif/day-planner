import { useCallback, useEffect, useState } from "react";
import { getStreak, recordStreakActivity, type Streak } from "../db/userDb";

const EMPTY_STREAK: Streak = { currentStreak: 0, longestStreak: 0, lastActiveDate: null };

export const useStreak = (uid: string) => {
  const [streak, setStreak] = useState<Streak>(EMPTY_STREAK);

  useEffect(() => {
    let cancelled = false;
    getStreak(uid).then((next) => {
      if (!cancelled) setStreak(next);
    });
    return () => {
      cancelled = true;
    };
  }, [uid]);

  const recordActivity = useCallback(async () => {
    const next = await recordStreakActivity(uid);
    setStreak(next);
  }, [uid]);

  return { ...streak, recordActivity };
};

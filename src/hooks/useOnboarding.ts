import { useCallback, useEffect, useState } from "react";
import { hasCompletedOnboarding } from "../db/userDb";

export type OnboardingStatus = "loading" | "needed" | "done";

/** Decides whether to show the routine-setup flow, and lets the user re-run it later. */
export const useOnboarding = (uid: string) => {
  const [status, setStatus] = useState<OnboardingStatus>("loading");

  useEffect(() => {
    let cancelled = false;
    setStatus("loading");
    hasCompletedOnboarding(uid)
      .then((done) => {
        if (!cancelled) setStatus(done ? "done" : "needed");
      })
      // Never trap the user behind onboarding if the profile read fails.
      .catch(() => {
        if (!cancelled) setStatus("done");
      });
    return () => {
      cancelled = true;
    };
  }, [uid]);

  const complete = useCallback(() => setStatus("done"), []);
  const restart = useCallback(() => setStatus("needed"), []);

  return { status, complete, restart };
};

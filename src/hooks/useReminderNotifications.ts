import { useCallback, useEffect, useState } from "react";
import {
  getReminderEnabled,
  getReminderPromptSeen,
  setReminderEnabled,
  setReminderPromptSeen,
} from "../db/userDb";
import { todayISO } from "../utils/dates";

const REMINDER_HOUR = 18; // 6 PM local time
const CHECK_INTERVAL_MS = 30 * 60 * 1000;
const NOTIFIED_DATE_KEY = "day-planner:reminder-last-notified";

export const isNotificationSupported = (): boolean => typeof Notification !== "undefined";

/**
 * Foreground-only reminder: fires a local Notification while a tab is open.
 * True background push (app closed) needs Firebase Cloud Messaging + a scheduled
 * server function, which isn't wired up yet.
 */
export const useReminderNotifications = (uid: string, hasCompletedToday: boolean) => {
  const [isEnabled, setIsEnabled] = useState(false);
  const [promptSeen, setPromptSeen] = useState(true);
  const [permission, setPermission] = useState<NotificationPermission | "unsupported">(
    isNotificationSupported() ? Notification.permission : "unsupported",
  );

  useEffect(() => {
    let cancelled = false;
    Promise.all([getReminderEnabled(uid), getReminderPromptSeen(uid)]).then(([enabled, seen]) => {
      if (cancelled) return;
      setIsEnabled(enabled);
      setPromptSeen(seen);
    });
    return () => {
      cancelled = true;
    };
  }, [uid]);

  useEffect(() => {
    if (!isEnabled || permission !== "granted") return;

    const check = () => {
      const today = todayISO();
      const hour = new Date().getHours();
      const alreadyNotified = localStorage.getItem(NOTIFIED_DATE_KEY) === today;
      if (hour < REMINDER_HOUR || hasCompletedToday || alreadyNotified) return;

      new Notification("Keep your streak alive", {
        body: "You haven't finished a task today yet.",
        icon: "/icon-192.png",
      });
      localStorage.setItem(NOTIFIED_DATE_KEY, today);
    };

    check();
    const interval = window.setInterval(check, CHECK_INTERVAL_MS);
    return () => window.clearInterval(interval);
  }, [isEnabled, permission, hasCompletedToday]);

  const enable = useCallback(async () => {
    if (!isNotificationSupported()) return;
    const result = await Notification.requestPermission();
    setPermission(result);
    setPromptSeen(true);
    await setReminderPromptSeen(uid);
    if (result !== "granted") return;
    await setReminderEnabled(uid, true);
    setIsEnabled(true);
  }, [uid]);

  const disable = useCallback(async () => {
    await setReminderEnabled(uid, false);
    setIsEnabled(false);
  }, [uid]);

  const dismissPrompt = useCallback(async () => {
    setPromptSeen(true);
    await setReminderPromptSeen(uid);
  }, [uid]);

  const shouldPrompt =
    isNotificationSupported() && permission === "default" && !isEnabled && !promptSeen;

  return { isEnabled, permission, shouldPrompt, enable, disable, dismissPrompt };
};

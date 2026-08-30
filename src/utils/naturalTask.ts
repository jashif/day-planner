import { nextDateForWeekdayISO, todayISO, toISODate } from "./dates";
import type { Friend } from "../hooks/useFriends";
import type { Recurrence } from "../types/task";

const WEEKDAYS: Record<string, number> = {
  sunday: 0,
  monday: 1,
  tuesday: 2,
  wednesday: 3,
  thursday: 4,
  friday: 5,
  saturday: 6,
};

const toTime = (hours: number, minutes = 0, meridiem?: string): string => {
  let nextHours = hours;
  if (meridiem?.toLowerCase() === "pm" && nextHours < 12) nextHours += 12;
  if (meridiem?.toLowerCase() === "am" && nextHours === 12) nextHours = 0;
  return `${String(nextHours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
};

export interface ParsedTaskText {
  title: string;
  date?: string;
  time?: string;
  recurrence?: Recurrence;
  sharedWithUid?: string;
}

export const parseNaturalTaskText = (text: string, friends: Friend[]): ParsedTaskText => {
  let title = text.trim();
  let date: string | undefined;
  let time: string | undefined;
  let recurrence: Recurrence | undefined;
  let sharedWithUid: string | undefined;

  if (/\btomorrow\b/i.test(title)) {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    date = toISODate(tomorrow);
    title = title.replace(/\btomorrow\b/gi, "");
  } else if (/\btoday\b/i.test(title)) {
    date = todayISO();
    title = title.replace(/\btoday\b/gi, "");
  }

  for (const [weekday, index] of Object.entries(WEEKDAYS)) {
    const weeklyPattern = new RegExp(`\\bevery\\s+${weekday}\\b`, "i");
    const dayPattern = new RegExp(`\\b(on\\s+)?${weekday}\\b`, "i");
    if (weeklyPattern.test(title)) {
      recurrence = "weekly";
      date = nextDateForWeekdayISO(index);
      title = title.replace(weeklyPattern, "");
      break;
    }
    if (!date && dayPattern.test(title)) {
      date = nextDateForWeekdayISO(index);
      title = title.replace(dayPattern, "");
      break;
    }
  }

  if (/\b(every day|daily)\b/i.test(title)) {
    recurrence = "daily";
    title = title.replace(/\b(every day|daily)\b/gi, "");
  } else if (/\bweekly\b/i.test(title)) {
    recurrence = "weekly";
    title = title.replace(/\bweekly\b/gi, "");
  } else if (/\bmonthly\b/i.test(title)) {
    recurrence = "monthly";
    title = title.replace(/\bmonthly\b/gi, "");
  }

  const timeMatch = title.match(/\b(?:at\s*)?(\d{1,2})(?::(\d{2}))?\s*(am|pm)\b/i);
  if (timeMatch) {
    time = toTime(Number(timeMatch[1]), Number(timeMatch[2] ?? 0), timeMatch[3]);
    title = title.replace(timeMatch[0], "");
  } else {
    const exactTimeMatch = title.match(/\b(?:at\s*)?(\d{1,2}):(\d{2})\b/i);
    if (exactTimeMatch) {
      time = toTime(Number(exactTimeMatch[1]), Number(exactTimeMatch[2]));
      title = title.replace(exactTimeMatch[0], "");
    }
  }

  for (const friend of friends) {
    const name = friend.displayName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const friendPattern = new RegExp(`\\b(?:share\\s+with|assign\\s+to|with)\\s+${name}\\b`, "i");
    if (friendPattern.test(title)) {
      sharedWithUid = friend.uid;
      title = title.replace(friendPattern, "");
      break;
    }
  }

  title = title
    .replace(/\s+/g, " ")
    .replace(/\s+([,.;:])/g, "$1")
    .trim();
  return { title: title || text.trim(), date, time, recurrence, sharedWithUid };
};

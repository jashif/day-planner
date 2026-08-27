export const toISODate = (d: Date): string => {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

export const todayISO = (): string => toISODate(new Date());

/** Next date (today included) landing on the given weekday, 0 = Sunday … 6 = Saturday. */
export const nextDateForWeekdayISO = (weekday: number, from: Date = new Date()): string => {
  const next = new Date(from);
  next.setDate(next.getDate() + ((weekday - next.getDay() + 7) % 7));
  return toISODate(next);
};

export const nextOccurrenceISO = (
  date: string,
  recurrence: "daily" | "weekly" | "monthly",
): string => {
  const next = new Date(`${date}T12:00:00`);
  if (recurrence === "daily") next.setDate(next.getDate() + 1);
  if (recurrence === "weekly") next.setDate(next.getDate() + 7);
  if (recurrence === "monthly") {
    const day = next.getDate();
    next.setDate(1);
    next.setMonth(next.getMonth() + 1);
    const lastDay = new Date(next.getFullYear(), next.getMonth() + 1, 0).getDate();
    next.setDate(Math.min(day, lastDay));
  }
  return toISODate(next);
};

export const formatHeadingDate = (isoDate: string): string => {
  const [year, month, day] = isoDate.split("-").map(Number);
  const d = new Date(year, month - 1, day);
  return d.toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" });
};

export const formatGroupLabel = (isoDate: string): string => {
  const today = todayISO();
  const tomorrow = toISODate(new Date(Date.now() + 86400000));

  if (isoDate === today) return "Today";
  if (isoDate === tomorrow) return "Tomorrow";

  const [year, month, day] = isoDate.split("-").map(Number);
  const d = new Date(year, month - 1, day);
  return d.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" });
};

export const formatTime = (time24: string | null): string => {
  if (!time24) return "";
  const [hours, minutes] = time24.split(":").map(Number);
  const period = hours >= 12 ? "PM" : "AM";
  const hour12 = hours % 12 === 0 ? 12 : hours % 12;
  return `${hour12}:${String(minutes).padStart(2, "0")} ${period}`;
};

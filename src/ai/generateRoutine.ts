import { getGenerativeModel, Schema } from "firebase/ai";
import { ai } from "../firebase/config";
import type { Priority } from "../types/task";
import type { RoutineRecurrence, RoutineSuggestion } from "../types/routine";

const MAX_SUGGESTIONS = 20;

const routineSchema = Schema.object({
  properties: {
    routines: Schema.array({
      items: Schema.object({
        properties: {
          title: Schema.string({
            description:
              "Short name for the recurring activity, e.g. 'Morning run' or 'Team standup'. No times inside the title.",
          }),
          time: Schema.string({
            description:
              "Start time in 24-hour HH:MM format, or an empty string if no time was mentioned.",
          }),
          recurrence: Schema.string({
            description: "Exactly one of: daily, weekly, monthly.",
          }),
          weekday: Schema.string({
            description:
              "For weekly items, the English day name (monday through sunday). Empty string otherwise.",
          }),
          priority: Schema.string({
            description: "Exactly one of: low, medium, high.",
          }),
        },
      }),
    }),
  },
});

const model = getGenerativeModel(ai, {
  model: "gemini-3.6-flash",
  generationConfig: {
    responseMimeType: "application/json",
    responseSchema: routineSchema,
  },
  systemInstruction:
    "You turn a free-form description of someone's daily life into a set of recurring tasks for their planner. " +
    "Only include activities that genuinely repeat (daily, weekly, or monthly). " +
    "Ignore one-off events, past events, and vague feelings. " +
    "If the person gives a time or a rough time of day, convert it to a 24-hour HH:MM start time " +
    "(morning ~08:00, noon ~12:00, afternoon ~14:00, evening ~18:00, night ~21:00); otherwise leave time empty. " +
    "Use the person's own wording for titles where possible, but keep them short and start with a verb or noun phrase. " +
    "Set priority to high only for things they describe as important or non-negotiable. " +
    "Never invent activities they did not mention. Respond only with the requested JSON.",
});

const WEEKDAYS: Record<string, number> = {
  sunday: 0,
  monday: 1,
  tuesday: 2,
  wednesday: 3,
  thursday: 4,
  friday: 5,
  saturday: 6,
};

const RECURRENCES: RoutineRecurrence[] = ["daily", "weekly", "monthly"];
const PRIORITIES: Priority[] = ["low", "medium", "high"];

const normalizeTime = (raw: unknown): string | null => {
  if (typeof raw !== "string") return null;
  const match = raw.trim().match(/^(\d{1,2}):(\d{2})$/);
  if (!match) return null;
  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  if (hours > 23 || minutes > 59) return null;
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
};

const generateId = (): string =>
  crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(16).slice(2)}`;

interface RawRoutine {
  title?: unknown;
  time?: unknown;
  recurrence?: unknown;
  weekday?: unknown;
  priority?: unknown;
}

const toSuggestion = (raw: RawRoutine): RoutineSuggestion | null => {
  if (typeof raw?.title !== "string") return null;
  const title = raw.title.trim().slice(0, 100);
  if (!title) return null;

  const recurrenceRaw =
    typeof raw.recurrence === "string" ? raw.recurrence.trim().toLowerCase() : "";
  const recurrence = (RECURRENCES as string[]).includes(recurrenceRaw)
    ? (recurrenceRaw as RoutineRecurrence)
    : "daily";

  const priorityRaw = typeof raw.priority === "string" ? raw.priority.trim().toLowerCase() : "";
  const priority = (PRIORITIES as string[]).includes(priorityRaw)
    ? (priorityRaw as Priority)
    : "medium";

  const weekdayRaw = typeof raw.weekday === "string" ? raw.weekday.trim().toLowerCase() : "";
  const weekday = recurrence === "weekly" ? (WEEKDAYS[weekdayRaw] ?? null) : null;

  return {
    id: generateId(),
    title,
    time: normalizeTime(raw.time),
    recurrence,
    weekday,
    priority,
    selected: true,
  };
};

/** Asks Gemini to turn a spoken/typed description of the user's routine into recurring task suggestions. */
export const generateRoutine = async (description: string): Promise<RoutineSuggestion[]> => {
  const prompt =
    `Here is how this person describes their daily life:\n\n"""${description.trim()}"""\n\n` +
    "Extract their recurring activities as planner tasks.";
  const result = await model.generateContent(prompt);
  const parsed = JSON.parse(result.response.text()) as { routines?: unknown };
  if (!Array.isArray(parsed.routines)) return [];

  const seen = new Set<string>();
  const suggestions: RoutineSuggestion[] = [];
  for (const raw of parsed.routines) {
    const suggestion = toSuggestion(raw as RawRoutine);
    if (!suggestion) continue;
    const key = `${suggestion.title.toLowerCase()}|${suggestion.time ?? ""}`;
    if (seen.has(key)) continue;
    seen.add(key);
    suggestions.push(suggestion);
    if (suggestions.length >= MAX_SUGGESTIONS) break;
  }
  return suggestions;
};

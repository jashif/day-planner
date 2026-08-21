import { getGenerativeModel, Schema } from "firebase/ai";
import { ai } from "../firebase/config";
import type { NewTaskInput, Priority } from "../types/task";

const voiceTaskSchema = Schema.object({
  properties: {
    title: Schema.string({
      description:
        "The corrected, cleaned-up task title. Fix transcription errors and filler words.",
    }),
    date: Schema.string({
      description:
        "The task's date as YYYY-MM-DD, resolved from any relative reference (e.g. 'tomorrow').",
      nullable: true,
    }),
    time: Schema.string({
      description: "The task's time as 24-hour HH:mm, if one was mentioned.",
      nullable: true,
    }),
    priority: Schema.enumString({
      enum: ["low", "medium", "high"],
      description: "Priority, only if clearly implied (e.g. 'urgent' = high). Otherwise null.",
      nullable: true,
    }),
  },
});

const model = getGenerativeModel(ai, {
  model: "gemini-3.6-flash",
  generationConfig: {
    responseMimeType: "application/json",
    responseSchema: voiceTaskSchema,
  },
  systemInstruction:
    "You turn a spoken, possibly messy voice transcript into a single clean task. " +
    "Correct obvious speech-to-text errors and remove filler words like 'um' or 'add a task to'. " +
    "Resolve relative dates (today/tomorrow/next Friday) using the given reference date. " +
    "Only set time or priority if they were actually mentioned; otherwise use null. " +
    "Respond only with the requested JSON.",
});

export interface VoiceTaskResult {
  title: string;
  date: string | null;
  time: string | null;
  priority: Priority | null;
}

export const parseVoiceTask = async (
  transcript: string,
  referenceDate: string,
): Promise<VoiceTaskResult> => {
  const prompt = `Reference date (today): ${referenceDate}\nTranscript: "${transcript}"`;
  const result = await model.generateContent(prompt);
  const parsed = JSON.parse(result.response.text()) as Partial<VoiceTaskResult>;
  return {
    title:
      typeof parsed.title === "string" && parsed.title.trim() ? parsed.title.trim() : transcript,
    date: parsed.date ?? null,
    time: parsed.time ?? null,
    priority: parsed.priority ?? null,
  };
};

export const toNewTaskInput = (result: VoiceTaskResult, fallbackDate: string): NewTaskInput => ({
  title: result.title,
  date: result.date ?? fallbackDate,
  time: result.time ?? "",
  priority: result.priority ?? "medium",
});

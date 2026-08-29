import { getAiInstance } from "../firebase/config";
import type { BreakdownDetail } from "../types/task";

const DETAIL_INSTRUCTIONS: Record<BreakdownDetail, string> = {
  quick: "Break it into 3-4 broad steps.",
  normal: "Break it into 5-7 clear, concrete steps.",
  thorough: "Break it into 8-12 very small, granular steps, including easy-to-miss prep steps.",
};

let modelPromise: ReturnType<typeof buildModel> | null = null;

const buildModel = async () => {
  const [{ getGenerativeModel, Schema }, ai] = await Promise.all([
    import("firebase/ai"),
    getAiInstance(),
  ]);

  const breakdownSchema = Schema.object({
    properties: {
      steps: Schema.array({
        items: Schema.string({
          description:
            "A single, concrete, actionable substep. Short imperative phrase, no numbering.",
        }),
      }),
    },
  });

  return getGenerativeModel(ai, {
    model: "gemini-3.6-flash",
    generationConfig: {
      responseMimeType: "application/json",
      responseSchema: breakdownSchema,
    },
    systemInstruction:
      "You help people who feel stuck on a task by breaking it into small, doable steps. " +
      "Steps must be concrete and actionable (start with a verb), in the order they should be done. " +
      "Never include the original task itself as a step. Respond only with the requested JSON.",
  });
};

const getModel = () => {
  if (!modelPromise) modelPromise = buildModel();
  return modelPromise;
};

export const breakdownTask = async (title: string, detail: BreakdownDetail): Promise<string[]> => {
  const prompt = `Task: "${title}"\n\n${DETAIL_INSTRUCTIONS[detail]}`;
  const model = await getModel();
  const result = await model.generateContent(prompt);
  const text = result.response.text();
  const parsed = JSON.parse(text) as { steps?: unknown };
  if (!Array.isArray(parsed.steps)) return [];
  return parsed.steps.filter((s): s is string => typeof s === "string" && s.trim().length > 0);
};

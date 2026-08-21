import { getGenerativeModel, Schema } from 'firebase/ai'
import { ai } from '../firebase/config'
import type { BreakdownDetail } from '../types/task'

const breakdownSchema = Schema.object({
  properties: {
    steps: Schema.array({
      items: Schema.string({
        description: 'A single, concrete, actionable substep. Short imperative phrase, no numbering.'
      })
    })
  }
})

const DETAIL_INSTRUCTIONS: Record<BreakdownDetail, string> = {
  quick: 'Break it into 3-4 broad steps.',
  normal: 'Break it into 5-7 clear, concrete steps.',
  thorough: 'Break it into 8-12 very small, granular steps, including easy-to-miss prep steps.'
}

const model = getGenerativeModel(ai, {
  model: 'gemini-2.5-flash',
  generationConfig: {
    responseMimeType: 'application/json',
    responseSchema: breakdownSchema
  },
  systemInstruction:
    'You help people who feel stuck on a task by breaking it into small, doable steps. ' +
    'Steps must be concrete and actionable (start with a verb), in the order they should be done. ' +
    'Never include the original task itself as a step. Respond only with the requested JSON.'
})

export const breakdownTask = async (title: string, detail: BreakdownDetail): Promise<string[]> => {
  const prompt = `Task: "${title}"\n\n${DETAIL_INSTRUCTIONS[detail]}`
  const result = await model.generateContent(prompt)
  const text = result.response.text()
  const parsed = JSON.parse(text) as { steps?: unknown }
  if (!Array.isArray(parsed.steps)) return []
  return parsed.steps.filter((s): s is string => typeof s === 'string' && s.trim().length > 0)
}

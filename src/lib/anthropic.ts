import Anthropic from '@anthropic-ai/sdk'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export type DailyLogParsed = {
  calories_in?: number | null
  protein_g?: number | null
  steps?: number | null
  weight_kg?: number | null
  workout_type?: string | null
  notes?: string | null
}

export async function parseDailyLogEntry(text: string): Promise<DailyLogParsed> {
  if (!process.env.ANTHROPIC_API_KEY) {
    throw new Error('Missing ANTHROPIC_API_KEY environment variable')
  }

  const prompt = `Extract the user's daily health log from the plain English entry below. Return valid JSON only with these keys: calories_in, protein_g, steps, weight_kg, workout_type, notes. Use numbers when possible and null for any missing value. Do not include any extra text.

User entry:\n${text}`

  const response = await anthropic.messages.create({
    model: 'claude-3.5-mini',
    max_tokens: 300,
    messages: [
      {
        role: 'user',
        content: prompt,
      },
    ],
  })

  const content = Array.isArray(response.content)
    ? response.content
        .map((block) =>
          typeof block === 'string'
            ? block
            : block.type === 'text'
            ? block.text
            : ''
        )
        .join('')
    : String(response.content ?? '')

  const jsonMatch = content.match(/\{[\s\S]*\}$/)

  if (!jsonMatch) {
    return { notes: text }
  }

  try {
    const parsed = JSON.parse(jsonMatch[0]) as DailyLogParsed
    return {
      calories_in: parsed.calories_in ?? null,
      protein_g: parsed.protein_g ?? null,
      steps: parsed.steps ?? null,
      weight_kg: parsed.weight_kg ?? null,
      workout_type: parsed.workout_type ?? null,
      notes: parsed.notes ?? null,
    }
  } catch {
    return { notes: text }
  }
}

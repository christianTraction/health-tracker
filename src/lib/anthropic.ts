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

  const prompt = `Extract health data from this daily log entry. You MUST respond with ONLY valid JSON, nothing else.

Required JSON format (use null for missing values):
{
  "calories_in": <number or null>,
  "protein_g": <number or null>,
  "steps": <number or null>,
  "weight_kg": <number or null>,
  "workout_type": <string or null>,
  "notes": <string or null>
}

User entry: ${text}`

  const response = await anthropic.messages.create({
    model: 'claude-haiku-4-5-20251001',
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

  const jsonMatch = content.match(/\{[\s\S]*\}/)

  if (!jsonMatch) {
    console.warn('[parseDailyLogEntry] No JSON found in response:', content)
    return { notes: text }
  }

  try {
    const raw = JSON.parse(jsonMatch[0]) as Record<string, unknown>
    return {
      calories_in: typeof raw.calories_in === 'number' ? raw.calories_in : null,
      protein_g: typeof raw.protein_g === 'number' ? raw.protein_g : null,
      steps: typeof raw.steps === 'number' ? raw.steps : null,
      weight_kg: typeof raw.weight_kg === 'number' ? raw.weight_kg : null,
      workout_type: typeof raw.workout_type === 'string' ? raw.workout_type : null,
      notes: typeof raw.notes === 'string' ? raw.notes : null,
    }
  } catch (err) {
    console.warn('[parseDailyLogEntry] Failed to parse JSON:', jsonMatch[0], err)
    return { notes: text }
  }
}

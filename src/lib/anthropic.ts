import Anthropic from '@anthropic-ai/sdk'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export type DailyLogParsed = {
  calories?: number | null
  protein_g?: number | null
  steps?: number | null
  weight_lbs?: number | null
  training_type?: string | null
  notes?: string | null
}

function parseNumber(value: unknown): number | null {
  if (typeof value === 'number') return value
  if (typeof value === 'string' && value.trim() !== '' && !Number.isNaN(Number(value))) {
    return Number(value)
  }
  return null
}

export async function parseDailyLogEntry(text: string): Promise<DailyLogParsed> {
  if (!process.env.ANTHROPIC_API_KEY) {
    throw new Error('Missing ANTHROPIC_API_KEY environment variable')
  }

  const prompt = `Extract health data from this daily log entry. You MUST respond with ONLY valid JSON, nothing else.

Required JSON format (use null for missing values):
{
  "calories": <number or null>,
  "protein_g": <number or null>,
  "steps": <number or null>,
  "weight_lbs": <number or null>,
  "training_type": <string or null>,
  "notes": <string or null>
}

If the entry contains weight in kilograms, convert it to pounds and return weight_lbs.

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
      calories: parseNumber(raw.calories),
      protein_g: parseNumber(raw.protein_g),
      steps: parseNumber(raw.steps),
      weight_lbs: parseNumber(raw.weight_lbs),
      training_type: typeof raw.training_type === 'string' ? raw.training_type : null,
      notes: typeof raw.notes === 'string' ? raw.notes : null,
    }
  } catch (err) {
    console.warn('[parseDailyLogEntry] Failed to parse JSON:', jsonMatch[0], err)
    return { notes: text }
  }
}

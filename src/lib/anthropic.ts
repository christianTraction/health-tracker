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

type ReceiptItem = {
  description: string
  price: number | null
}

type ReceiptParseResult = {
  store_name?: string | null
  date?: string | null
  total_amount?: number | null
  items?: ReceiptItem[] | null
  meal_cost_estimate?: number | null
}

function parseReceiptItems(value: unknown): ReceiptItem[] | null {
  if (!Array.isArray(value)) {
    return null
  }

  const items = value
    .filter((item) => typeof item === 'object' && item !== null)
    .map((item) => {
      const record = item as Record<string, unknown>
      return {
        description:
          typeof record.description === 'string'
            ? record.description.trim()
            : typeof record.name === 'string'
            ? record.name.trim()
            : '',
        price: parseNumber(record.price ?? record.amount ?? record.total),
      }
    })
    .filter((item) => item.description !== '' || item.price !== null)

  return items.length > 0 ? items : null
}

function computeMealCostEstimate(items: ReceiptItem[] | null): number | null {
  if (!items || items.length === 0) {
    return null
  }

  const pricedItems = items.filter((item) => typeof item.price === 'number')
  if (pricedItems.length === 0) {
    return null
  }

  const total = pricedItems.reduce((sum, item) => sum + (item.price ?? 0), 0)
  return Number((total / pricedItems.length).toFixed(2))
}

export async function parseReceiptDocument(file: File): Promise<ReceiptParseResult> {
  if (!process.env.ANTHROPIC_API_KEY) {
    throw new Error('Missing ANTHROPIC_API_KEY environment variable')
  }

  // Validate file type - only accept image formats supported by Anthropic API
  const acceptedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
  if (!acceptedTypes.includes(file.type)) {
    throw new Error('Please upload an image file (JPEG, PNG, GIF, or WebP). PDFs are not supported.')
  }

  const arrayBuffer = await file.arrayBuffer()
  const buffer = Buffer.from(arrayBuffer)
  const base64 = buffer.toString('base64')

  const content = [
    {
      type: 'text',
      text: `Parse the attached receipt and return only valid JSON with the following shape:\n{\n  "store_name": <string or null>,\n  "date": <ISO date string or null>,\n  "total_amount": <number or null>,\n  "items": <array of {"description": string, "price": number or null} or null>\n}`,
    },
    {
      type: 'image',
      source: {
        type: 'base64',
        media_type: file.type,
        data: base64,
      },
    },
  ] as any

  const response = await anthropic.beta.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 700,
    messages: [
      {
        role: 'user',
        content,
      },
    ],
  })

  const responseContent = Array.isArray(response.content)
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

  const jsonMatch = responseContent.match(/\{[\s\S]*\}/)
  if (!jsonMatch) {
    console.warn('[parseReceiptDocument] No JSON found in response:', responseContent)
    return { meal_cost_estimate: null }
  }

  try {
    const raw = JSON.parse(jsonMatch[0]) as Record<string, unknown>
    const items = parseReceiptItems(raw.items)
    const totalAmount = parseNumber(raw.total_amount)
    const storeName =
      typeof raw.store_name === 'string'
        ? raw.store_name.trim()
        : typeof raw.store === 'string'
        ? raw.store.trim()
        : null

    return {
      store_name: storeName ?? null,
      date: typeof raw.date === 'string' ? raw.date.trim() : null,
      total_amount: totalAmount,
      items,
      meal_cost_estimate: computeMealCostEstimate(items),
    }
  } catch (err) {
    console.warn('[parseReceiptDocument] Failed to parse receipt JSON:', jsonMatch[0], err)
    return { meal_cost_estimate: null }
  }
}

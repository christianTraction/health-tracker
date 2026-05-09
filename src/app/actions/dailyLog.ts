'use server'

import { createClient } from '@/lib/supabase/server'
import { parseDailyLogEntry } from '@/lib/anthropic'

export async function logDailyEntry(
  _prevState: { error?: string } | undefined,
  formData: FormData
) {
  const entry = (formData.get('entry') as string | null)?.trim()
  if (!entry) {
    return { error: 'Please enter something to log.' }
  }

  let parsed
  try {
    parsed = await parseDailyLogEntry(entry)
  } catch (error) {
    return {
      error:
        error instanceof Error
          ? error.message
          : 'Failed to parse your daily log entry.',
    }
  }

  const supabase = await createClient()
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError || !user) {
    return { error: 'Unable to identify the current user. Please sign in again.' }
  }

  const today = new Date().toISOString().slice(0, 10)

  const values = {
    user_id: user.id,
    date: today,
    calories_in: parsed.calories_in,
    protein_g: parsed.protein_g,
    steps: parsed.steps,
    weight_kg: parsed.weight_kg,
    workout_type: parsed.workout_type ? parsed.workout_type.trim() : null,
    notes: parsed.notes ? parsed.notes.trim() : entry,
  }

  const { data, error } = await supabase
    .from('daily_logs')
    .upsert(values, { onConflict: 'user_id,date' })
    .select('*')
    .single()

  if (error) {
    return { error: error.message }
  }

  return { dailyLog: data }
}

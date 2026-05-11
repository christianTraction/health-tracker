'use server'

import { createClient } from '@/lib/supabase/server'
import { parseReceiptDocument } from '@/lib/anthropic'

export async function uploadReceipt(
  _prevState: { error?: string } | undefined,
  formData: FormData
) {
  const file = formData.get('receipt')
  if (!(file instanceof File)) {
    return { error: 'Please upload a receipt image (JPEG, PNG, GIF, or WebP).' }
  }

  let parsed
  try {
    parsed = await parseReceiptDocument(file)
  } catch (error) {
    return {
      error:
        error instanceof Error
          ? error.message
          : 'Failed to parse the receipt. Please try again.',
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
    date: parsed.date ?? today,
    store_name: parsed.store_name ?? null,
    total_amount: parsed.total_amount,
    items: parsed.items ?? null,
    meal_cost_estimate: parsed.meal_cost_estimate,
  }

  const { data, error } = await supabase
    .from('receipts')
    .insert(values)
    .select('*')
    .single()

  if (error) {
    return { error: error.message }
  }

  return { receipt: data }
}

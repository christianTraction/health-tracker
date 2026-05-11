import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import ReceiptsClient from './ReceiptsClient'

export default async function ReceiptsPage() {
  const supabase = await createClient()
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    redirect('/login')
  }

  const { data: receipts } = await supabase
    .from('receipts')
    .select('id,date,store_name,total_amount,items,meal_cost_estimate')
    .order('created_at', { ascending: false })
    .limit(10)

  return <ReceiptsClient receipts={receipts ?? []} />
}

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import DashboardClient from './DashboardClient'

export default async function DashboardPage() {
  const supabase = await createClient()
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    redirect('/login')
  }

  const today = new Date().toISOString().slice(0, 10)
  const { data: dailyLog } = await supabase
    .from('daily_logs')
    .select('calories_in,protein_g,steps,weight_kg,workout_type,notes')
    .eq('date', today)
    .single()

  return <DashboardClient initialLog={dailyLog} />
}

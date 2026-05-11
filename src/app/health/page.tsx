import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import HealthClient from './HealthClient'

export default async function HealthPage() {
  const supabase = await createClient()
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error || !user) {
    redirect('/login')
  }

  return <HealthClient />
}

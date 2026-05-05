'use server'

import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export async function login(
  _prevState: { error?: string } | undefined,
  formData: FormData
) {
  const supabase = await createClient()

  const { error } = await supabase.auth.signInWithPassword({
    email: formData.get('email') as string,
    password: formData.get('password') as string,
  })

  if (error) {
    return { error: error.message }
  }

  redirect('/')
}

export async function signup(
  _prevState: { error?: string } | undefined,
  formData: FormData
) {
  const supabase = await createClient()

  const origin = (await headers()).get('origin')

  const { error } = await supabase.auth.signUp({
    email: formData.get('email') as string,
    password: formData.get('password') as string,
    options: {
      emailRedirectTo: `${origin}/auth/callback`,
      data: { full_name: formData.get('full_name') as string },
    },
  })

  if (error) {
    console.error('[signup] status:', error.status, '| code:', error.code, '| message:', error.message, '| details:', JSON.stringify(error))
    return { error: error.message }
  }

  redirect('/')
}

export async function logout() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/login')
}

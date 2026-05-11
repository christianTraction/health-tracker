'use server'

import { createClient } from '@/lib/supabase/server'

export type BodyScanInput = {
  date: string
  weight: number | null
  bodyFatPct: number | null
  fatMass: number | null
  leanMass: number | null
  boneMass: number | null
  vatMass: number | null
  rmrCalories: number | null
}

export type LabResultInput = {
  date: string
  hba1c: number | null
  glucose: number | null
  ldl: number | null
  hdl: number | null
  totalChol: number | null
  triglycerides: number | null
  systolicBp: number | null
  diastolicBp: number | null
}

export async function saveBodyScan(bodyScan: BodyScanInput) {
  const supabase = await createClient()
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError || !user) {
    return { error: 'Unable to identify the current user. Please sign in again.' }
  }

  const values = {
    user_id: user.id,
    scanned_at: new Date(bodyScan.date).toISOString(),
    body_fat_pct: bodyScan.bodyFatPct,
    fat_mass_kg: bodyScan.fatMass,
    lean_mass_kg: bodyScan.leanMass,
    bone_mass_kg: bodyScan.boneMass,
    visceral_fat: bodyScan.vatMass,
    method: 'dexa',
  }

  const { data, error } = await supabase
    .from('body_scans')
    .insert(values)
    .select('*')
    .single()

  if (error) {
    return { error: error.message }
  }

  return { bodyScan: data }
}

export async function saveLabResult(labResult: LabResultInput) {
  const supabase = await createClient()
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError || !user) {
    return { error: 'Unable to identify the current user. Please sign in again.' }
  }

  const values = {
    user_id: user.id,
    tested_at: labResult.date,
    hba1c: labResult.hba1c,
    glucose: labResult.glucose,
    ldl: labResult.ldl,
    hdl: labResult.hdl,
    total_chol: labResult.totalChol,
    triglycerides: labResult.triglycerides,
    panel_name: 'Manual Entry',
  }

  const { data, error } = await supabase
    .from('lab_results')
    .insert(values)
    .select('*')
    .single()

  if (error) {
    return { error: error.message }
  }

  return { labResult: data }
}

export async function getBodyScans() {
  const supabase = await createClient()
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError || !user) {
    return { error: 'Unable to identify the current user. Please sign in again.' }
  }

  const { data, error } = await supabase
    .from('body_scans')
    .select('*')
    .eq('user_id', user.id)
    .eq('method', 'dexa')
    .order('scanned_at', { ascending: false })

  if (error) {
    return { error: error.message }
  }

  return { bodyScans: data }
}

export async function getLabResults() {
  const supabase = await createClient()
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError || !user) {
    return { error: 'Unable to identify the current user. Please sign in again.' }
  }

  const { data, error } = await supabase
    .from('lab_results')
    .select('*')
    .eq('user_id', user.id)
    .order('tested_at', { ascending: false })

  if (error) {
    return { error: error.message }
  }

  return { labResults: data }
}

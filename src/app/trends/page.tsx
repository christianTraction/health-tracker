import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import TrendsClient from './TrendsClient'

type DailyLogRow = {
  date: string
  calories: number | null
  protein_g: number | null
  steps: number | null
  weight_lbs: number | null
}

type ScanRow = {
  scanned_at: string
  body_fat_pct: number | null
}

type TrendPoint = {
  label: string
  value: number | null
}

function getDaysAgo(dateString: string) {
  const today = new Date()
  const date = new Date(`${dateString}T00:00:00Z`)
  const utcToday = Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate())
  const utcDate = Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate())
  return Math.round((utcToday - utcDate) / 86400000)
}

function buildWeeklyAverages(rows: DailyLogRow[], field: keyof DailyLogRow): TrendPoint[] {
  const buckets: { label: string; minDays: number; maxDays: number; sum: number; count: number }[] = [
    { label: '4w ago', minDays: 22, maxDays: 29, sum: 0, count: 0 },
    { label: '3w ago', minDays: 15, maxDays: 21, sum: 0, count: 0 },
    { label: '2w ago', minDays: 8, maxDays: 14, sum: 0, count: 0 },
    { label: 'This week', minDays: 0, maxDays: 7, sum: 0, count: 0 },
  ]

  rows.forEach((row) => {
    const daysAgo = getDaysAgo(row.date)
    if (daysAgo < 0 || daysAgo > 29) return
    const bucket = buckets.find((bucket) => daysAgo >= bucket.minDays && daysAgo <= bucket.maxDays)
    const value = row[field]
    if (bucket && typeof value === 'number') {
      bucket.sum += value
      bucket.count += 1
    }
  })

  return buckets.map((bucket) => ({
    label: bucket.label,
    value: bucket.count ? Math.round((bucket.sum / bucket.count) * 10) / 10 : null,
  }))
}

function formatScanPoints(rows: ScanRow[]) {
  return rows.map((row) => ({
    date: new Date(row.scanned_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    body_fat_pct: row.body_fat_pct,
  }))
}

export default async function TrendsPage() {
  const supabase = await createClient()
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    redirect('/login')
  }

  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 29)

  const [{ data: dailyLogData }, { data: scanData }] = await Promise.all([
    supabase
      .from('daily_logs')
      .select('date,calories,protein_g,steps,weight_lbs')
      .gte('date', thirtyDaysAgo.toISOString().slice(0, 10))
      .order('date', { ascending: true }),
    supabase
      .from('body_scans')
      .select('scanned_at,body_fat_pct')
      .gte('scanned_at', thirtyDaysAgo.toISOString())
      .order('scanned_at', { ascending: true }),
  ])

  const dailyLogs = (dailyLogData ?? []) as DailyLogRow[]
  const bodyScans = (scanData ?? []) as ScanRow[]

  const calories = buildWeeklyAverages(dailyLogs, 'calories')
  const protein = buildWeeklyAverages(dailyLogs, 'protein_g')
  const steps = buildWeeklyAverages(dailyLogs, 'steps')
  const weight = buildWeeklyAverages(dailyLogs, 'weight_lbs')
  const bodyFat = formatScanPoints(bodyScans)

  return <TrendsClient calories={calories} protein={protein} steps={steps} weight={weight} bodyFat={bodyFat} />
}

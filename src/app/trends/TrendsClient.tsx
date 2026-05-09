'use client'

type TrendPoint = {
  label: string
  value: number | null
}

type ScanPoint = {
  date: string
  body_fat_pct: number | null
}

function formatNumber(value: number | null, unit?: string) {
  if (value == null) return '—'
  return unit ? `${value}${unit}` : `${value}`
}

function getDelta(points: TrendPoint[]) {
  const values = points.filter((point) => point.value != null).map((point) => point.value as number)
  if (values.length < 2) return null
  const last = values[values.length - 1]
  const previous = values[values.length - 2]
  const diff = last - previous
  return { value: Math.abs(parseFloat(diff.toFixed(1))), positive: diff >= 0 }
}

function TrendChart({
  title,
  points,
  unit,
}: {
  title: string
  points: TrendPoint[]
  unit?: string
}) {
  const values = points.map((point) => point.value ?? 0)
  const validValues = values.filter((value) => value !== 0)
  const max = Math.max(...validValues, 1)
  const min = Math.min(...validValues, 0)
  const range = max - min || 1
  const width = 320
  const height = 140
  const padding = 28
  const step = points.length > 1 ? (width - padding * 2) / (points.length - 1) : 0

  const path = points
    .map((point, index) => {
      const x = padding + index * step
      const value = point.value ?? min
      const y = height - padding - ((value - min) / range) * (height - padding * 2)
      return `${index === 0 ? 'M' : 'L'} ${x} ${y}`
    })
    .join(' ')

  const delta = getDelta(points)
  const latestValue = points.filter((point) => point.value != null).slice(-1)[0]?.value ?? null

  return (
    <div className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-700 dark:bg-zinc-950">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="text-sm font-semibold uppercase tracking-[0.24em] text-zinc-500 dark:text-zinc-400">{title}</h3>
          <p className="mt-3 text-3xl font-semibold text-zinc-950 dark:text-zinc-50">{formatNumber(latestValue, unit)}</p>
        </div>
        <div className="text-right text-sm text-zinc-500 dark:text-zinc-400">
          {delta ? (
            <span className={delta.positive ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}>
              {delta.positive ? '+' : '-'}{delta.value}{unit ?? ''}
            </span>
          ) : (
            'No trend data'
          )}
        </div>
      </div>

      <div className="mt-6 overflow-hidden rounded-3xl bg-zinc-50 p-4 dark:bg-zinc-900">
        <svg viewBox={`0 0 ${width} ${height}`} className="block w-full">
          <path d={path} fill="none" stroke="#111827" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
          {points.map((point, index) => {
            const x = padding + index * step
            const value = point.value ?? min
            const y = height - padding - ((value - min) / range) * (height - padding * 2)
            return (
              <circle key={point.label} cx={x} cy={y} r="4" fill="#111827" />
            )
          })}
          {points.map((point, index) => {
            const x = padding + index * step
            return (
              <text key={`${point.label}-label`} x={x} y={height - 6} textAnchor="middle" fontSize="10" fill="#6b7280">
                {point.label}
              </text>
            )
          })}
        </svg>
      </div>
    </div>
  )
}

export default function TrendsClient({
  calories,
  protein,
  steps,
  weight,
  bodyFat,
}: {
  calories: TrendPoint[]
  protein: TrendPoint[]
  steps: TrendPoint[]
  weight: TrendPoint[]
  bodyFat: ScanPoint[]
}) {
  const latestScan = bodyFat.length ? bodyFat[bodyFat.length - 1] : null
  const firstScan = bodyFat.length ? bodyFat[0] : null
  const target = 15
  const currentFat = latestScan?.body_fat_pct ?? null
  const change =
    latestScan && firstScan && latestScan.body_fat_pct != null && firstScan.body_fat_pct != null
      ? parseFloat((latestScan.body_fat_pct - firstScan.body_fat_pct).toFixed(1))
      : null
  const progress = currentFat != null ? Math.max(0, Math.min(100, ((30 - currentFat) / 15) * 100)) : 0

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-zinc-500 dark:text-zinc-400">Trends</p>
          <h1 className="mt-3 text-4xl font-semibold tracking-tight text-zinc-950 dark:text-zinc-50">30-day progress</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-600 dark:text-zinc-400">
            Weekly averages for calories, protein, steps, and weight, plus body composition progress toward a 15% body fat goal.
          </p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.3fr_0.7fr]">
        <div className="grid gap-6 md:grid-cols-2">
          <TrendChart title="Calories" points={calories} unit=" kcal" />
          <TrendChart title="Protein" points={protein} unit=" g" />
          <TrendChart title="Steps" points={steps} />
          <TrendChart title="Weight" points={weight} unit=" lbs" />
        </div>

        <div className="space-y-6">
          <div className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-700 dark:bg-zinc-950">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.3em] text-zinc-500 dark:text-zinc-400">Body fat goal</p>
                <h2 className="mt-3 text-3xl font-semibold text-zinc-950 dark:text-zinc-50">15%</h2>
              </div>
              <div className="rounded-full bg-zinc-100 px-3 py-1.5 text-sm font-semibold text-zinc-700 dark:bg-zinc-900 dark:text-zinc-200">
                {bodyFat.length} scans
              </div>
            </div>

            <div className="mt-6 space-y-4">
              <div className="rounded-3xl bg-zinc-50 p-4 text-sm text-zinc-700 dark:bg-zinc-900 dark:text-zinc-300">
                <p className="text-xs uppercase tracking-[0.28em] text-zinc-500 dark:text-zinc-400">Current body fat</p>
                <p className="mt-2 text-3xl font-semibold text-zinc-950 dark:text-zinc-50">{currentFat != null ? `${currentFat}%` : 'No scan yet'}</p>
                {currentFat != null && (
                  <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
                    {change != null ? `Change: ${change > 0 ? '+' : ''}${change}% since first scan` : 'Tracking progress over time.'}
                  </p>
                )}
              </div>

              <div>
                <div className="mb-3 flex items-center justify-between text-sm text-zinc-600 dark:text-zinc-400">
                  <span>Progress to target</span>
                  <span>{currentFat != null ? `${Math.round(progress)}%` : '—'}</span>
                </div>
                <div className="h-3 overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-800">
                  <div
                    className="h-full rounded-full bg-emerald-600 transition-all duration-200"
                    style={{ width: `${currentFat != null ? progress : 0}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-700 dark:bg-zinc-950">
            <h3 className="text-sm font-semibold uppercase tracking-[0.24em] text-zinc-500 dark:text-zinc-400">Body fat trend</h3>
            {bodyFat.length ? (
              <div className="mt-6 space-y-3">
                <div className="rounded-3xl bg-zinc-50 p-4 dark:bg-zinc-900">
                  <svg viewBox="0 0 320 140" className="block w-full">
                    {(() => {
                      const values = bodyFat.map((point) => point.body_fat_pct ?? 0)
                      const min = Math.min(...values, 1)
                      const max = Math.max(...values, 30)
                      const range = max - min || 1
                      const width = 320
                      const height = 140
                      const padding = 28
                      const step = bodyFat.length > 1 ? (width - padding * 2) / (bodyFat.length - 1) : 0
                      const path = bodyFat
                        .map((point, index) => {
                          const x = padding + index * step
                          const y = height - padding - (((point.body_fat_pct ?? min) - min) / range) * (height - padding * 2)
                          return `${index === 0 ? 'M' : 'L'} ${x} ${y}`
                        })
                        .join(' ')
                      return (
                        <>
                          <path d={path} fill="none" stroke="#111827" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                          {bodyFat.map((point, index) => {
                            const x = padding + index * step
                            const y = height - padding - (((point.body_fat_pct ?? min) - min) / range) * (height - padding * 2)
                            return <circle key={point.date} cx={x} cy={y} r="3.5" fill="#111827" />
                          })}
                        </>
                      )
                    })()}
                  </svg>
                </div>
                <div className="grid grid-cols-2 gap-3 text-sm text-zinc-600 dark:text-zinc-400">
                  <div>
                    <p className="font-semibold text-zinc-950 dark:text-zinc-50">First scan</p>
                    <p>{firstScan?.date ?? '—'}</p>
                  </div>
                  <div>
                    <p className="font-semibold text-zinc-950 dark:text-zinc-50">Latest scan</p>
                    <p>{latestScan?.date ?? '—'}</p>
                  </div>
                </div>
              </div>
            ) : (
              <p className="mt-4 text-sm text-zinc-600 dark:text-zinc-400">Add a body scan to start tracking body fat progress.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

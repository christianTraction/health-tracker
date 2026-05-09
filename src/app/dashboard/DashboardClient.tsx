'use client'

import { useEffect, useState } from 'react'
import { useActionState } from 'react'
import { logDailyEntry } from '@/app/actions/dailyLog'

type DailyLog = {
  calories?: number | null
  protein_g?: number | null
  steps?: number | null
  weight_lbs?: number | null
  training_type?: string | null
  notes?: string | null
}

export default function DashboardClient({ initialLog }: { initialLog: DailyLog | null }) {
  const [log, setLog] = useState<DailyLog | null>(initialLog)
  const [state, action, pending] = useActionState(logDailyEntry, undefined)

  useEffect(() => {
    if (state?.dailyLog) {
      setLog(state.dailyLog)
    }
  }, [state])

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="rounded-3xl border border-zinc-200 bg-white/90 p-8 shadow-sm backdrop-blur dark:border-zinc-700 dark:bg-zinc-950/80">
        <h1 className="text-3xl font-semibold text-zinc-950 dark:text-zinc-50">Daily Log</h1>
        <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
          Log your day in plain English and we&apos;ll turn it into structured health data.
        </p>

        <form action={action} className="mt-8 space-y-4">
          <label className="block text-sm font-medium text-zinc-900 dark:text-zinc-100" htmlFor="entry">
            What happened today?
          </label>
          <textarea
            id="entry"
            name="entry"
            rows={5}
            placeholder="e.g. I ate 2,100 calories with 120g protein, walked 9,500 steps, weighed 72.5 kg, and did a strength workout."
            className="w-full rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm text-zinc-950 outline-none transition focus:border-zinc-900 focus:ring-2 focus:ring-zinc-900/10 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50 dark:focus:border-zinc-100 dark:focus:ring-zinc-100/20"
            required
          />

          {state?.error && (
            <p className="rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-700 dark:bg-red-950/30 dark:text-red-300">
              {state.error}
            </p>
          )}

          <button
            type="submit"
            disabled={pending}
            className="inline-flex items-center justify-center rounded-full bg-zinc-950 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-zinc-50 dark:text-zinc-950 dark:hover:bg-zinc-200"
          >
            {pending ? 'Logging…' : 'Log my day'}
          </button>
        </form>

        <div className="mt-10 grid gap-4 sm:grid-cols-2">
          {[
            { label: 'Calories', value: log?.calories ?? '—' },
            { label: 'Protein', value: log?.protein_g ? `${log.protein_g} g` : '—' },
            { label: 'Steps', value: log?.steps ?? '—' },
            { label: 'Weight', value: log?.weight_lbs ? `${log.weight_lbs} lbs` : '—' },
            { label: 'Training', value: log?.training_type ?? '—' },
          ].map((item) => (
            <div key={item.label} className="rounded-3xl border border-zinc-200 bg-zinc-50 p-5 dark:border-zinc-700 dark:bg-zinc-900">
              <p className="text-sm uppercase tracking-[0.16em] text-zinc-500 dark:text-zinc-400">{item.label}</p>
              <p className="mt-3 text-2xl font-semibold text-zinc-950 dark:text-zinc-50">{item.value}</p>
            </div>
          ))}
        </div>

        <div className="mt-6 rounded-3xl border border-zinc-200 bg-zinc-50 p-5 dark:border-zinc-700 dark:bg-zinc-900">
          <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Notes</h2>
          <p className="mt-3 text-sm leading-7 text-zinc-600 dark:text-zinc-300">{log?.notes ?? 'No notes yet.'}</p>
        </div>
      </div>
    </div>
  )
}

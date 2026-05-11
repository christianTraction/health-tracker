'use client'

import { useEffect, useState } from 'react'
import { saveBodyScan, saveLabResult, getBodyScans, getLabResults } from '@/app/actions/health'

type BodyScan = {
  id: string
  scanned_at: string
  body_fat_pct: number | null
  fat_mass_kg: number | null
  lean_mass_kg: number | null
  bone_mass_kg: number | null
  visceral_fat: number | null
}

type LabResult = {
  id: string
  tested_at: string
  hba1c: number | null
  glucose: number | null
  ldl: number | null
  hdl: number | null
  total_chol: number | null
  triglycerides: number | null
}

export default function HealthClient() {
  const [activeTab, setActiveTab] = useState<'dexa' | 'labs'>('dexa')
  const [bodyScans, setBodyScans] = useState<BodyScan[]>([])
  const [labResults, setLabResults] = useState<LabResult[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)
    const [scansResult, labsResult] = await Promise.all([
      getBodyScans(),
      getLabResults(),
    ])
    if (!scansResult.error && scansResult.bodyScans) {
      setBodyScans(scansResult.bodyScans)
    }
    if (!labsResult.error && labsResult.labResults) {
      setLabResults(labsResult.labResults)
    }
    setLoading(false)
  }

  const handleSaveBodyScan = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError(null)

    const formData = new FormData(e.currentTarget)
    const result = await saveBodyScan({
      date: formData.get('date') as string,
      weight: formData.get('weight') ? parseFloat(formData.get('weight') as string) : null,
      bodyFatPct: formData.get('bodyFatPct') ? parseFloat(formData.get('bodyFatPct') as string) : null,
      fatMass: formData.get('fatMass') ? parseFloat(formData.get('fatMass') as string) : null,
      leanMass: formData.get('leanMass') ? parseFloat(formData.get('leanMass') as string) : null,
      boneMass: formData.get('boneMass') ? parseFloat(formData.get('boneMass') as string) : null,
      vatMass: formData.get('vatMass') ? parseFloat(formData.get('vatMass') as string) : null,
      rmrCalories: formData.get('rmrCalories') ? parseInt(formData.get('rmrCalories') as string) : null,
    })

    if (result.error) {
      setError(result.error)
    } else {
      e.currentTarget.reset()
      await loadData()
    }
  }

  const handleSaveLabResult = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError(null)

    const formData = new FormData(e.currentTarget)
    const result = await saveLabResult({
      date: formData.get('date') as string,
      hba1c: formData.get('hba1c') ? parseFloat(formData.get('hba1c') as string) : null,
      glucose: formData.get('glucose') ? parseFloat(formData.get('glucose') as string) : null,
      ldl: formData.get('ldl') ? parseFloat(formData.get('ldl') as string) : null,
      hdl: formData.get('hdl') ? parseFloat(formData.get('hdl') as string) : null,
      totalChol: formData.get('totalChol') ? parseFloat(formData.get('totalChol') as string) : null,
      triglycerides: formData.get('triglycerides') ? parseFloat(formData.get('triglycerides') as string) : null,
      systolicBp: formData.get('systolicBp') ? parseFloat(formData.get('systolicBp') as string) : null,
      diastolicBp: formData.get('diastolicBp') ? parseFloat(formData.get('diastolicBp') as string) : null,
    })

    if (result.error) {
      setError(result.error)
    } else {
      e.currentTarget.reset()
      await loadData()
    }
  }

  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="rounded-3xl border border-zinc-200 bg-white/90 p-8 shadow-sm backdrop-blur dark:border-zinc-700 dark:bg-zinc-950/80">
        <h1 className="text-3xl font-semibold text-zinc-950 dark:text-zinc-50">Health Measurements</h1>
        <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
          Track your DEXA scans and lab results over time.
        </p>

        {/* Tabs */}
        <div className="mt-8 flex gap-4 border-b border-zinc-200 dark:border-zinc-700">
          <button
            onClick={() => setActiveTab('dexa')}
            className={`px-4 py-2 font-medium text-sm transition ${
              activeTab === 'dexa'
                ? 'border-b-2 border-zinc-950 text-zinc-950 dark:border-zinc-50 dark:text-zinc-50'
                : 'text-zinc-600 dark:text-zinc-400'
            }`}
          >
            DEXA Scans
          </button>
          <button
            onClick={() => setActiveTab('labs')}
            className={`px-4 py-2 font-medium text-sm transition ${
              activeTab === 'labs'
                ? 'border-b-2 border-zinc-950 text-zinc-950 dark:border-zinc-50 dark:text-zinc-50'
                : 'text-zinc-600 dark:text-zinc-400'
            }`}
          >
            Lab Results
          </button>
        </div>

        {error && (
          <div className="mt-6 rounded-3xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-600/40 dark:bg-red-950/20 dark:text-red-200">
            {error}
          </div>
        )}

        {/* DEXA Scans Tab */}
        {activeTab === 'dexa' && (
          <div className="mt-8 space-y-8">
            {/* DEXA Form */}
            <form onSubmit={handleSaveBodyScan} className="space-y-6 rounded-2xl border border-zinc-200 bg-zinc-50 p-6 dark:border-zinc-700 dark:bg-zinc-900/50">
              <h2 className="text-lg font-semibold text-zinc-950 dark:text-zinc-50">Add DEXA Scan</h2>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Date</label>
                  <input
                    type="date"
                    name="date"
                    required
                    className="mt-1 w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 placeholder-zinc-400 focus:border-zinc-950 focus:outline-none dark:border-zinc-600 dark:bg-zinc-800 dark:text-white dark:placeholder-zinc-500"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Weight (kg)</label>
                  <input
                    type="number"
                    name="weight"
                    step="0.1"
                    className="mt-1 w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 placeholder-zinc-400 focus:border-zinc-950 focus:outline-none dark:border-zinc-600 dark:bg-zinc-800 dark:text-white dark:placeholder-zinc-500"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Body Fat %</label>
                  <input
                    type="number"
                    name="bodyFatPct"
                    step="0.1"
                    className="mt-1 w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 placeholder-zinc-400 focus:border-zinc-950 focus:outline-none dark:border-zinc-600 dark:bg-zinc-800 dark:text-white dark:placeholder-zinc-500"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Fat Mass (kg)</label>
                  <input
                    type="number"
                    name="fatMass"
                    step="0.1"
                    className="mt-1 w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 placeholder-zinc-400 focus:border-zinc-950 focus:outline-none dark:border-zinc-600 dark:bg-zinc-800 dark:text-white dark:placeholder-zinc-500"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Lean Mass (kg)</label>
                  <input
                    type="number"
                    name="leanMass"
                    step="0.1"
                    className="mt-1 w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 placeholder-zinc-400 focus:border-zinc-950 focus:outline-none dark:border-zinc-600 dark:bg-zinc-800 dark:text-white dark:placeholder-zinc-500"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Bone Mass (kg)</label>
                  <input
                    type="number"
                    name="boneMass"
                    step="0.1"
                    className="mt-1 w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 placeholder-zinc-400 focus:border-zinc-950 focus:outline-none dark:border-zinc-600 dark:bg-zinc-800 dark:text-white dark:placeholder-zinc-500"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Visceral Fat (kg)</label>
                  <input
                    type="number"
                    name="vatMass"
                    step="0.1"
                    className="mt-1 w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 placeholder-zinc-400 focus:border-zinc-950 focus:outline-none dark:border-zinc-600 dark:bg-zinc-800 dark:text-white dark:placeholder-zinc-500"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">RMR (calories)</label>
                  <input
                    type="number"
                    name="rmrCalories"
                    className="mt-1 w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 placeholder-zinc-400 focus:border-zinc-950 focus:outline-none dark:border-zinc-600 dark:bg-zinc-800 dark:text-white dark:placeholder-zinc-500"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="inline-flex items-center justify-center rounded-full bg-zinc-950 px-6 py-2 text-sm font-semibold text-white transition hover:bg-zinc-800 dark:bg-zinc-50 dark:text-zinc-950 dark:hover:bg-zinc-200"
              >
                Save DEXA Scan
              </button>
            </form>

            {/* DEXA History */}
            <div>
              <h2 className="text-lg font-semibold text-zinc-950 dark:text-zinc-50">DEXA Scan History</h2>
              {loading ? (
                <p className="mt-4 text-sm text-zinc-500 dark:text-zinc-400">Loading...</p>
              ) : bodyScans.length === 0 ? (
                <p className="mt-4 text-sm text-zinc-500 dark:text-zinc-400">No DEXA scans recorded yet.</p>
              ) : (
                <div className="mt-4 space-y-3">
                  {bodyScans.map((scan) => (
                    <div key={scan.id} className="rounded-lg border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-700 dark:bg-zinc-900">
                      <p className="font-medium text-zinc-950 dark:text-zinc-50">
                        {new Date(scan.scanned_at).toLocaleDateString()}
                      </p>
                      <div className="mt-2 grid gap-2 text-sm text-zinc-600 dark:text-zinc-400 sm:grid-cols-2">
                        {scan.body_fat_pct !== null && <p>Body Fat: {scan.body_fat_pct}%</p>}
                        {scan.fat_mass_kg !== null && <p>Fat Mass: {scan.fat_mass_kg} kg</p>}
                        {scan.lean_mass_kg !== null && <p>Lean Mass: {scan.lean_mass_kg} kg</p>}
                        {scan.bone_mass_kg !== null && <p>Bone Mass: {scan.bone_mass_kg} kg</p>}
                        {scan.visceral_fat !== null && <p>Visceral Fat: {scan.visceral_fat} kg</p>}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Lab Results Tab */}
        {activeTab === 'labs' && (
          <div className="mt-8 space-y-8">
            {/* Lab Form */}
            <form onSubmit={handleSaveLabResult} className="space-y-6 rounded-2xl border border-zinc-200 bg-zinc-50 p-6 dark:border-zinc-700 dark:bg-zinc-900/50">
              <h2 className="text-lg font-semibold text-zinc-950 dark:text-zinc-50">Add Lab Results</h2>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Date</label>
                  <input
                    type="date"
                    name="date"
                    required
                    className="mt-1 w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 placeholder-zinc-400 focus:border-zinc-950 focus:outline-none dark:border-zinc-600 dark:bg-zinc-800 dark:text-white dark:placeholder-zinc-500"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">HbA1c (%)</label>
                  <input
                    type="number"
                    name="hba1c"
                    step="0.1"
                    className="mt-1 w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 placeholder-zinc-400 focus:border-zinc-950 focus:outline-none dark:border-zinc-600 dark:bg-zinc-800 dark:text-white dark:placeholder-zinc-500"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Glucose (mg/dL)</label>
                  <input
                    type="number"
                    name="glucose"
                    step="0.1"
                    className="mt-1 w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 placeholder-zinc-400 focus:border-zinc-950 focus:outline-none dark:border-zinc-600 dark:bg-zinc-800 dark:text-white dark:placeholder-zinc-500"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">LDL (mg/dL)</label>
                  <input
                    type="number"
                    name="ldl"
                    step="0.1"
                    className="mt-1 w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 placeholder-zinc-400 focus:border-zinc-950 focus:outline-none dark:border-zinc-600 dark:bg-zinc-800 dark:text-white dark:placeholder-zinc-500"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">HDL (mg/dL)</label>
                  <input
                    type="number"
                    name="hdl"
                    step="0.1"
                    className="mt-1 w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 placeholder-zinc-400 focus:border-zinc-950 focus:outline-none dark:border-zinc-600 dark:bg-zinc-800 dark:text-white dark:placeholder-zinc-500"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Total Cholesterol (mg/dL)</label>
                  <input
                    type="number"
                    name="totalChol"
                    step="0.1"
                    className="mt-1 w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 placeholder-zinc-400 focus:border-zinc-950 focus:outline-none dark:border-zinc-600 dark:bg-zinc-800 dark:text-white dark:placeholder-zinc-500"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Triglycerides (mg/dL)</label>
                  <input
                    type="number"
                    name="triglycerides"
                    step="0.1"
                    className="mt-1 w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 placeholder-zinc-400 focus:border-zinc-950 focus:outline-none dark:border-zinc-600 dark:bg-zinc-800 dark:text-white dark:placeholder-zinc-500"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Systolic BP (mmHg)</label>
                  <input
                    type="number"
                    name="systolicBp"
                    step="0.1"
                    className="mt-1 w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 placeholder-zinc-400 focus:border-zinc-950 focus:outline-none dark:border-zinc-600 dark:bg-zinc-800 dark:text-white dark:placeholder-zinc-500"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Diastolic BP (mmHg)</label>
                  <input
                    type="number"
                    name="diastolicBp"
                    step="0.1"
                    className="mt-1 w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 placeholder-zinc-400 focus:border-zinc-950 focus:outline-none dark:border-zinc-600 dark:bg-zinc-800 dark:text-white dark:placeholder-zinc-500"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="inline-flex items-center justify-center rounded-full bg-zinc-950 px-6 py-2 text-sm font-semibold text-white transition hover:bg-zinc-800 dark:bg-zinc-50 dark:text-zinc-950 dark:hover:bg-zinc-200"
              >
                Save Lab Results
              </button>
            </form>

            {/* Lab History */}
            <div>
              <h2 className="text-lg font-semibold text-zinc-950 dark:text-zinc-50">Lab Results History</h2>
              {loading ? (
                <p className="mt-4 text-sm text-zinc-500 dark:text-zinc-400">Loading...</p>
              ) : labResults.length === 0 ? (
                <p className="mt-4 text-sm text-zinc-500 dark:text-zinc-400">No lab results recorded yet.</p>
              ) : (
                <div className="mt-4 space-y-3">
                  {labResults.map((lab) => (
                    <div key={lab.id} className="rounded-lg border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-700 dark:bg-zinc-900">
                      <p className="font-medium text-zinc-950 dark:text-zinc-50">
                        {new Date(lab.tested_at).toLocaleDateString()}
                      </p>
                      <div className="mt-2 grid gap-2 text-sm text-zinc-600 dark:text-zinc-400 sm:grid-cols-2">
                        {lab.hba1c !== null && <p>HbA1c: {lab.hba1c}%</p>}
                        {lab.glucose !== null && <p>Glucose: {lab.glucose} mg/dL</p>}
                        {lab.ldl !== null && <p>LDL: {lab.ldl} mg/dL</p>}
                        {lab.hdl !== null && <p>HDL: {lab.hdl} mg/dL</p>}
                        {lab.total_chol !== null && <p>Total Cholesterol: {lab.total_chol} mg/dL</p>}
                        {lab.triglycerides !== null && <p>Triglycerides: {lab.triglycerides} mg/dL</p>}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

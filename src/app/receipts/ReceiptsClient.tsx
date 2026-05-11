'use client'

import { useEffect, useState } from 'react'
import { useActionState } from 'react'
import { uploadReceipt } from '@/app/actions/receipts'

type ReceiptItem = {
  description: string
  price: number | null
}

type Receipt = {
  id: string
  date: string
  store_name: string | null
  total_amount: number | null
  items: ReceiptItem[] | null
  meal_cost_estimate: number | null
}

type Props = {
  receipts: Receipt[]
}

export default function ReceiptsClient({ receipts }: Props) {
  const [savedReceipt, setSavedReceipt] = useState<Receipt | null>(null)
  const [state, action, pending] = useActionState(uploadReceipt, undefined)

  useEffect(() => {
    if (state?.receipt) {
      setSavedReceipt(state.receipt)
    }
  }, [state])

  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="rounded-3xl border border-zinc-200 bg-white/90 p-8 shadow-sm backdrop-blur dark:border-zinc-700 dark:bg-zinc-950/80">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-semibold text-zinc-950 dark:text-zinc-50">Receipt Upload</h1>
            <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
              Upload a receipt image (JPEG, PNG, GIF, or WebP) and we&apos;ll parse store, date, total, and line items.
            </p>
          </div>
        </div>

        <form action={action} className="mt-8 grid gap-4 sm:grid-cols-[1fr_auto]">
          <label className="block rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm text-zinc-900 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50">
            <span className="text-sm font-medium">Receipt file</span>
            <input
              type="file"
              name="receipt"
              accept="image/jpeg,image/png,image/gif,image/webp"
              className="mt-3 w-full text-sm text-zinc-900 file:mr-4 file:rounded-full file:border-0 file:bg-zinc-950 file:px-4 file:py-2 file:text-white file:ring-0 dark:text-zinc-50 dark:file:bg-zinc-50 dark:file:text-zinc-950"
              required
            />
          </label>

          <button
            type="submit"
            disabled={pending}
            className="inline-flex items-center justify-center rounded-full bg-zinc-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-zinc-50 dark:text-zinc-950 dark:hover:bg-zinc-200"
          >
            {pending ? 'Uploading…' : 'Upload Receipt'}
          </button>
        </form>

        {state?.error && (
          <div className="mt-6 rounded-3xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-600/40 dark:bg-red-950/20 dark:text-red-200">
            {state.error}
          </div>
        )}

        {savedReceipt && (
          <div className="mt-8 rounded-3xl border border-zinc-200 bg-zinc-50 p-6 dark:border-zinc-700 dark:bg-zinc-900">
            <h2 className="text-lg font-semibold text-zinc-950 dark:text-zinc-50">Parsed Receipt</h2>
            <div className="mt-4 grid gap-4 sm:grid-cols-3">
              <div>
                <p className="text-sm text-zinc-500 dark:text-zinc-400">Store</p>
                <p className="mt-2 text-base font-semibold text-zinc-950 dark:text-zinc-50">{savedReceipt.store_name ?? 'Unknown'}</p>
              </div>
              <div>
                <p className="text-sm text-zinc-500 dark:text-zinc-400">Date</p>
                <p className="mt-2 text-base font-semibold text-zinc-950 dark:text-zinc-50">{savedReceipt.date}</p>
              </div>
              <div>
                <p className="text-sm text-zinc-500 dark:text-zinc-400">Total</p>
                <p className="mt-2 text-base font-semibold text-zinc-950 dark:text-zinc-50">
                  {savedReceipt.total_amount != null ? `$${savedReceipt.total_amount.toFixed(2)}` : 'Unknown'}
                </p>
              </div>
            </div>

            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <div className="rounded-3xl border border-zinc-200 bg-white p-4 dark:border-zinc-700 dark:bg-zinc-950">
                <p className="text-sm text-zinc-500 dark:text-zinc-400">Estimated meal cost</p>
                <p className="mt-2 text-xl font-semibold text-zinc-950 dark:text-zinc-50">
                  {savedReceipt.meal_cost_estimate != null ? `$${savedReceipt.meal_cost_estimate.toFixed(2)}` : 'N/A'}
                </p>
              </div>
              <div className="rounded-3xl border border-zinc-200 bg-white p-4 dark:border-zinc-700 dark:bg-zinc-950">
                <p className="text-sm text-zinc-500 dark:text-zinc-400">Line items</p>
                <p className="mt-2 text-sm text-zinc-700 dark:text-zinc-300">
                  {savedReceipt.items?.length ? `${savedReceipt.items.length} item(s)` : 'No line items detected.'}
                </p>
              </div>
            </div>

            {savedReceipt.items?.length ? (
              <div className="mt-6 overflow-hidden rounded-3xl border border-zinc-200 bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900">
                <div className="grid grid-cols-[1fr_120px] gap-4 bg-zinc-100 px-5 py-3 text-sm font-semibold text-zinc-700 dark:bg-zinc-950 dark:text-zinc-300">
                  <span>Description</span>
                  <span className="text-right">Price</span>
                </div>
                <div className="divide-y divide-zinc-200 dark:divide-zinc-700">
                  {savedReceipt.items.map((item, index) => (
                    <div key={`${item.description}-${index}`} className="grid grid-cols-[1fr_120px] gap-4 px-5 py-4 text-sm text-zinc-700 dark:text-zinc-300">
                      <span>{item.description || 'Unnamed item'}</span>
                      <span className="text-right">
                        {item.price != null ? `$${item.price.toFixed(2)}` : 'N/A'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}
          </div>
        )}

        {receipts.length > 0 && (
          <div className="mt-10 rounded-3xl border border-zinc-200 bg-white p-6 dark:border-zinc-700 dark:bg-zinc-950">
            <h2 className="text-lg font-semibold text-zinc-950 dark:text-zinc-50">Recent Receipts</h2>
            <div className="mt-5 space-y-4">
              {receipts.map((receipt) => (
                <div key={receipt.id} className="rounded-3xl border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-700 dark:bg-zinc-900">
                  <div className="flex flex-col gap-2 sm:flex-row sm:justify-between sm:items-center">
                    <div>
                      <p className="text-sm text-zinc-500 dark:text-zinc-400">{receipt.store_name ?? 'Unknown store'}</p>
                      <p className="text-base font-semibold text-zinc-950 dark:text-zinc-50">{receipt.date}</p>
                    </div>
                    <p className="text-sm font-semibold text-zinc-950 dark:text-zinc-50">
                      {receipt.total_amount != null ? `$${receipt.total_amount.toFixed(2)}` : 'Total unknown'}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

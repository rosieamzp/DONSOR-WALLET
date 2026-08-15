'use client'

import { useState } from 'react'
import ManualForm from './manual-form'
import RecurringPanel from './recurring-panel'
import AIScanFlow from './ai-scan-flow'

type Category = { id: string; name: string; color: string | null; type: 'income' | 'expense' }
type Profile = { id: string; display_name: string }
type Recurring = {
  id: string
  amount: number
  type: 'income' | 'expense'
  category_id: string | null
  note: string | null
  payer_id: string | null
  split_amount: number | null
  interval_months: number
  start_date: string
  end_date: string | null
  next_run_date: string
  is_active: boolean
}

export default function AddFlow({
  categories,
  profiles,
  currentUserId,
  recurringExpenses,
}: {
  categories: Category[]
  profiles: Profile[]
  currentUserId: string
  recurringExpenses: Recurring[]
}) {
  const [mode, setMode] = useState<'choose' | 'manual' | 'recurring' | 'ai-scan'>('choose')

  if (mode === 'manual') {
    return (
      <div className="px-5 pb-5 pt-7">
        <ManualForm
          categories={categories}
          profiles={profiles}
          currentUserId={currentUserId}
          onBack={() => setMode('choose')}
        />
      </div>
    )
  }

  if (mode === 'ai-scan') {
    return (
      <AIScanFlow
        categories={categories}
        profiles={profiles}
        currentUserId={currentUserId}
        onBack={() => setMode('choose')}
      />
    )
  }

  if (mode === 'recurring') {
    return (
      <div className="px-5 pb-5 pt-7">
        <div className="mb-5">
          <button
            type="button"
            onClick={() => setMode('choose')}
            className="tap-feedback flex h-9 w-9 items-center justify-center rounded-full"
          >
            <span
              className="h-2 w-2 border-b-2 border-l-2 border-muted"
              style={{ transform: 'rotate(45deg)' }}
            />
          </button>
        </div>
        <RecurringPanel
          categories={categories}
          profiles={profiles}
          recurringExpenses={recurringExpenses}
        />
      </div>
    )
  }

  return (
    <div className="px-5 pb-5 pt-7">
      <div className="flex flex-col gap-3.5">
        <button
          type="button"
          onClick={() => setMode('manual')}
          className="tap-feedback flex cursor-pointer items-center gap-4 rounded-[20px] border border-[var(--color-border)] p-5 text-left"
        >
          <div
            className="grid flex-none place-items-center rounded-2xl bg-primary-light"
            style={{ width: 52, height: 52 }}
          >
            <div className="grid grid-cols-2 grid-rows-2 gap-1" style={{ width: 24, height: 24 }}>
              {[0, 1, 2, 3].map((i) => (
                <div key={i} className="rounded-sm bg-primary" />
              ))}
            </div>
          </div>
          <div className="flex-1">
            <div className="text-base font-bold text-ink">手動輸入</div>
            <div className="mt-1 text-xs text-muted">自行填寫金額與分類</div>
          </div>
        </button>

        <button
          type="button"
          onClick={() => setMode('ai-scan')}
          className="tap-feedback relative flex cursor-pointer items-center gap-4 rounded-[20px] border border-[var(--color-border)] p-5 text-left"
        >
          <div className="absolute right-4 top-3.5 rounded-full bg-primary px-2 py-0.5 text-[10px] font-bold text-white">
            AI
          </div>
          <div
            className="grid flex-none place-items-center rounded-2xl bg-primary"
            style={{ width: 52, height: 52 }}
          >
            <div
              className="rounded-full border-[3px] border-white"
              style={{ width: 26, height: 26 }}
            />
          </div>
          <div className="flex-1">
            <div className="text-base font-bold text-ink">AI 拍照辨識</div>
            <div className="mt-1 text-xs text-muted">拍照或上傳收據，自動辨識金額</div>
          </div>
        </button>

        <button
          type="button"
          onClick={() => setMode('recurring')}
          className="tap-feedback flex cursor-pointer items-center gap-4 rounded-[20px] border border-[var(--color-border)] p-5 text-left"
        >
          <div
            className="grid flex-none place-items-center rounded-2xl bg-primary-light"
            style={{ width: 52, height: 52 }}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path
                d="M20 12a8 8 0 1 1-2.34-5.66M20 4v5h-5"
                stroke="#D6303C"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
          <div className="flex-1">
            <div className="text-base font-bold text-ink">定期收支</div>
            <div className="mt-1 text-xs text-muted">設定每月／每年固定收入或支出</div>
          </div>
        </button>
      </div>
    </div>
  )
}

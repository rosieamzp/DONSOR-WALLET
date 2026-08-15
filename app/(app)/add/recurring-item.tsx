'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { toggleRecurringExpenseActive, deleteRecurringExpense } from '@/app/actions/recurring'
import { useConfirm } from '@/components/confirm-dialog'
import RecurringEditForm from './recurring-edit-form'

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

function intervalLabel(months: number, startDate: string) {
  const [, month, day] = startDate.split('-').map(Number)
  return months === 12 ? `每年 ${month}月${day}日` : `每月 ${day} 號`
}

export default function RecurringItem({
  recurring,
  categories,
  profiles,
  categoryName,
  categoryColor,
  payerName,
  formattedAmount,
}: {
  recurring: Recurring
  categories: Category[]
  profiles: Profile[]
  categoryName: string
  categoryColor: string
  payerName: string | null
  formattedAmount: string
}) {
  const router = useRouter()
  const confirm = useConfirm()
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [deleted, setDeleted] = useState(false)
  const [editing, setEditing] = useState(false)

  if (deleted) return null

  if (editing) {
    return (
      <RecurringEditForm
        recurring={recurring}
        categories={categories}
        profiles={profiles}
        onClose={() => setEditing(false)}
        onSaved={() => {
          setEditing(false)
          router.refresh()
        }}
      />
    )
  }

  return (
    <div
      className="rounded-2xl border border-[var(--color-border-light)] p-3.5"
      style={{ opacity: recurring.is_active ? 1 : 0.5 }}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          {recurring.type === 'expense' ? (
            <>
              <div className="flex items-center gap-1.5">
                <span
                  className="h-2 w-2 flex-none rounded-full"
                  style={{ background: categoryColor }}
                />
                <span className="truncate text-sm font-semibold text-ink">{categoryName}</span>
              </div>
              <div className="mt-0.5 truncate text-xs text-faint">
                {recurring.note || '（無備註）'}
              </div>
            </>
          ) : (
            <div className="truncate text-sm font-semibold text-ink">
              {recurring.note || '定期收入'}
            </div>
          )}
          <div className="mt-1.5 text-[11px] text-faint">
            {intervalLabel(recurring.interval_months, recurring.start_date)} · 下次{' '}
            {recurring.next_run_date}
            {payerName ? ` · ${payerName} 代墊` : ''}
          </div>
        </div>
        <div
          className="flex-none text-sm font-bold"
          style={{ color: recurring.type === 'income' ? '#2E7D32' : '#D6303C' }}
        >
          {recurring.type === 'income' ? '+' : '-'}
          {formattedAmount}
        </div>
      </div>

      <div className="mt-3 flex items-center justify-end gap-3 border-t border-[var(--color-border-light)] pt-2.5">
        {error && <p className="mr-auto text-[11px] text-primary">{error}</p>}
        <button
          type="button"
          disabled={pending}
          onClick={() => setEditing(true)}
          className="tap-feedback rounded-md px-1.5 py-0.5 text-xs font-medium text-muted disabled:opacity-50"
        >
          編輯
        </button>
        <button
          type="button"
          disabled={pending}
          onClick={() => {
            setError(null)
            startTransition(async () => {
              const result = await toggleRecurringExpenseActive(
                recurring.id,
                !recurring.is_active
              )
              if ('error' in result) setError(result.error)
            })
          }}
          className="tap-feedback rounded-md px-1.5 py-0.5 text-xs font-medium text-muted disabled:opacity-50"
        >
          {recurring.is_active ? '停用' : '啟用'}
        </button>
        <button
          type="button"
          disabled={pending}
          onClick={async () => {
            if (await confirm({ message: '確定要刪除這筆定期規則嗎？', danger: true })) {
              setError(null)
              startTransition(async () => {
                const result = await deleteRecurringExpense(recurring.id)
                if ('error' in result) {
                  setError(result.error)
                } else {
                  setDeleted(true)
                }
              })
            }
          }}
          className="tap-feedback rounded-md px-1.5 py-0.5 text-xs font-medium text-primary disabled:opacity-50"
        >
          刪除
        </button>
      </div>
    </div>
  )
}

'use client'

import { useState, useTransition } from 'react'
import {
  findCurrentPeriodTransaction,
  updateRecurringExpense,
} from '@/app/actions/recurring'
import InlineCategoryCreator from '@/components/inline-category-creator'
import { useAlert } from '@/components/confirm-dialog'

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
  end_date: string | null
}

export default function RecurringEditForm({
  recurring,
  categories,
  profiles,
  onClose,
  onSaved,
}: {
  recurring: Recurring
  categories: Category[]
  profiles: Profile[]
  onClose: () => void
  onSaved: () => void
}) {
  const [pending, startTransition] = useTransition()
  const alert = useAlert()
  const [error, setError] = useState<string | null>(null)
  const [type] = useState<'expense' | 'income'>(recurring.type)
  const categoriesForType = categories.filter((c) => c.type === type)
  const [categoryId, setCategoryId] = useState(recurring.category_id ?? '')
  const [amount, setAmount] = useState(String(recurring.amount))
  const [enableSplit, setEnableSplit] = useState(!!recurring.payer_id)
  const [payerId, setPayerId] = useState(recurring.payer_id ?? profiles[0]?.id ?? '')
  const [splitAmountOverride, setSplitAmountOverride] = useState<string | null>(
    recurring.split_amount != null ? String(recurring.split_amount) : null
  )
  const [isPermanent, setIsPermanent] = useState(!recurring.end_date)
  const otherProfile = profiles.find((p) => p.id !== payerId)
  const accentColor = type === 'income' ? '#2E7D32' : '#D6303C'

  const amountNum = parseFloat(amount)
  const defaultSplitAmount = amountNum > 0 ? String(Math.round((amountNum / 2) * 100) / 100) : ''
  const splitAmount = splitAmountOverride ?? defaultSplitAmount

  const [pendingFormData, setPendingFormData] = useState<FormData | null>(null)

  function submit(applyToCurrentPeriod: boolean) {
    if (!pendingFormData) return
    setError(null)
    startTransition(async () => {
      const result = await updateRecurringExpense(
        recurring.id,
        applyToCurrentPeriod,
        undefined,
        pendingFormData
      )
      if (result && 'error' in result) {
        setError(result.error)
      } else {
        onSaved()
        alert('已儲存變更')
      }
      setPendingFormData(null)
    })
  }

  async function handleSubmit(formData: FormData) {
    setError(null)
    startTransition(async () => {
      const currentTxId = await findCurrentPeriodTransaction(recurring.id)
      if (currentTxId) {
        setPendingFormData(formData)
        return
      }
      const result = await updateRecurringExpense(recurring.id, false, undefined, formData)
      if (result && 'error' in result) {
        setError(result.error)
      } else {
        onSaved()
        alert('已儲存變更')
      }
    })
  }

  if (pendingFormData) {
    return (
      <div className="rounded-2xl border border-[var(--color-border-light)] p-4">
        <div className="mb-3 text-sm font-semibold text-ink">這筆規則本月已經產生一筆尚未結算的紀錄</div>
        <p className="mb-4 text-xs text-muted">要一併更新這一期的紀錄，還是只從下一期開始套用新內容？</p>
        <div className="flex flex-col gap-2">
          <button
            type="button"
            disabled={pending}
            onClick={() => submit(true)}
            style={{ background: accentColor }}
            className="tap-feedback rounded-xl py-2.5 text-sm font-semibold text-white disabled:opacity-60"
          >
            本期生效（同步更新本月紀錄）
          </button>
          <button
            type="button"
            disabled={pending}
            onClick={() => submit(false)}
            className="tap-feedback rounded-xl border border-[var(--color-border)] py-2.5 text-sm font-semibold text-ink disabled:opacity-60"
          >
            下期生效（本月紀錄不變）
          </button>
          <button
            type="button"
            disabled={pending}
            onClick={() => setPendingFormData(null)}
            className="tap-feedback rounded-xl py-2 text-xs text-muted disabled:opacity-60"
          >
            取消
          </button>
        </div>
      </div>
    )
  }

  return (
    <form action={handleSubmit} className="rounded-2xl border border-[var(--color-border-light)] p-4">
      <input type="hidden" name="type" value={type} />
      <input type="hidden" name="category_id" value={categoryId} />

      <div
        className="mb-3 flex items-center justify-center gap-1.5 rounded-3xl border border-white/60 py-6 backdrop-blur-md"
        style={{
          background: 'linear-gradient(180deg, rgba(255,255,255,0.55), rgba(255,255,255,0.25))',
          boxShadow: '0 8px 24px -12px rgba(43,35,32,0.15)',
        }}
      >
        <input
          name="amount"
          type="number"
          step="0.01"
          min="0"
          placeholder="0"
          required
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          className="w-40 bg-transparent text-center text-4xl font-extrabold outline-none [appearance:textfield] placeholder:text-[color:var(--amount-accent)] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
          style={{ color: accentColor, ['--amount-accent' as string]: accentColor }}
        />
      </div>

      {type === 'expense' && (
        <div className="mb-3">
          <div className="mb-1.5 text-xs text-muted">分類</div>
          <div className="flex flex-wrap items-center gap-2">
            {categoriesForType.map((c) => {
              const selected = categoryId === c.id
              const color = c.color ?? '#9C9490'
              return (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setCategoryId(c.id)}
                  className="tap-feedback rounded-full px-4 py-2 text-[13px] font-semibold"
                  style={{
                    background: selected ? color : `${color}16`,
                    color: selected ? '#FFFFFF' : color,
                  }}
                >
                  {c.name}
                </button>
              )
            })}
            <InlineCategoryCreator type={type} onCreated={setCategoryId} />
          </div>
        </div>
      )}

      <div className="mb-3">
        <div className="mb-1.5 flex items-center justify-between text-xs text-muted">
          <span>結束日期</span>
          <label className="flex items-center gap-1.5 text-ink">
            <input
              type="checkbox"
              checked={isPermanent}
              onChange={(e) => setIsPermanent(e.target.checked)}
            />
            永久
          </label>
        </div>
        {!isPermanent && (
          <input
            name="end_date"
            type="date"
            defaultValue={recurring.end_date ?? ''}
            className="w-full rounded-[var(--radius-default)] border border-[var(--color-border)] px-3 py-2.5 text-sm text-ink-secondary outline-none focus:border-primary"
          />
        )}
      </div>

      {type === 'expense' && profiles.length >= 2 && (
        <div className="mb-3 rounded-2xl border border-[var(--color-border)] p-3.5">
          <label className="flex items-center gap-2 text-sm font-semibold text-ink">
            <input
              type="checkbox"
              checked={enableSplit}
              onChange={(e) => {
                setEnableSplit(e.target.checked)
                setSplitAmountOverride(null)
              }}
            />
            需要分攤
          </label>

          {enableSplit && (
            <div className="mt-3 flex flex-col gap-3">
              <div>
                <div className="mb-1.5 text-xs text-muted">代墊者</div>
                <div className="flex gap-2">
                  {profiles.map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => setPayerId(p.id)}
                      className="tap-feedback flex-1 rounded-xl py-2 text-xs font-semibold"
                      style={{
                        background: payerId === p.id ? '#D6303C' : '#F5EDEC',
                        color: payerId === p.id ? '#FFFFFF' : '#6B615C',
                      }}
                    >
                      {p.display_name}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <div className="mb-1.5 text-xs text-muted">
                  {otherProfile?.display_name ?? '對方'} 應分攤金額
                </div>
                <input
                  name="split_amount"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0"
                  value={splitAmount}
                  onChange={(e) => setSplitAmountOverride(e.target.value)}
                  className="w-full rounded-xl border border-[var(--color-border)] p-2.5 text-sm outline-none focus:border-primary"
                />
              </div>
            </div>
          )}
          <input type="hidden" name="payer_id" value={enableSplit ? payerId : ''} />
        </div>
      )}

      <input
        name="note"
        type="text"
        placeholder="項目名稱"
        defaultValue={recurring.note ?? ''}
        className="mb-3 w-full rounded-[var(--radius-default)] border border-[var(--color-border)] px-4 py-2.5 text-sm outline-none focus:border-primary"
      />

      {error && (
        <p className="mb-2 text-xs text-primary" role="alert">
          {error}
        </p>
      )}

      <div className="flex gap-2">
        <button
          type="button"
          onClick={onClose}
          disabled={pending}
          className="tap-feedback flex-1 rounded-xl border border-[var(--color-border)] py-2.5 text-sm font-semibold text-ink disabled:opacity-60"
        >
          取消
        </button>
        <button
          type="submit"
          disabled={pending || (type === 'expense' && !categoryId)}
          style={{ background: accentColor }}
          className="tap-feedback flex-1 rounded-xl py-2.5 text-sm font-semibold text-white disabled:opacity-60"
        >
          {pending ? '儲存中…' : '儲存'}
        </button>
      </div>
    </form>
  )
}

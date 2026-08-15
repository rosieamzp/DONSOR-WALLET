'use client'

import { useActionState, useRef, useState, useEffect } from 'react'
import { createRecurringExpense } from '@/app/actions/recurring'
import InlineCategoryCreator from '@/components/inline-category-creator'

type Category = { id: string; name: string; color: string | null; type: 'income' | 'expense' }
type Profile = { id: string; display_name: string }

function todayISO() {
  return new Date().toISOString().slice(0, 10)
}

function thisMonthValue() {
  return new Date().toISOString().slice(0, 7)
}

const INTERVAL_PRESETS = [
  { label: '每月', value: 1 },
  { label: '每年', value: 12 },
]

const DAYS_OF_MONTH = Array.from({ length: 31 }, (_, i) => i + 1)

export default function RecurringForm({
  categories,
  profiles,
}: {
  categories: Category[]
  profiles: Profile[]
}) {
  const [state, action, pending] = useActionState(createRecurringExpense, undefined)
  const formRef = useRef<HTMLFormElement>(null)
  const [type, setType] = useState<'expense' | 'income'>('expense')
  const categoriesForType = categories.filter((c) => c.type === type)
  const [categoryId, setCategoryId] = useState(categoriesForType[0]?.id ?? '')
  const [intervalMonths, setIntervalMonths] = useState(1)
  const [dayOfMonth, setDayOfMonth] = useState(1)
  const [startMonth, setStartMonth] = useState(thisMonthValue())
  const [amount, setAmount] = useState('')
  const [enableSplit, setEnableSplit] = useState(false)
  const [payerId, setPayerId] = useState(profiles[0]?.id ?? '')
  const [splitAmountOverride, setSplitAmountOverride] = useState<string | null>(null)
  const [isPermanent, setIsPermanent] = useState(false)
  const otherProfile = profiles.find((p) => p.id !== payerId)

  const amountNum = parseFloat(amount)
  const defaultSplitAmount =
    amountNum > 0 ? String(Math.round((amountNum / 2) * 100) / 100) : ''
  const splitAmount = splitAmountOverride ?? defaultSplitAmount
  const accentColor = type === 'income' ? '#2E7D32' : '#D6303C'

  function handleTypeChange(nextType: 'expense' | 'income') {
    setType(nextType)
    if (nextType === 'income') {
      setCategoryId('')
      setEnableSplit(false)
      setSplitAmountOverride(null)
    } else {
      const firstOfType = categories.find((c) => c.type === 'expense')
      setCategoryId(firstOfType?.id ?? '')
    }
  }

  useEffect(() => {
    if (state && 'success' in state) {
      formRef.current?.reset()
      setAmount('')
      setEnableSplit(false)
      setSplitAmountOverride(null)
      setDayOfMonth(1)
      setStartMonth(thisMonthValue())
      setIsPermanent(false)
    }
  }, [state])

  return (
    <form ref={formRef} action={action} className="flex flex-col gap-3">
      <input type="hidden" name="type" value={type} />
      <input type="hidden" name="category_id" value={categoryId} />

      <div className="flex justify-center gap-2">
        {(['expense', 'income'] as const).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => handleTypeChange(t)}
            className="tap-feedback rounded-full px-4 py-1 text-xs font-semibold"
            style={{
              background: type === t ? (t === 'income' ? '#2E7D32' : '#D6303C') : '#F5EDEC',
              color: type === t ? '#FFFFFF' : '#6B615C',
            }}
          >
            {t === 'expense' ? '支出' : '收入'}
          </button>
        ))}
      </div>

      <div>
        <div className="mb-1.5 text-xs text-muted">金額</div>
        <input
          name="amount"
          type="number"
          step="0.01"
          min="0"
          placeholder="0"
          required
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          className="w-full rounded-[var(--radius-default)] border border-[var(--color-border)] px-4 py-2.5 text-sm outline-none focus:border-primary"
        />
      </div>

      {type === 'expense' && (
        <div>
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

      <div>
        <div className="mb-1.5 text-xs text-muted">週期</div>
        <div className="flex gap-2">
          {INTERVAL_PRESETS.map((preset) => (
            <button
              key={preset.value}
              type="button"
              onClick={() => setIntervalMonths(preset.value)}
              className="tap-feedback rounded-full px-4 py-2 text-[13px] font-semibold"
              style={{
                background: intervalMonths === preset.value ? accentColor : '#F5EDEC',
                color: intervalMonths === preset.value ? '#FFFFFF' : '#6B615C',
              }}
            >
              {preset.label}
            </button>
          ))}
        </div>
        <input type="hidden" name="interval_months" value={intervalMonths} />
      </div>

      {intervalMonths === 1 ? (
        <div className="flex gap-3">
          <div className="flex-1">
            <div className="mb-1.5 text-xs text-muted">執行日</div>
            <select
              name="day_of_month"
              value={dayOfMonth}
              onChange={(e) => setDayOfMonth(Number(e.target.value))}
              className="w-full rounded-[var(--radius-default)] border border-[var(--color-border)] px-3 py-2.5 text-sm text-ink-secondary outline-none focus:border-primary"
            >
              {DAYS_OF_MONTH.map((d) => (
                <option key={d} value={d}>
                  {d} 號
                </option>
              ))}
            </select>
          </div>
          <div className="flex-1">
            <div className="mb-1.5 text-xs text-muted">開始月份</div>
            <input
              name="start_month"
              type="month"
              value={startMonth}
              onChange={(e) => setStartMonth(e.target.value)}
              required
              className="w-full rounded-[var(--radius-default)] border border-[var(--color-border)] px-3 py-2.5 text-sm text-ink-secondary outline-none focus:border-primary"
            />
          </div>
        </div>
      ) : (
        <div className="flex-1">
          <div className="mb-1.5 text-xs text-muted">開始日期</div>
          <input
            name="start_date"
            type="date"
            defaultValue={todayISO()}
            required
            className="w-full rounded-[var(--radius-default)] border border-[var(--color-border)] px-3 py-2.5 text-sm text-ink-secondary outline-none focus:border-primary"
          />
        </div>
      )}

      <div>
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
            className="w-full rounded-[var(--radius-default)] border border-[var(--color-border)] px-3 py-2.5 text-sm text-ink-secondary outline-none focus:border-primary"
          />
        )}
      </div>

      {type === 'expense' && profiles.length >= 2 && (
        <div className="rounded-2xl border border-[var(--color-border)] p-3.5">
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
        className="w-full rounded-[var(--radius-default)] border border-[var(--color-border)] px-4 py-2.5 text-sm outline-none focus:border-primary"
      />

      {state && 'error' in state && (
        <p className="text-sm text-primary" role="alert">
          {state.error}
        </p>
      )}

      <button
        type="submit"
        disabled={pending || (type === 'expense' && !categoryId)}
        style={{ background: accentColor }}
        className="tap-feedback rounded-[var(--radius-default)] py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-60"
      >
        {pending ? '新增中…' : type === 'income' ? '新增定期收入' : '新增定期支出'}
      </button>
    </form>
  )
}

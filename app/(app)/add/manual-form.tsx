'use client'

import { useActionState, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createTransaction } from '@/app/actions/transactions'
import InlineCategoryCreator from '@/components/inline-category-creator'

type Category = { id: string; name: string; color: string | null; type: 'income' | 'expense' }
type Profile = { id: string; display_name: string }

function todayISO() {
  return new Date().toISOString().slice(0, 10)
}

export default function ManualForm({
  categories,
  profiles,
  currentUserId,
  onBack,
  initialAmount,
  initialNote,
}: {
  categories: Category[]
  profiles: Profile[]
  currentUserId: string
  onBack: () => void
  initialAmount?: string
  initialNote?: string
}) {
  const router = useRouter()
  const [state, action, pending] = useActionState(createTransaction, undefined)
  const [type, setType] = useState<'expense' | 'income'>('expense')
  const categoriesForType = categories.filter((c) => c.type === type)
  const [categoryId, setCategoryId] = useState(categoriesForType[0]?.id ?? '')
  const [savedMerchant, setSavedMerchant] = useState('')
  const [savedAmount, setSavedAmount] = useState('')
  const [amount, setAmount] = useState(initialAmount ?? '')
  const [enableSplit, setEnableSplit] = useState(false)
  const [payerId, setPayerId] = useState(currentUserId)
  const [splitAmountOverride, setSplitAmountOverride] = useState<string | null>(null)
  const otherProfile = profiles.find((p) => p.id !== payerId)

  const amountNum = parseFloat(amount)
  const defaultSplitAmount =
    amountNum > 0 ? String(Math.round((amountNum / 2) * 100) / 100) : ''
  const splitAmount = splitAmountOverride ?? defaultSplitAmount

  function handleTypeChange(nextType: 'expense' | 'income') {
    setType(nextType)
    const firstOfType = categories.find((c) => c.type === nextType)
    setCategoryId(firstOfType?.id ?? '')
  }

  useEffect(() => {
    if (state?.success) {
      router.refresh()
    }
  }, [state, router])

  if (state?.success) {
    const category = categories.find((c) => c.id === categoryId)
    return (
      <div className="flex flex-col items-center px-5 pt-15">
        <div
          className="grid place-items-center rounded-full bg-primary"
          style={{ width: 80, height: 80 }}
        >
          <div
            style={{
              width: 26,
              height: 14,
              borderLeft: '4px solid white',
              borderBottom: '4px solid white',
              transform: 'rotate(-45deg) translate(2px, -3px)',
            }}
          />
        </div>
        <div className="mt-6 text-xl font-extrabold text-ink">新增成功</div>
        <div className="mt-2 text-sm text-muted">
          {category?.name ?? savedMerchant} · -NT${savedAmount}
        </div>
        <div className="mt-9 flex w-full gap-3">
          <Link
            href="/records"
            className="tap-feedback flex-1 rounded-2xl border border-[var(--color-border)] py-3.5 text-center text-sm font-bold text-ink"
          >
            查看紀錄
          </Link>
          <Link
            href="/"
            className="tap-feedback flex-1 rounded-2xl bg-primary py-3.5 text-center text-sm font-bold text-white"
          >
            回首頁
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div>
      <div className="mb-5">
        <button
          type="button"
          onClick={onBack}
          className="tap-feedback flex h-9 w-9 items-center justify-center rounded-full"
        >
          <span
            className="h-2 w-2 border-b-2 border-l-2 border-muted"
            style={{ transform: 'rotate(45deg)' }}
          />
        </button>
      </div>

      <form
        action={(formData) => {
          setSavedAmount(formData.get('amount') as string)
          const cat = categories.find((c) => c.id === formData.get('category_id'))
          setSavedMerchant(cat?.name ?? '')
          action(formData)
        }}
      >
        <input type="hidden" name="type" value={type} />
        <input type="hidden" name="category_id" value={categoryId} />

        <div className="mb-1.5 flex justify-center gap-2">
          {(['expense', 'income'] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => handleTypeChange(t)}
              className="tap-feedback rounded-full px-4 py-1 text-xs font-semibold"
              style={{
                background: type === t ? '#D6303C' : '#F5EDEC',
                color: type === t ? '#FFFFFF' : '#6B615C',
              }}
            >
              {t === 'expense' ? '支出' : '收入'}
            </button>
          ))}
        </div>

        <div
          className="mb-6 flex items-center justify-center gap-1.5 rounded-3xl border border-white/60 py-6 backdrop-blur-md"
          style={{
            background:
              'linear-gradient(180deg, rgba(255,255,255,0.55), rgba(255,255,255,0.25))',
            boxShadow: '0 8px 24px -12px rgba(43,35,32,0.15)',
          }}
        >
          <span className="pb-1 text-lg font-bold text-primary/70">NT$</span>
          <input
            name="amount"
            type="number"
            step="0.01"
            min="0"
            placeholder="0"
            required
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="w-40 bg-transparent text-center text-4xl font-extrabold text-primary outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
          />
        </div>

        <div className="mb-2.5 text-sm font-semibold text-muted">分類</div>
        {categoriesForType.length === 0 && (
          <p className="mb-5 text-sm text-faint">
            尚無此類型的分類，請先到「我的」→「分類管理」新增
          </p>
        )}
        <div className="mb-5 flex flex-wrap items-center gap-2">
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
          placeholder="備註（選填）"
          defaultValue={initialNote}
          className="mb-3 w-full rounded-2xl border border-[var(--color-border)] p-3.5 text-sm outline-none focus:border-primary"
        />
        <input
          name="date"
          type="date"
          defaultValue={todayISO()}
          required
          className="w-full rounded-2xl border border-[var(--color-border)] p-3.5 text-sm text-ink-secondary outline-none focus:border-primary"
        />

        {state?.error && (
          <p className="mt-2.5 text-xs text-primary" role="alert">
            {state.error}
          </p>
        )}

        <button
          type="submit"
          disabled={pending || !categoryId}
          className="tap-feedback mt-6 w-full rounded-2xl bg-primary py-4 text-base font-bold text-white disabled:opacity-60"
        >
          {pending ? '儲存中…' : '儲存'}
        </button>
      </form>
    </div>
  )
}

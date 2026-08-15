'use client'

import { useActionState, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { updateTransaction } from '@/app/actions/transactions'
import { formatMoney, formatDateLabel } from '@/lib/format'
import InlineCategoryCreator from '@/components/inline-category-creator'

type Category = { id: string; name: string; color: string | null; type: 'income' | 'expense' }
type Profile = { id: string; display_name: string }
type Transaction = {
  id: string
  amount: number
  type: 'income' | 'expense'
  category_id: string | null
  note: string | null
  transaction_date: string
  payer_id: string | null
  split_amount: number | null
  settlement_id: string | null
}

export default function RecordDetail({
  transaction,
  categories,
  profiles,
  currentUserId,
}: {
  transaction: Transaction
  categories: Category[]
  profiles: Profile[]
  currentUserId: string
}) {
  const router = useRouter()
  const isSettled = !!transaction.settlement_id
  const [editing, setEditing] = useState(false)

  const category = transaction.category_id
    ? categories.find((c) => c.id === transaction.category_id)
    : undefined

  const boundUpdate = updateTransaction.bind(null, transaction.id)
  const [state, action, pending] = useActionState(boundUpdate, undefined)

  const [type, setType] = useState<'expense' | 'income'>(transaction.type)
  const categoriesForType = categories.filter((c) => c.type === type)
  const [categoryId, setCategoryId] = useState(transaction.category_id ?? '')
  const [amount, setAmount] = useState(String(transaction.amount))
  const [enableSplit, setEnableSplit] = useState(!!transaction.payer_id)
  const [payerId, setPayerId] = useState(transaction.payer_id ?? currentUserId)
  const [splitAmountOverride, setSplitAmountOverride] = useState<string | null>(
    transaction.split_amount != null ? String(transaction.split_amount) : null
  )
  const otherProfile = profiles.find((p) => p.id !== payerId)
  const accentColor = type === 'income' ? '#2E7D32' : '#D6303C'

  const amountNum = parseFloat(amount)
  const defaultSplitAmount = amountNum > 0 ? String(Math.round((amountNum / 2) * 100) / 100) : ''
  const splitAmount = splitAmountOverride ?? defaultSplitAmount

  function handleTypeChange(nextType: 'expense' | 'income') {
    setType(nextType)
    const firstOfType = categories.find((c) => c.type === nextType)
    setCategoryId(firstOfType?.id ?? '')
  }

  if (state?.success) {
    router.refresh()
    setEditing(false)
  }

  if (!editing) {
    return (
      <div className="px-5 pb-5 pt-7">
        <div className="mb-5 flex items-center justify-between">
          <Link
            href="/records"
            className="tap-feedback flex h-9 w-9 items-center justify-center rounded-full"
          >
            <span
              className="h-2 w-2 border-b-2 border-l-2 border-muted"
              style={{ transform: 'rotate(45deg)' }}
            />
          </Link>
          {!isSettled && (
            <button
              type="button"
              onClick={() => setEditing(true)}
              className="tap-feedback rounded-full px-3 py-1.5 text-xs font-semibold text-primary"
            >
              編輯
            </button>
          )}
        </div>

        <div className="mb-6 flex flex-col items-center pt-4">
          <div
            className="grid place-items-center rounded-full text-lg font-bold text-white"
            style={{
              width: 56,
              height: 56,
              background: transaction.type === 'income' ? '#2E7D32' : category?.color ?? '#9C9490',
            }}
          >
            {transaction.type === 'income' ? '收' : (category?.name ?? '其').charAt(0)}
          </div>
          <div
            className="mt-4 text-3xl font-extrabold"
            style={{ color: transaction.type === 'income' ? '#2E7D32' : '#D6303C' }}
          >
            {transaction.type === 'income' ? '+' : '-'}
            {formatMoney(transaction.amount)}
          </div>
          {transaction.type === 'expense' && (
            <div className="mt-1 text-sm text-muted">{category?.name ?? '未分類'}</div>
          )}
        </div>

        {isSettled && (
          <div className="mb-5 rounded-2xl bg-primary-light p-4 text-center text-[13px] text-primary">
            已結算，不可編輯
          </div>
        )}

        <div className="flex flex-col divide-y divide-[var(--color-border-light)] rounded-2xl border border-[var(--color-border-light)]">
          <div className="flex items-center justify-between p-4 text-sm">
            <span className="text-muted">日期</span>
            <span className="font-semibold text-ink">
              {formatDateLabel(transaction.transaction_date)}
            </span>
          </div>
          <div className="flex items-center justify-between p-4 text-sm">
            <span className="text-muted">備註</span>
            <span className="font-semibold text-ink">{transaction.note || '（無備註）'}</span>
          </div>
          {transaction.payer_id && (
            <div className="flex items-center justify-between p-4 text-sm">
              <span className="text-muted">代墊者</span>
              <span className="font-semibold text-ink">
                {profiles.find((p) => p.id === transaction.payer_id)?.display_name ?? '未知'}
              </span>
            </div>
          )}
          {transaction.split_amount != null && (
            <div className="flex items-center justify-between p-4 text-sm">
              <span className="text-muted">對方應分攤</span>
              <span className="font-semibold text-ink">{formatMoney(transaction.split_amount)}</span>
            </div>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="px-5 pb-5 pt-7">
      <div className="mb-5">
        <button
          type="button"
          onClick={() => setEditing(false)}
          className="tap-feedback flex h-9 w-9 items-center justify-center rounded-full"
        >
          <span
            className="h-2 w-2 border-b-2 border-l-2 border-muted"
            style={{ transform: 'rotate(45deg)' }}
          />
        </button>
      </div>

      <form action={action}>
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
                background: type === t ? (t === 'income' ? '#2E7D32' : '#D6303C') : '#F5EDEC',
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

        <div className="mb-2.5 text-sm font-semibold text-muted">分類</div>
        {categoriesForType.length === 0 && (
          <p className="mb-5 text-sm text-faint">尚無此類型的分類，請先到「我的」→「分類管理」新增</p>
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
          defaultValue={transaction.note ?? ''}
          className="mb-3 w-full rounded-2xl border border-[var(--color-border)] p-3.5 text-sm outline-none focus:border-primary"
        />
        <input
          name="date"
          type="date"
          defaultValue={transaction.transaction_date}
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
          {pending ? '儲存中…' : '儲存變更'}
        </button>
      </form>
    </div>
  )
}

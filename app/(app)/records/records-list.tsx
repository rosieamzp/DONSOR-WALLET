'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { deleteTransaction } from '@/app/actions/transactions'
import { formatMoney, formatDateLabel } from '@/lib/format'
import { useConfirm } from '@/components/confirm-dialog'

type Category = { id: string; name: string; color: string | null }
type Transaction = {
  id: string
  amount: number
  type: 'income' | 'expense'
  category_id: string | null
  note: string | null
  transaction_date: string
  settlement_id: string | null
}

export default function RecordsList({
  transactions,
  categories,
}: {
  transactions: Transaction[]
  categories: Category[]
}) {
  const [filter, setFilter] = useState<string>('all')
  const [pending, startTransition] = useTransition()
  const confirm = useConfirm()

  const categoryMap = new Map(categories.map((c) => [c.id, c]))

  const filtered =
    filter === 'all' ? transactions : transactions.filter((t) => t.category_id === filter)

  const groups = new Map<string, Transaction[]>()
  filtered.forEach((t) => {
    const list = groups.get(t.transaction_date) ?? []
    list.push(t)
    groups.set(t.transaction_date, list)
  })
  const sortedDates = Array.from(groups.keys()).sort((a, b) => b.localeCompare(a))

  return (
    <div>
      <div className="scrollbar-hide mb-5 flex gap-2 overflow-x-auto px-5">
        <button
          type="button"
          onClick={() => setFilter('all')}
          className="tap-feedback flex-none whitespace-nowrap rounded-full px-4 py-2 text-[13px] font-semibold"
          style={{
            background: filter === 'all' ? '#D6303C' : '#F5EDEC',
            color: filter === 'all' ? '#FFFFFF' : '#6B615C',
          }}
        >
          全部
        </button>
        {categories.map((c) => (
          <button
            key={c.id}
            type="button"
            onClick={() => setFilter(c.id)}
            className="tap-feedback flex-none whitespace-nowrap rounded-full px-4 py-2 text-[13px] font-semibold"
            style={{
              background: filter === c.id ? '#D6303C' : '#F5EDEC',
              color: filter === c.id ? '#FFFFFF' : '#6B615C',
            }}
          >
            {c.name}
          </button>
        ))}
      </div>

      <div className="px-5">
        {sortedDates.length === 0 && (
          <p className="py-15 text-center text-sm text-faint">此分類尚無紀錄</p>
        )}

        {sortedDates.map((date) => (
          <div key={date} className="mb-4.5">
            <div className="mb-2 text-xs font-semibold text-faint">{formatDateLabel(date)}</div>
            <div className="flex flex-col gap-2.5">
              {groups.get(date)!.map((t) => {
                const category = t.category_id ? categoryMap.get(t.category_id) : undefined
                const color = category?.color ?? '#9C9490'
                return (
                  <Link
                    key={t.id}
                    href={`/records/${t.id}`}
                    className="tap-feedback flex items-center gap-3 rounded-2xl border border-[var(--color-border-light)] p-3"
                  >
                    <div
                      className="grid h-10 w-10 flex-none place-items-center rounded-xl text-sm font-bold text-white"
                      style={{ background: t.type === 'income' ? '#2E7D32' : color }}
                    >
                      {t.type === 'income' ? '收' : (category?.name ?? '其').charAt(0)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <div className="truncate text-sm font-semibold text-ink">
                          {t.note || (t.type === 'income' ? '收入' : category?.name) || '未分類'}
                        </div>
                        {t.settlement_id && (
                          <span className="flex-none rounded-full bg-primary-light px-1.5 py-0.5 text-[10px] font-semibold text-primary">
                            已結算
                          </span>
                        )}
                      </div>
                      {t.type === 'expense' && (
                        <div className="mt-0.5 text-[11px] text-faint">
                          {category?.name ?? '未分類'}
                        </div>
                      )}
                    </div>
                    <div
                      className="flex-none text-sm font-bold"
                      style={{ color: t.type === 'income' ? '#2E7D32' : '#D6303C' }}
                    >
                      {t.type === 'income' ? '+' : '-'}
                      {formatMoney(t.amount)}
                    </div>
                    {!t.settlement_id && (
                      <button
                        type="button"
                        disabled={pending}
                        onClick={async (e) => {
                          e.preventDefault()
                          e.stopPropagation()
                          if (await confirm({ message: '確定要刪除這筆紀錄嗎？', danger: true })) {
                            startTransition(() => deleteTransaction(t.id))
                          }
                        }}
                        className="tap-feedback flex-none rounded-md px-1.5 py-0.5 text-xs text-faint disabled:opacity-50"
                      >
                        刪除
                      </button>
                    )}
                  </Link>
                )
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

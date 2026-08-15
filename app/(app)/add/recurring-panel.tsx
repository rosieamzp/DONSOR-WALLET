'use client'

import { useState } from 'react'
import { formatMoney } from '@/lib/format'
import RecurringForm from './recurring-form'
import RecurringItem from './recurring-item'

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

export default function RecurringPanel({
  categories,
  profiles,
  recurringExpenses,
}: {
  categories: Category[]
  profiles: Profile[]
  recurringExpenses: Recurring[]
}) {
  const categoryMap = new Map(categories.map((c) => [c.id, c]))
  const profileMap = new Map(profiles.map((p) => [p.id, p.display_name]))
  const [type, setType] = useState<'expense' | 'income'>('expense')
  const rulesForType = recurringExpenses.filter((r) => r.type === type)

  function renderRule(r: Recurring) {
    return (
      <RecurringItem
        key={r.id}
        recurring={r}
        categories={categories}
        profiles={profiles}
        categoryName={categoryMap.get(r.category_id ?? '')?.name ?? '未分類'}
        categoryColor={categoryMap.get(r.category_id ?? '')?.color ?? '#9C9490'}
        payerName={r.payer_id ? profileMap.get(r.payer_id) ?? null : null}
        formattedAmount={formatMoney(r.amount)}
      />
    )
  }

  return (
    <div>
      <div className="mb-6 rounded-[20px] border border-[var(--color-border)] p-5">
        <RecurringForm categories={categories} profiles={profiles} type={type} onTypeChange={setType} />
      </div>

      <div className="mb-1 text-sm font-bold text-ink">
        {type === 'expense' ? '定期支出規則' : '定期收入規則'}
      </div>
      {rulesForType.length === 0 ? (
        <p className="py-2 text-sm text-faint">
          {type === 'expense' ? '尚未設定定期支出' : '尚未設定定期收入'}
        </p>
      ) : (
        <div className="flex flex-col gap-2.5">{rulesForType.map(renderRule)}</div>
      )}
    </div>
  )
}

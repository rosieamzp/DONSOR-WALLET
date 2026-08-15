import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { formatMoney, formatDateLabel } from '@/lib/format'

function currentMonthValue() {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
}

function monthRange(monthValue: string) {
  const [year, month] = monthValue.split('-').map(Number)
  const start = new Date(year, month - 1, 1)
  const end = new Date(year, month, 1)
  const toISODate = (d: Date) => d.toISOString().slice(0, 10)
  return { start: toISODate(start), end: toISODate(end) }
}

function adjacentMonth(monthValue: string, delta: number) {
  const [year, month] = monthValue.split('-').map(Number)
  const d = new Date(year, month - 1 + delta, 1)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

function monthLabel(monthValue: string) {
  const [year, month] = monthValue.split('-').map(Number)
  return `${year}年${month}月`
}

export default async function StatsPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string }>
}) {
  const { month: monthParam } = await searchParams
  const monthValue = monthParam && /^\d{4}-\d{2}$/.test(monthParam) ? monthParam : currentMonthValue()

  const supabase = await createClient()
  const { start, end } = monthRange(monthValue)

  const [{ data: transactions }, { data: categories }] = await Promise.all([
    supabase
      .from('transactions')
      .select('id, amount, type, category_id, note, transaction_date')
      .gte('transaction_date', start)
      .lt('transaction_date', end)
      .order('transaction_date', { ascending: false })
      .order('created_at', { ascending: false }),
    supabase.from('categories').select('id, name, color').order('created_at', { ascending: true }),
  ])

  const all = transactions ?? []
  const expenses = all.filter((t) => t.type === 'expense')
  const incomes = all.filter((t) => t.type === 'income')
  const monthTotal = expenses.reduce((sum, t) => sum + t.amount, 0)
  const incomeTotal = incomes.reduce((sum, t) => sum + t.amount, 0)
  const balance = incomeTotal - monthTotal
  const isPositive = balance >= 0

  const categoryMap = new Map((categories ?? []).map((c) => [c.id, c]))

  const catTotals = new Map<string, number>()
  for (const t of expenses) {
    if (!t.category_id) continue
    catTotals.set(t.category_id, (catTotals.get(t.category_id) ?? 0) + t.amount)
  }
  let topCategory: { name: string; total: number; pct: number } | null = null
  for (const [categoryId, total] of catTotals) {
    if (!topCategory || total > topCategory.total) {
      topCategory = {
        name: categoryMap.get(categoryId)?.name ?? '未分類',
        total,
        pct: monthTotal ? Math.round((total / monthTotal) * 100) : 0,
      }
    }
  }

  const itemsByDate = new Map<string, typeof all>()
  for (const t of all) {
    const list = itemsByDate.get(t.transaction_date) ?? []
    list.push(t)
    itemsByDate.set(t.transaction_date, list)
  }
  const sortedDates = Array.from(itemsByDate.keys()).sort((a, b) => b.localeCompare(a))

  return (
    <div className="px-5 pb-5 pt-7">
      <div className="mb-5 flex items-center justify-between">
        <Link
          href={`/stats?month=${adjacentMonth(monthValue, -1)}`}
          className="tap-feedback flex h-9 w-9 items-center justify-center rounded-full"
          aria-label="上個月"
        >
          <span
            className="h-2 w-2 border-b-2 border-l-2 border-muted"
            style={{ transform: 'rotate(45deg)' }}
          />
        </Link>
        <div className="text-sm font-bold text-ink">{monthLabel(monthValue)}</div>
        <Link
          href={`/stats?month=${adjacentMonth(monthValue, 1)}`}
          className="tap-feedback flex h-9 w-9 items-center justify-center rounded-full"
          aria-label="下個月"
        >
          <span
            className="h-2 w-2 border-t-2 border-r-2 border-muted"
            style={{ transform: 'rotate(45deg)' }}
          />
        </Link>
      </div>

      <div
        className="mb-5 rounded-3xl p-5 text-white"
        style={{ background: 'linear-gradient(135deg, #E6434E, #A8232C)' }}
      >
        <div className="text-[13px] opacity-85">{monthLabel(monthValue)}總支出</div>
        <div className="mt-1.5 text-3xl font-extrabold">{formatMoney(monthTotal)}</div>
      </div>

      <div
        className="glass mb-6 rounded-3xl p-5"
        style={{ background: 'rgba(255,255,255,0.75)' }}
      >
        <div className="flex justify-between text-[13px]">
          <div>
            <div className="text-muted">收入</div>
            <div className="mt-1 text-base font-bold" style={{ color: '#2E7D32' }}>
              +{formatMoney(incomeTotal)}
            </div>
          </div>
          <div>
            <div className="text-muted">支出</div>
            <div className="mt-1 text-base font-bold text-primary">-{formatMoney(monthTotal)}</div>
          </div>
          <div>
            <div className="text-muted">結余</div>
            <div
              className="mt-1 text-base font-bold"
              style={{ color: isPositive ? '#2E7D32' : '#D6303C' }}
            >
              {isPositive ? '+' : '-'}
              {formatMoney(Math.abs(balance))}
            </div>
          </div>
        </div>
      </div>

      {topCategory && (
        <div className="mb-5 rounded-2xl bg-primary-light p-4 text-[13px] leading-relaxed text-[#A8232C]">
          {monthLabel(monthValue)}花費最多的分類是「{topCategory.name}」，共{' '}
          {formatMoney(topCategory.total)}，佔整體支出 {topCategory.pct}%。
        </div>
      )}

      <div className="mb-3.5 text-sm font-bold text-ink">明細</div>
      {sortedDates.length === 0 ? (
        <p className="py-10 text-center text-sm text-faint">{monthLabel(monthValue)}尚無紀錄</p>
      ) : (
        sortedDates.map((date) => (
          <div key={date} className="mb-4.5">
            <div className="mb-2 text-xs font-semibold text-faint">{formatDateLabel(date)}</div>
            <div className="flex flex-col gap-2.5">
              {itemsByDate.get(date)!.map((t) => {
                const category = t.category_id ? categoryMap.get(t.category_id) : undefined
                const color = category?.color ?? '#9C9490'
                return (
                  <div
                    key={t.id}
                    className="flex items-center gap-3 rounded-2xl border border-[var(--color-border-light)] p-3"
                  >
                    <div
                      className="grid h-10 w-10 flex-none place-items-center rounded-xl text-sm font-bold text-white"
                      style={{ background: t.type === 'income' ? '#2E7D32' : color }}
                    >
                      {(t.type === 'income' ? t.note : category?.name)?.charAt(0) || '其'}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-semibold text-ink">
                        {t.note || category?.name || '未分類'}
                      </div>
                      <div className="mt-0.5 text-[11px] text-faint">
                        {t.type === 'income' ? '收入' : category?.name ?? '未分類'}
                      </div>
                    </div>
                    <div
                      className="flex-none text-sm font-bold"
                      style={{ color: t.type === 'income' ? '#2E7D32' : '#D6303C' }}
                    >
                      {t.type === 'income' ? '+' : '-'}
                      {formatMoney(t.amount)}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        ))
      )}
    </div>
  )
}

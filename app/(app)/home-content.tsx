import Link from 'next/link'
import { formatMoney, formatDateLabel } from '@/lib/format'

type Category = { id: string; name: string; color: string | null }
type Transaction = {
  id: string
  amount: number
  type: 'income' | 'expense'
  category_id: string | null
  note: string | null
  transaction_date: string
  settlement_id?: string | null
}

export default function HomeContent({
  transactions,
  categories,
}: {
  transactions: Transaction[]
  categories: Category[]
}) {
  const categoryMap = new Map(categories.map((c) => [c.id, c]))

  const expenses = transactions.filter((t) => t.type === 'expense')
  const monthTotal = expenses.reduce((sum, t) => sum + t.amount, 0)

  const catTotalsRaw = categories
    .map((c) => {
      const total = expenses
        .filter((t) => t.category_id === c.id)
        .reduce((sum, t) => sum + t.amount, 0)
      return { ...c, total }
    })
    .filter((c) => c.total > 0)
    .sort((a, b) => b.total - a.total)

  const catTotals = catTotalsRaw.map((c) => ({
    ...c,
    pct: monthTotal ? Math.round((c.total / monthTotal) * 100) : 0,
  }))

  let acc = 0
  const donutStops = catTotals.map((c) => {
    const start = acc
    acc += c.pct
    return `${c.color ?? '#9C9490'} ${start}% ${acc}%`
  })
  const donutGradient =
    catTotals.length > 0 ? `conic-gradient(${donutStops.join(', ')})` : 'conic-gradient(#F0E4E2 0% 100%)'

  const recent = [...transactions]
    .sort((a, b) => b.transaction_date.localeCompare(a.transaction_date))
    .slice(0, 5)

  return (
    <div>
      <div
        className="mb-5 rounded-3xl p-6 text-white"
        style={{
          background: 'linear-gradient(135deg, #E6434E, #A8232C)',
          boxShadow: '0 16px 32px -14px rgba(168,35,44,0.55)',
        }}
      >
        <div className="text-[13px] opacity-85">{new Date().getMonth() + 1}月支出</div>
        <div className="mt-2 text-4xl font-extrabold tracking-tight">
          {formatMoney(monthTotal)}
        </div>
        <div className="mt-1 text-xs opacity-85">共 {expenses.length} 筆消費</div>
      </div>

      {catTotals.length > 0 && (
        <div className="glass mb-5 rounded-[20px] p-5">
          <div className="flex items-center gap-5">
            <div
              className="relative flex-none rounded-full"
              style={{ width: 104, height: 104, background: donutGradient }}
            >
              <div className="absolute inset-2.5 grid place-items-center rounded-full bg-white text-[13px] font-bold text-ink">
                {formatMoney(monthTotal)}
              </div>
            </div>
            <div className="flex min-w-0 flex-1 flex-col gap-2">
              {catTotals.slice(0, 5).map((c) => (
                <div key={c.id} className="flex items-center gap-2 text-xs">
                  <div
                    className="h-2 w-2 flex-none rounded-full"
                    style={{ background: c.color ?? '#9C9490' }}
                  />
                  <div className="flex-1 truncate text-ink-secondary">{c.name}</div>
                  <div className="flex-none text-faint">
                    {formatMoney(c.total)} · {c.pct}%
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <div>
        <div className="mb-3 flex items-center justify-between">
          <div className="text-sm font-bold text-ink">最近紀錄</div>
          <Link
            href="/records"
            className="tap-feedback rounded-lg px-1.5 py-0.5 text-xs font-semibold text-primary"
          >
            查看全部
          </Link>
        </div>

        {recent.length === 0 && (
          <p className="py-10 text-center text-sm text-faint">
            還沒有任何紀錄，點下方「新增」開始記帳吧
          </p>
        )}

        <div className="flex flex-col gap-2.5">
          {recent.map((t) => {
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
                  <div className="mt-0.5 text-[11px] text-faint">
                    {t.type === 'expense' ? `${category?.name ?? '未分類'} · ` : ''}
                    {formatDateLabel(t.transaction_date)}
                  </div>
                </div>
                <div
                  className="flex-none text-sm font-bold"
                  style={{ color: t.type === 'income' ? '#2E7D32' : '#D6303C' }}
                >
                  {t.type === 'income' ? '+' : '-'}
                  {formatMoney(t.amount)}
                </div>
              </Link>
            )
          })}
        </div>
      </div>
    </div>
  )
}

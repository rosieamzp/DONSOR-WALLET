import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { formatMoney } from '@/lib/format'

function formatDateTime(iso: string) {
  const dt = new Date(iso)
  return `${dt.getFullYear()}/${dt.getMonth() + 1}/${dt.getDate()}`
}

export default async function SettlementHistoryPage() {
  const supabase = await createClient()

  const [{ data: profiles }, { data: settlements }, { data: categories }] = await Promise.all([
    supabase.from('profiles').select('id, display_name'),
    supabase
      .from('settlements')
      .select('id, owed_by, owed_to, total_amount, confirmed_at')
      .eq('status', 'confirmed')
      .order('confirmed_at', { ascending: false }),
    supabase.from('categories').select('id, name'),
  ])

  const profileMap = new Map((profiles ?? []).map((p) => [p.id, p.display_name]))
  const categoryMap = new Map((categories ?? []).map((c) => [c.id, c.name]))
  const history = settlements ?? []

  const settlementIds = history.map((s) => s.id)
  const { data: allTransactions } =
    settlementIds.length > 0
      ? await supabase
          .from('transactions')
          .select('id, note, category_id, payer_id, split_amount, transaction_date, settlement_id')
          .in('settlement_id', settlementIds)
          .order('transaction_date', { ascending: false })
      : { data: [] }

  const transactionsBySettlement = new Map<string, typeof allTransactions>()
  for (const t of allTransactions ?? []) {
    if (!t.settlement_id) continue
    const list = transactionsBySettlement.get(t.settlement_id) ?? []
    list.push(t)
    transactionsBySettlement.set(t.settlement_id, list)
  }

  return (
    <div className="px-5 pb-5 pt-7">
      <div className="mb-5">
        <Link
          href="/settlement"
          className="tap-feedback flex h-9 w-9 items-center justify-center rounded-full"
        >
          <span
            className="h-2 w-2 border-b-2 border-l-2 border-muted"
            style={{ transform: 'rotate(45deg)' }}
          />
        </Link>
      </div>

      {history.length === 0 ? (
        <p className="py-10 text-center text-sm text-faint">尚無已確認的結算紀錄</p>
      ) : (
        <div className="flex flex-col gap-4">
          {history.map((s) => {
            const details = transactionsBySettlement.get(s.id) ?? []
            return (
              <div
                key={s.id}
                className="overflow-hidden rounded-2xl border border-[var(--color-border-light)]"
              >
                <div className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="text-sm font-semibold text-ink">
                      {profileMap.get(s.owed_by) ?? '對方'} → {profileMap.get(s.owed_to) ?? '對方'}
                    </div>
                    <div className="text-base font-bold text-primary">
                      {formatMoney(s.total_amount)}
                    </div>
                  </div>
                  <div className="mt-1 text-[11px] text-faint">
                    {s.confirmed_at ? formatDateTime(s.confirmed_at) : ''} 確認完成 · 共{' '}
                    {details.length} 筆
                  </div>
                </div>

                {details.length > 0 && (
                  <div className="border-t border-[var(--color-border-light)] bg-[var(--color-border-light)]/30 px-4 py-3">
                    <div className="flex flex-col gap-2">
                      {details.map((t) => (
                        <div key={t.id} className="flex items-center justify-between text-xs">
                          <div className="min-w-0 flex-1 truncate text-ink-secondary">
                            {t.note || categoryMap.get(t.category_id ?? '') || '未分類'} ·{' '}
                            {profileMap.get(t.payer_id ?? '') ?? '代墊者'}代墊
                          </div>
                          <div className="flex-none font-semibold text-muted">
                            {formatMoney(t.split_amount ?? 0)}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { getCurrentUserProfile } from '@/lib/supabase/current-user'
import { formatMoney } from '@/lib/format'
import SettlementActions from './settlement-actions'
import CopyAmountButton from './copy-amount-button'

export default async function SettlementPage() {
  const supabase = await createClient()

  const [currentUser, { data: profiles }, { data: pendingSettlement }] = await Promise.all([
    getCurrentUserProfile(),
    supabase.from('profiles').select('id, display_name'),
    supabase
      .from('settlements')
      .select('id, owed_by, owed_to, total_amount, status, created_by, created_at')
      .eq('status', 'pending')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle(),
  ])

  const profileMap = new Map((profiles ?? []).map((p) => [p.id, p.display_name]))

  const transactionsQuery = supabase
    .from('transactions')
    .select('id, amount, payer_id, split_amount, note, category_id, transaction_date')
    .eq('type', 'expense')
    .not('payer_id', 'is', null)
    .not('split_amount', 'is', null)
    .order('transaction_date', { ascending: false })

  const { data: listedTransactions } = pendingSettlement
    ? await transactionsQuery.eq('settlement_id', pendingSettlement.id)
    : await transactionsQuery.is('settlement_id', null)

  const detailList = listedTransactions ?? []
  const unsettledTotal = detailList.reduce((sum, t) => sum + (t.split_amount ?? 0), 0)

  return (
    <div className="px-5 pb-5 pt-7">
      <div className="mb-5 flex items-center justify-between">
        <Link
          href="/profile"
          className="tap-feedback flex h-9 w-9 items-center justify-center rounded-full"
        >
          <span
            className="h-2 w-2 border-b-2 border-l-2 border-muted"
            style={{ transform: 'rotate(45deg)' }}
          />
        </Link>
        <Link
          href="/settlement/history"
          className="tap-feedback rounded-full px-3 py-1.5 text-xs font-semibold text-primary"
        >
          歷史紀錄
        </Link>
      </div>

      {pendingSettlement ? (
        <div className="glass mb-5 rounded-3xl p-5">
          <div className="mb-1 text-[13px] text-muted">待確認結算</div>
          <div className="mb-2 flex items-center gap-2.5">
            <div className="text-2xl font-extrabold text-ink">
              {formatMoney(pendingSettlement.total_amount)}
            </div>
            <CopyAmountButton amount={pendingSettlement.total_amount} />
          </div>
          <div className="mb-4 text-sm text-muted">
            {profileMap.get(pendingSettlement.owed_by) ?? '對方'} 應付給{' '}
            {profileMap.get(pendingSettlement.owed_to) ?? '對方'}
          </div>
          <SettlementActions
            settlementId={pendingSettlement.id}
            isProposer={pendingSettlement.created_by === currentUser?.id}
          />
        </div>
      ) : (
        <>
          <div className="glass mb-5 rounded-3xl p-5">
            <div className="mb-1 text-[13px] text-muted">目前未結算金額</div>
            <div className="mb-1 text-3xl font-extrabold text-primary">
              {formatMoney(unsettledTotal)}
            </div>
            <div className="text-xs text-faint">共 {detailList.length} 筆代墊紀錄</div>
          </div>

          {detailList.length > 0 && <SettlementActions canPropose />}
        </>
      )}

      {detailList.length > 0 && (
        <div className="mt-6">
          <div className="mb-3 text-sm font-bold text-ink">
            {pendingSettlement ? '本次結算明細' : '未結算明細'}
          </div>
          <div className="flex flex-col gap-2.5">
            {detailList.map((t) => (
              <div
                key={t.id}
                className="flex items-center justify-between rounded-2xl border border-[var(--color-border-light)] p-3"
              >
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-semibold text-ink">
                    {t.note || '（無備註）'}
                  </div>
                  <div className="mt-0.5 text-[11px] text-faint">
                    {profileMap.get(t.payer_id ?? '') ?? '代墊者'} 代墊 · {t.transaction_date}
                  </div>
                </div>
                <div className="flex-none text-sm font-bold text-primary">
                  {formatMoney(t.split_amount ?? 0)}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

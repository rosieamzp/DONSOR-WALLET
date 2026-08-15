import { NextRequest } from 'next/server'
import { createServiceRoleClient } from '@/lib/supabase/service-role'
import { addMonthsClamped } from '@/lib/date-utils'

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response('Unauthorized', { status: 401 })
  }

  const supabase = createServiceRoleClient()
  const todayStr = new Date().toISOString().slice(0, 10)

  const { data: dueRules, error: fetchError } = await supabase
    .from('recurring_expenses')
    .select(
      'id, amount, type, category_id, note, payer_id, split_amount, interval_months, end_date, next_run_date, created_by'
    )
    .eq('is_active', true)
    .lte('next_run_date', todayStr)

  if (fetchError) {
    return Response.json({ error: fetchError.message }, { status: 500 })
  }

  let createdCount = 0
  const errors: string[] = []

  for (const rule of dueRules ?? []) {
    let runDate = rule.next_run_date as string

    // 處理可能因排程中斷而累積多期未執行的情況，逐期補上直到追上今天
    while (runDate <= todayStr) {
      const { error: insertError } = await supabase.from('transactions').insert({
        amount: rule.amount,
        type: rule.type,
        category_id: rule.category_id,
        note: rule.note,
        transaction_date: runDate,
        created_by: rule.created_by,
        payer_id: rule.payer_id,
        split_amount: rule.split_amount,
        recurring_expense_id: rule.id,
      })

      if (insertError) {
        errors.push(`${rule.id}: ${insertError.message}`)
        break
      }

      createdCount++
      runDate = addMonthsClamped(runDate, rule.interval_months)

      if (rule.end_date && runDate > rule.end_date) {
        await supabase.from('recurring_expenses').update({ is_active: false }).eq('id', rule.id)
        runDate = '9999-12-31' // 跳出迴圈
      }
    }

    if (runDate !== '9999-12-31') {
      await supabase.from('recurring_expenses').update({ next_run_date: runDate }).eq('id', rule.id)
    }
  }

  return Response.json({ createdCount, errors })
}

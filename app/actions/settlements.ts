'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

export type CreateSettlementResult =
  | { error: string }
  | { success: true; nothingToSettle: true }
  | { success: true; nothingToSettle: false }

export async function createSettlement(): Promise<CreateSettlementResult> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: '請先登入' }
  }

  const { data: unsettled, error: fetchError } = await supabase
    .from('transactions')
    .select('id, payer_id, split_amount')
    .eq('type', 'expense')
    .is('settlement_id', null)
    .not('payer_id', 'is', null)
    .not('split_amount', 'is', null)

  if (fetchError) {
    return { error: '讀取未結算紀錄失敗，請稍後再試' }
  }

  if (!unsettled || unsettled.length === 0) {
    return { success: true, nothingToSettle: true }
  }

  // 依代墊者加總「對方欠這位代墊者多少」
  const owedToPayer = new Map<string, number>()
  for (const t of unsettled) {
    if (!t.payer_id || t.split_amount == null) continue
    owedToPayer.set(t.payer_id, (owedToPayer.get(t.payer_id) ?? 0) + t.split_amount)
  }

  const payerIds = Array.from(owedToPayer.keys())
  if (payerIds.length === 0) {
    return { success: true, nothingToSettle: true }
  }
  if (payerIds.length > 2) {
    return { error: '結算資料異常（超過兩位代墊者）' }
  }

  // 只有一位代墊者：對方欠這位代墊者的錢
  // 兩位代墊者：互相抵銷後，淨額由欠得多的一方支付給另一方
  let owedBy: string
  let owedTo: string
  let totalAmount: number

  if (payerIds.length === 1) {
    owedTo = payerIds[0]
    const { data: profiles } = await supabase.from('profiles').select('id')
    const other = profiles?.find((p) => p.id !== owedTo)
    if (!other) {
      return { error: '找不到對方使用者' }
    }
    owedBy = other.id
    totalAmount = owedToPayer.get(owedTo) ?? 0
  } else {
    const [idA, idB] = payerIds
    const amountA = owedToPayer.get(idA) ?? 0
    const amountB = owedToPayer.get(idB) ?? 0
    const net = amountA - amountB
    if (net === 0) {
      // 互相抵銷完畢，這批不需要結算金流，但交易仍需標記為已結算
      totalAmount = 0
      owedBy = idA
      owedTo = idB
    } else if (net > 0) {
      owedTo = idA
      owedBy = idB
      totalAmount = net
    } else {
      owedTo = idB
      owedBy = idA
      totalAmount = -net
    }
  }

  const { data: settlement, error: insertError } = await supabase
    .from('settlements')
    .insert({
      owed_by: owedBy,
      owed_to: owedTo,
      total_amount: totalAmount,
      status: 'pending',
      created_by: user.id,
    })
    .select('id')
    .single()

  if (insertError || !settlement) {
    return { error: '建立結算失敗，請稍後再試' }
  }

  const { error: updateError } = await supabase
    .from('transactions')
    .update({ settlement_id: settlement.id })
    .in(
      'id',
      unsettled.map((t) => t.id)
    )

  if (updateError) {
    // 回滾：刪掉剛建立的 pending settlement
    await supabase.from('settlements').delete().eq('id', settlement.id)
    return { error: '標記交易失敗，請稍後再試' }
  }

  revalidatePath('/settlement')
  return { success: true, nothingToSettle: false }
}

export async function confirmSettlement(id: string) {
  const supabase = await createClient()
  const { error } = await supabase
    .from('settlements')
    .update({ status: 'confirmed', confirmed_at: new Date().toISOString() })
    .eq('id', id)
    .eq('status', 'pending')

  if (error) {
    return { error: '確認失敗，請稍後再試' }
  }

  revalidatePath('/settlement')
  revalidatePath('/records')
  return { success: true as const }
}

export async function rejectSettlement(id: string) {
  const supabase = await createClient()

  const { error: unlinkError } = await supabase
    .from('transactions')
    .update({ settlement_id: null })
    .eq('settlement_id', id)

  if (unlinkError) {
    return { error: '駁回失敗，請稍後再試' }
  }

  const { error } = await supabase
    .from('settlements')
    .update({ status: 'rejected', rejected_at: new Date().toISOString() })
    .eq('id', id)
    .eq('status', 'pending')

  if (error) {
    return { error: '駁回失敗，請稍後再試' }
  }

  revalidatePath('/settlement')
  return { success: true as const }
}

export async function cancelSettlement(id: string) {
  const supabase = await createClient()

  const { error: unlinkError } = await supabase
    .from('transactions')
    .update({ settlement_id: null })
    .eq('settlement_id', id)

  if (unlinkError) {
    return { error: '取消失敗，請稍後再試' }
  }

  const { error } = await supabase
    .from('settlements')
    .update({ status: 'cancelled', cancelled_at: new Date().toISOString() })
    .eq('id', id)
    .eq('status', 'pending')

  if (error) {
    return { error: '取消失敗，請稍後再試' }
  }

  revalidatePath('/settlement')
  return { success: true as const }
}

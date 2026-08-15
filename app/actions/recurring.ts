'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { dateISO } from '@/lib/date-utils'

export type RecurringFormState = { error: string } | { success: true } | undefined

export async function createRecurringExpense(
  _prevState: RecurringFormState,
  formData: FormData
): Promise<RecurringFormState> {
  const amountRaw = formData.get('amount') as string
  const type = formData.get('type') as string
  const categoryId = formData.get('category_id') as string
  const note = (formData.get('note') as string)?.trim() || null
  const endDate = (formData.get('end_date') as string) || null
  const intervalMonthsRaw = formData.get('interval_months') as string
  const payerId = (formData.get('payer_id') as string) || null
  const splitAmountRaw = formData.get('split_amount') as string

  const amount = parseFloat(amountRaw)
  if (!amount || amount <= 0) {
    return { error: '請輸入有效的金額' }
  }
  if (type !== 'income' && type !== 'expense') {
    return { error: '類型錯誤' }
  }
  if (type === 'expense' && !categoryId) {
    return { error: '請選擇分類' }
  }
  const intervalMonths = parseInt(intervalMonthsRaw, 10)
  if (intervalMonths !== 1 && intervalMonths !== 12) {
    return { error: '週期只能選每月或每年' }
  }

  let startDate: string
  if (intervalMonths === 1) {
    const startMonth = formData.get('start_month') as string
    const dayOfMonth = parseInt(formData.get('day_of_month') as string, 10)
    if (!startMonth) {
      return { error: '請選擇開始月份' }
    }
    if (!dayOfMonth || dayOfMonth < 1 || dayOfMonth > 31) {
      return { error: '請選擇執行日' }
    }
    const [year, month] = startMonth.split('-').map(Number)
    const todayStr = new Date().toISOString().slice(0, 10)
    let candidate = dateISO(year, month, dayOfMonth)
    if (candidate < todayStr) {
      const nextMonth = month === 12 ? 1 : month + 1
      const nextYear = month === 12 ? year + 1 : year
      candidate = dateISO(nextYear, nextMonth, dayOfMonth)
    }
    startDate = candidate
  } else {
    startDate = formData.get('start_date') as string
    if (!startDate) {
      return { error: '請選擇開始日期' }
    }
  }

  if (endDate && endDate < startDate) {
    return { error: '結束日期不能早於開始日期' }
  }

  let splitAmount: number | null = null
  if (type === 'expense' && payerId && splitAmountRaw) {
    splitAmount = parseFloat(splitAmountRaw)
    if (isNaN(splitAmount) || splitAmount < 0) {
      return { error: '分攤金額格式錯誤' }
    }
    if (splitAmount > amount) {
      return { error: '分攤金額不能超過總金額' }
    }
  }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: '請先登入' }
  }

  const { error } = await supabase.from('recurring_expenses').insert({
    amount,
    type,
    category_id: type === 'expense' ? categoryId : null,
    note,
    payer_id: type === 'expense' ? payerId : null,
    split_amount: type === 'expense' ? splitAmount : null,
    interval_months: intervalMonths,
    start_date: startDate,
    end_date: endDate,
    next_run_date: startDate,
    created_by: user.id,
  })

  if (error) {
    return { error: '新增失敗，請稍後再試' }
  }

  revalidatePath('/add')
  return { success: true }
}

// 找出本月由這條規則產生、且尚未結算的交易（可被同步修改的「本期」交易）
export async function findCurrentPeriodTransaction(recurringExpenseId: string) {
  const supabase = await createClient()
  const now = new Date()
  const monthStart = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`
  const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1)
  const monthEnd = nextMonth.toISOString().slice(0, 10)

  const { data } = await supabase
    .from('transactions')
    .select('id, settlement_id')
    .eq('recurring_expense_id', recurringExpenseId)
    .gte('transaction_date', monthStart)
    .lt('transaction_date', monthEnd)
    .maybeSingle()

  if (!data || data.settlement_id) return null
  return data.id as string
}

export type UpdateRecurringFormState = { error: string } | { success: true } | undefined

export async function updateRecurringExpense(
  id: string,
  applyToCurrentPeriod: boolean,
  _prevState: UpdateRecurringFormState,
  formData: FormData
): Promise<UpdateRecurringFormState> {
  const amountRaw = formData.get('amount') as string
  const type = formData.get('type') as string
  const categoryId = formData.get('category_id') as string
  const note = (formData.get('note') as string)?.trim() || null
  const endDate = (formData.get('end_date') as string) || null
  const payerId = (formData.get('payer_id') as string) || null
  const splitAmountRaw = formData.get('split_amount') as string

  const amount = parseFloat(amountRaw)
  if (!amount || amount <= 0) {
    return { error: '請輸入有效的金額' }
  }
  if (type !== 'income' && type !== 'expense') {
    return { error: '類型錯誤' }
  }
  if (type === 'expense' && !categoryId) {
    return { error: '請選擇分類' }
  }

  let splitAmount: number | null = null
  if (type === 'expense' && payerId && splitAmountRaw) {
    splitAmount = parseFloat(splitAmountRaw)
    if (isNaN(splitAmount) || splitAmount < 0) {
      return { error: '分攤金額格式錯誤' }
    }
    if (splitAmount > amount) {
      return { error: '分攤金額不能超過總金額' }
    }
  }

  const supabase = await createClient()

  const { error } = await supabase
    .from('recurring_expenses')
    .update({
      amount,
      type,
      category_id: type === 'expense' ? categoryId : null,
      note,
      payer_id: type === 'expense' ? payerId : null,
      split_amount: type === 'expense' ? splitAmount : null,
      end_date: endDate,
    })
    .eq('id', id)

  if (error) {
    return { error: '更新失敗，請稍後再試' }
  }

  if (applyToCurrentPeriod) {
    const currentTxId = await findCurrentPeriodTransaction(id)
    if (currentTxId) {
      await supabase
        .from('transactions')
        .update({
          amount,
          type,
          category_id: type === 'expense' ? categoryId : null,
          note,
          payer_id: type === 'expense' ? payerId : null,
          split_amount: type === 'expense' ? splitAmount : null,
        })
        .eq('id', currentTxId)
    }
  }

  revalidatePath('/add')
  revalidatePath('/')
  revalidatePath('/records')
  revalidatePath('/stats')
  return { success: true }
}

export type ToggleRecurringResult = { error: string } | { success: true }

export async function toggleRecurringExpenseActive(
  id: string,
  isActive: boolean
): Promise<ToggleRecurringResult> {
  const supabase = await createClient()
  const { error } = await supabase
    .from('recurring_expenses')
    .update({ is_active: isActive })
    .eq('id', id)

  if (error) {
    return { error: '更新失敗，請稍後再試' }
  }

  revalidatePath('/add')
  return { success: true }
}

export type DeleteRecurringResult = { error: string } | { success: true }

export async function deleteRecurringExpense(id: string): Promise<DeleteRecurringResult> {
  const supabase = await createClient()
  const { error } = await supabase.from('recurring_expenses').delete().eq('id', id)

  if (error) {
    return { error: '刪除失敗，請稍後再試' }
  }

  revalidatePath('/add')
  return { success: true }
}

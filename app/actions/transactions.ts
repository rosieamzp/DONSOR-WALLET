'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

export type CreateTransactionState =
  | { error: string; success?: undefined }
  | { success: true; error?: undefined }
  | undefined

export async function createTransaction(
  _prevState: CreateTransactionState,
  formData: FormData
): Promise<CreateTransactionState> {
  const amountRaw = formData.get('amount') as string
  const type = formData.get('type') as string
  const categoryId = formData.get('category_id') as string
  const note = (formData.get('note') as string)?.trim() || null
  const date = formData.get('date') as string
  const payerId = (formData.get('payer_id') as string) || null
  const splitAmountRaw = formData.get('split_amount') as string

  const amount = parseFloat(amountRaw)

  if (!amount || amount <= 0) {
    return { error: '請輸入有效的金額' }
  }
  if (type !== 'income' && type !== 'expense') {
    return { error: '類型錯誤' }
  }
  if (!categoryId) {
    return { error: '請選擇分類' }
  }
  if (!date) {
    return { error: '請選擇日期' }
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

  const { error } = await supabase.from('transactions').insert({
    amount,
    type,
    category_id: categoryId,
    note,
    transaction_date: date,
    created_by: user.id,
    payer_id: type === 'expense' ? payerId : null,
    split_amount: type === 'expense' ? splitAmount : null,
  })

  if (error) {
    return { error: '新增失敗，請稍後再試' }
  }

  revalidatePath('/')
  revalidatePath('/records')
  revalidatePath('/stats')

  return { success: true }
}

export async function deleteTransaction(id: string) {
  const supabase = await createClient()
  await supabase.from('transactions').delete().eq('id', id)

  revalidatePath('/')
  revalidatePath('/records')
  revalidatePath('/stats')
}

export type UpdateTransactionState =
  | { error: string; success?: undefined }
  | { success: true; error?: undefined }
  | undefined

export async function updateTransaction(
  id: string,
  _prevState: UpdateTransactionState,
  formData: FormData
): Promise<UpdateTransactionState> {
  const amountRaw = formData.get('amount') as string
  const type = formData.get('type') as string
  const categoryId = formData.get('category_id') as string
  const note = (formData.get('note') as string)?.trim() || null
  const date = formData.get('date') as string
  const payerId = (formData.get('payer_id') as string) || null
  const splitAmountRaw = formData.get('split_amount') as string

  const amount = parseFloat(amountRaw)

  if (!amount || amount <= 0) {
    return { error: '請輸入有效的金額' }
  }
  if (type !== 'income' && type !== 'expense') {
    return { error: '類型錯誤' }
  }
  if (!categoryId) {
    return { error: '請選擇分類' }
  }
  if (!date) {
    return { error: '請選擇日期' }
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
    .from('transactions')
    .update({
      amount,
      type,
      category_id: categoryId,
      note,
      transaction_date: date,
      payer_id: type === 'expense' ? payerId : null,
      split_amount: type === 'expense' ? splitAmount : null,
    })
    .eq('id', id)

  if (error) {
    return { error: '此交易已結算完成，不可修改' }
  }

  revalidatePath('/')
  revalidatePath('/records')
  revalidatePath('/stats')
  revalidatePath(`/records/${id}`)

  return { success: true }
}

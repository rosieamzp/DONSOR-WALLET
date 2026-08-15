'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

const PALETTE = ['#D6303C', '#8C3B3B', '#E07C87', '#7A2530', '#C97B5E', '#D99A9A', '#9C9490']

export type CategoryFormState = { error: string } | { success: true; id: string } | undefined

export async function createCategory(
  _prevState: CategoryFormState,
  formData: FormData
): Promise<CategoryFormState> {
  const name = (formData.get('name') as string)?.trim()
  const type = formData.get('type') as string

  if (!name) {
    return { error: '請輸入分類名稱' }
  }
  if (type !== 'income' && type !== 'expense') {
    return { error: '分類類型錯誤' }
  }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: '請先登入' }
  }

  const color = PALETTE[Math.floor(Math.random() * PALETTE.length)]

  const { count } = await supabase
    .from('categories')
    .select('id', { count: 'exact', head: true })
    .eq('type', type)

  const { data: category, error } = await supabase
    .from('categories')
    .insert({ name, type, color, created_by: user.id, sort_order: count ?? 0 })
    .select('id')
    .single()

  if (error || !category) {
    return { error: '新增分類失敗，請稍後再試' }
  }

  revalidatePath('/profile/categories')
  revalidatePath('/add')
  return { success: true, id: category.id }
}

export type UpdateCategoryResult = { error: string } | { success: true }

export async function updateCategoryName(id: string, name: string): Promise<UpdateCategoryResult> {
  const trimmed = name.trim()
  if (!trimmed) {
    return { error: '請輸入分類名稱' }
  }

  const supabase = await createClient()
  const { error } = await supabase.from('categories').update({ name: trimmed }).eq('id', id)

  if (error) {
    return { error: '更新失敗，請稍後再試' }
  }

  revalidatePath('/profile/categories')
  return { success: true }
}

export async function reorderCategories(orderedIds: string[]) {
  const supabase = await createClient()

  await Promise.all(
    orderedIds.map((id, index) =>
      supabase.from('categories').update({ sort_order: index }).eq('id', id)
    )
  )

  revalidatePath('/profile/categories')
  revalidatePath('/records')
}

export type DeleteCategoryResult = { error: string } | { success: true }

export async function deleteCategory(id: string): Promise<DeleteCategoryResult> {
  const supabase = await createClient()

  const { count } = await supabase
    .from('transactions')
    .select('id', { count: 'exact', head: true })
    .eq('category_id', id)

  if (count && count > 0) {
    return { error: '此分類已有紀錄使用，無法刪除' }
  }

  const { error } = await supabase.from('categories').delete().eq('id', id)
  if (error) {
    return { error: '刪除失敗，請稍後再試' }
  }

  revalidatePath('/profile/categories')
  return { success: true }
}

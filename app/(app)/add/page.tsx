import { createClient } from '@/lib/supabase/server'
import { getCurrentUserProfile } from '@/lib/supabase/current-user'
import AddFlow from './add-flow'

export default async function AddPage() {
  const supabase = await createClient()
  const [{ data: categories }, { data: profiles }, currentUser, { data: recurringExpenses }] =
    await Promise.all([
      supabase
        .from('categories')
        .select('id, name, color, type')
        .order('created_at', { ascending: true }),
      supabase
        .from('profiles')
        .select('id, display_name')
        .order('created_at', { ascending: true }),
      getCurrentUserProfile(),
      supabase
        .from('recurring_expenses')
        .select(
          'id, amount, type, category_id, note, payer_id, interval_months, start_date, end_date, next_run_date, is_active'
        )
        .order('is_active', { ascending: false })
        .order('next_run_date', { ascending: true }),
    ])

  return (
    <AddFlow
      categories={categories ?? []}
      profiles={profiles ?? []}
      currentUserId={currentUser?.id ?? ''}
      recurringExpenses={recurringExpenses ?? []}
    />
  )
}

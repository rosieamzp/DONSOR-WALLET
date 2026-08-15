import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getCurrentUserProfile } from '@/lib/supabase/current-user'
import RecordDetail from './record-detail'

export default async function RecordDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()

  const [{ data: transaction }, { data: categories }, { data: profiles }, currentUser] =
    await Promise.all([
      supabase
        .from('transactions')
        .select(
          'id, amount, type, category_id, note, transaction_date, payer_id, split_amount, settlement_id'
        )
        .eq('id', id)
        .maybeSingle(),
      supabase.from('categories').select('id, name, color, type').order('created_at', { ascending: true }),
      supabase.from('profiles').select('id, display_name').order('created_at', { ascending: true }),
      getCurrentUserProfile(),
    ])

  if (!transaction) {
    notFound()
  }

  return (
    <RecordDetail
      transaction={transaction}
      categories={categories ?? []}
      profiles={profiles ?? []}
      currentUserId={currentUser?.id ?? ''}
    />
  )
}

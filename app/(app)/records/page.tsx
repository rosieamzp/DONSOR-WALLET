import { createClient } from '@/lib/supabase/server'
import RecordsList from './records-list'

export default async function RecordsPage() {
  const supabase = await createClient()

  const [{ data: transactions }, { data: categories }] = await Promise.all([
    supabase
      .from('transactions')
      .select('id, amount, type, category_id, note, transaction_date, settlement_id')
      .order('transaction_date', { ascending: false })
      .order('created_at', { ascending: false }),
    supabase.from('categories').select('id, name, color').order('sort_order', { ascending: true }),
  ])

  return (
    <div className="pb-5 pt-7">
      <RecordsList transactions={transactions ?? []} categories={categories ?? []} />
    </div>
  )
}

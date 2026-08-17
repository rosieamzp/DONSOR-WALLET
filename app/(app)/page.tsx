import { getCurrentUserProfile } from '@/lib/supabase/current-user'
import { createClient } from '@/lib/supabase/server'
import { getAvatarSrc } from '@/lib/avatars'
import AvatarMenu from '@/components/avatar-menu'
import HomeContent from './home-content'

function monthRange() {
  const now = new Date()
  const start = new Date(now.getFullYear(), now.getMonth(), 1)
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 1)
  const toISODate = (d: Date) => d.toISOString().slice(0, 10)
  return { start: toISODate(start), end: toISODate(end) }
}

export default async function HomePage() {
  const supabase = await createClient()
  const { start, end } = monthRange()

  const [profile, { data: transactions }, { data: categories }] = await Promise.all([
    getCurrentUserProfile(),
    supabase
      .from('transactions')
      .select('id, amount, type, category_id, note, transaction_date, settlement_id')
      .gte('transaction_date', start)
      .lt('transaction_date', end)
      .order('transaction_date', { ascending: false })
      .order('created_at', { ascending: false }),
    supabase.from('categories').select('id, name, color').order('created_at', { ascending: true }),
  ])

  const hour = new Date().getHours()
  const greeting = hour < 11 ? '早安' : hour < 18 ? '午安' : '晚安'
  const displayName = profile?.displayName ?? ''
  const avatarSrc = getAvatarSrc(displayName)

  return (
    <div className="px-5 pb-5 pt-7">
      <div className="mb-5 flex items-center justify-between">
        <div className="min-w-0">
          <div className="text-[11px] font-bold tracking-[0.2em] text-primary">DONSOR WALLET</div>
          <div className="truncate text-[20px] font-medium text-muted">
            {greeting}，{displayName}
          </div>
        </div>
        <AvatarMenu displayName={displayName} avatarSrc={avatarSrc} />
      </div>

      <HomeContent transactions={transactions ?? []} categories={categories ?? []} />
    </div>
  )
}

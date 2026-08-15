import { createClient } from '@/lib/supabase/server'

export async function getCurrentUserProfile() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return null

  const { data: profile } = await supabase
    .from('profiles')
    .select('id, display_name')
    .eq('id', user.id)
    .single()

  return {
    id: user.id,
    email: user.email ?? '',
    displayName: profile?.display_name ?? user.email?.split('@')[0] ?? '',
  }
}

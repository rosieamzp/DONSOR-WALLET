import { headers } from 'next/headers'
import { createClient } from '@/lib/supabase/server'

export async function getCurrentUserProfile() {
  const supabase = await createClient()

  // middleware（proxy.ts）已經驗證過身份並透過 header 傳下來，
  // 優先使用它避免重複打一次 auth.getUser() 的網路往返
  const headerList = await headers()
  const headerUserId = headerList.get('x-user-id')
  const headerUserEmail = headerList.get('x-user-email')

  let userId: string
  let userEmail: string

  if (headerUserId) {
    userId = headerUserId
    userEmail = headerUserEmail ?? ''
  } else {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return null
    userId = user.id
    userEmail = user.email ?? ''
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('id, display_name')
    .eq('id', userId)
    .single()

  return {
    id: userId,
    email: userEmail,
    displayName: profile?.display_name ?? userEmail.split('@')[0] ?? '',
  }
}

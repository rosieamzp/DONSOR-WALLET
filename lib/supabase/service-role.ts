import { createClient as createSupabaseClient } from '@supabase/supabase-js'

// 僅供伺服器端排程作業使用（例如 cron route），會繞過 RLS，
// 絕對不能在瀏覽器或一般使用者請求路徑中使用。
export function createServiceRoleClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  )
}

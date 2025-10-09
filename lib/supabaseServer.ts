import { createClient } from '@supabase/supabase-js'

export function createServiceSupabaseClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url || !serviceKey) {
    throw new Error('Supabase service credentials are missing')
  }

  return createClient(url, serviceKey)
}

import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

export async function GET(_req: NextRequest) {
  const supabase = createRouteHandlerClient({ cookies })
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data, count, error } = await supabase
    .from('qrs')
    .select('id, code, title, destination_url, is_active, created_at', { count: 'exact' })
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching qrs:', error)
    return NextResponse.json({ error: 'Failed to fetch qrs' }, { status: 500 })
  }

  return NextResponse.json({ qrs: data ?? [], count: count ?? 0 })
}

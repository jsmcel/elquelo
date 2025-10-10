import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { createServiceSupabaseClient } from '@/lib/supabaseServer'

const serviceClient = createServiceSupabaseClient()

export async function GET(_req: NextRequest) {
  try {
    const supabaseAuth = createRouteHandlerClient({ cookies })
    const {
      data: { user },
    } = await supabaseAuth.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: qrs, error } = await serviceClient
      .from('qrs')
      .select('id, code, title, description, event_id, group_id, scan_count, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Failed to load user QRs', error)
      return NextResponse.json({ error: 'Failed to load QRs' }, { status: 500 })
    }

    return NextResponse.json({ qrs: qrs || [] })
  } catch (error) {
    console.error('Error loading QRs:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}





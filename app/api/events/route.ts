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

    const { data: memberships, error: memberError } = await serviceClient
      .from('event_members')
      .select(
        `event_id, role,
         events!inner (
            id, name, description, status, type, event_date, expires_at,
            content_ttl_days, event_timezone, created_at, updated_at
         )`
      )
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (memberError) {
      console.error('Failed to load events for user', memberError)
      return NextResponse.json({ error: 'Failed to load events' }, { status: 500 })
    }

    const eventIds = memberships?.map((item) => item.event_id) ?? []

    let qrCounts: Record<string, { total: number; scans: number }> = {}
    if (eventIds.length > 0) {
      const { data: qrs } = await serviceClient
        .from('qrs')
        .select('event_id, scan_count')
        .in('event_id', eventIds)

      qrCounts = (qrs ?? []).reduce<Record<string, { total: number; scans: number }>>((acc, qr) => {
        if (!qr.event_id) return acc
        const current = acc[qr.event_id] ?? { total: 0, scans: 0 }
        acc[qr.event_id] = {
          total: current.total + 1,
          scans: current.scans + (qr.scan_count ?? 0),
        }
        return acc
      }, {})
    }

    const events = (memberships ?? []).map((item) => {
      const event = (item as any).events
      const counts = qrCounts[event.id] ?? { total: 0, scans: 0 }
      return {
        ...event,
        role: item.role,
        qr_count: counts.total,
        scan_count: counts.scans,
      }
    })

    return NextResponse.json({ events })
  } catch (error) {
    console.error('Error listing events:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { createServiceSupabaseClient } from '@/lib/supabaseServer'

const serviceClient = createServiceSupabaseClient()

export async function GET(
  _req: NextRequest,
  { params }: { params: { eventId: string } }
) {
  try {
    const { eventId } = params
    const supabaseAuth = createRouteHandlerClient({ cookies })
    const {
      data: { user },
    } = await supabaseAuth.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: membership } = await serviceClient
      .from('event_members')
      .select('role')
      .eq('event_id', eventId)
      .eq('user_id', user.id)
      .maybeSingle()

    if (!membership) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const [dailyMetrics, destinations, topScans] = await Promise.all([
      serviceClient
        .from('qr_destination_metrics_daily')
        .select('destination_id, date, scan_count, unique_visitors')
        .in(
          'destination_id',
          (
            await serviceClient
              .from('qr_destinations')
              .select('id')
              .eq('event_id', eventId)
          ).data?.map((dest) => dest.id) || []
        ),
      serviceClient
        .from('qr_destinations')
        .select('id, qr_id, label, type')
        .eq('event_id', eventId),
      serviceClient
        .from('scans')
        .select('destination_id, created_at')
        .eq('event_id', eventId)
        .order('created_at', { ascending: false })
        .limit(1000),
    ])

    const destinationMap = new Map(
      (destinations.data ?? []).map((dest) => [dest.id, dest])
    )

    const byDestination: Record<string, { destination: any; metrics: any[] }> = {}

    ;(dailyMetrics.data ?? []).forEach((row) => {
      if (!destinationMap.has(row.destination_id)) return
      const key = row.destination_id
      const entry = byDestination[key] ?? {
        destination: destinationMap.get(key),
        metrics: [],
      }
      entry.metrics.push({
        date: row.date,
        scanCount: row.scan_count,
        uniqueVisitors: row.unique_visitors,
      })
      byDestination[key] = entry
    })

    const timeline = (topScans.data ?? []).map((scan) => ({
      destinationId: scan.destination_id,
      createdAt: scan.created_at,
      destination: destinationMap.get(scan.destination_id) ?? null,
    }))

    return NextResponse.json({
      destinations: Object.values(byDestination),
      timeline,
    })
  } catch (error) {
    console.error('Error loading analytics:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

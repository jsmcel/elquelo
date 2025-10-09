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

    const { data: membership, error: membershipError } = await serviceClient
      .from('event_members')
      .select('role')
      .eq('event_id', eventId)
      .eq('user_id', user.id)
      .maybeSingle()

    if (membershipError || !membership) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { data: event, error: eventError } = await serviceClient
      .from('events')
      .select(
        'id, name, description, status, type, event_date, expires_at, content_ttl_days, event_timezone, qr_group_id, config, created_at, updated_at'
      )
      .eq('id', eventId)
      .maybeSingle()

    if (eventError || !event) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 })
    }

    const qrQuery = serviceClient
      .from('qrs')
      .select('id, code, scan_count, active_destination_id, last_active_at, event_id, group_id')

    if (event.qr_group_id) {
      qrQuery.or(`event_id.eq.${eventId},group_id.eq.${event.qr_group_id}`)
    } else {
      qrQuery.eq('event_id', eventId)
    }

    const { data: qrRows, error: qrError } = await qrQuery

    if (qrError) {
      console.error('Error loading QRs for event summary:', qrError)
    }

    const uniqueQrMap = new Map<string, any>()
    for (const qr of qrRows ?? []) {
      uniqueQrMap.set(qr.id, qr)
    }
    const qrs = Array.from(uniqueQrMap.values())
    const qrIds = qrs.map((qr) => qr.id)

    const [moduleData, messageData, pruebasData, analyticsData] = await Promise.all([
      serviceClient
        .from('event_modules')
        .select('id, type, status, start_at, end_at, settings')
        .eq('event_id', eventId),
      serviceClient
        .from('event_messages')
        .select('id, visibility, scheduled_at, published_at')
        .eq('event_id', eventId),
      serviceClient
        .from('event_pruebas')
        .select('id, title, start_at, end_at, auto_lock')
        .eq('event_id', eventId),
      serviceClient
        .from('scans')
        .select('id', { count: 'exact', head: true })
        .eq('event_id', eventId),
    ])

    let destinations: any[] = []
    if (qrIds.length > 0) {
      const { data: destinationRows, error: destinationsError } = await serviceClient
        .from('qr_destinations')
        .select('id, qr_id, type, label, target_url, start_at, end_at, is_active, priority')
        .in('qr_id', qrIds)

      if (destinationsError) {
        console.error('Error loading QR destinations for event summary:', destinationsError)
      } else {
        destinations = destinationRows ?? []
      }
    }

    const qrCount = qrs.length
    const totalScans = analyticsData.count ?? 0
    const upcomingMessages = (messageData.data ?? []).filter(
      (message) => message.visibility === 'scheduled'
    )
    const activeModules = moduleData.data?.filter((module) => module.status === 'active') ?? []

    // Agrupar destinos por QR
    const destinationsByQR = destinations.reduce((acc: any, dest: any) => {
      if (!acc[dest.qr_id]) acc[dest.qr_id] = []
      acc[dest.qr_id].push(dest)
      return acc
    }, {})

    // Añadir destinos a cada QR
    const qrsWithDestinations = qrs.map(qr => ({
      ...qr,
      destinations: destinationsByQR[qr.id] || []
    }))

    return NextResponse.json({
      event,
      role: membership.role,
      stats: {
        qrCount,
        totalScans,
        scheduledMessages: upcomingMessages.length,
        activeModules: activeModules.length,
      },
      modules: moduleData.data ?? [],
      pruebas: pruebasData.data ?? [],
      qrs: qrsWithDestinations,
      messages: messageData.data ?? [],
      destinations,
    })
  } catch (error) {
    console.error('Error loading event summary:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}


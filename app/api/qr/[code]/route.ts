import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const APP_URL = (process.env.NEXT_PUBLIC_APP_URL || 'https://elquelo.eu').replace(/\/$/, '')

interface DestinationRecord {
  id: string
  type: string
  target_url: string | null
  payload: Record<string, any> | null
  is_active: boolean | null
  start_at: string | null
  end_at: string | null
  priority: number | null
}

function detectDevice(userAgent: string): string {
  if (!userAgent) return 'unknown'
  const ua = userAgent.toLowerCase()
  if (ua.includes('mobile') || ua.includes('iphone') || ua.includes('android')) {
    return 'mobile'
  }
  if (ua.includes('tablet') || ua.includes('ipad')) {
    return 'tablet'
  }
  return 'desktop'
}

function isWithinSchedule(destination: DestinationRecord, now: Date): boolean {
  const start = destination.start_at ? new Date(destination.start_at) : null
  const end = destination.end_at ? new Date(destination.end_at) : null
  if (start && now < start) {
    return false
  }
  if (end && now >= end) {
    return false
  }
  return true
}

function resolveDestination(
  destinations: DestinationRecord[],
  now: Date
): DestinationRecord | null {
  if (!destinations || destinations.length === 0) {
    return null
  }

  const eligible = destinations
    .filter((destination) => (destination.is_active ?? true) && isWithinSchedule(destination, now))
    .sort((a, b) => (a.priority ?? 0) - (b.priority ?? 0))

  if (eligible.length > 0) {
    return eligible[0]
  }

  const fallback = destinations
    .filter((destination) => destination.is_active ?? true)
    .sort((a, b) => (a.priority ?? 0) - (b.priority ?? 0))

  return fallback[0] ?? null
}

// GET - Redirect to QR destination with schedule & analytics awareness
export async function GET(
  req: NextRequest,
  { params }: { params: { code: string } }
) {
  try {
    const { code } = params
    const now = new Date()

    console.log('[QR REDIRECT] Looking for code:', code)

    const { data: qr, error } = await supabase
      .from('qrs')
      .select('id, code, destination_url, is_active, scan_count, event_id, active_destination_id')
      .eq('code', code)
      .single()

    console.log('[QR REDIRECT] Found QR:', qr ? `${qr.code} (active: ${qr.is_active})` : 'NOT FOUND')
    console.log('[QR REDIRECT] Error:', error)

    if (error || !qr || qr.is_active === false) {
      console.log('[QR REDIRECT] Redirecting to 404')
      return NextResponse.redirect(`${APP_URL}/404`)
    }

    let resolvedUrl = qr.destination_url || APP_URL
    let destinationId: string | null = qr.active_destination_id ?? null
    let eventId: string | null = qr.event_id ?? null
    let eventPhase = 'design'
    let eventExpired = false

    if (qr.event_id) {
      const { data: event } = await supabase
        .from('events')
        .select('id, status, expires_at, config, event_timezone')
        .eq('id', qr.event_id)
        .maybeSingle()

      if (event) {
        eventId = event.id
        const expiresAt = event.expires_at ? new Date(event.expires_at) : null
        eventExpired = Boolean(expiresAt && now >= expiresAt)
        eventPhase = eventExpired ? 'expired' : event.status || 'live'

        const fallbackUrl =
          (event.config as any)?.fallback_url || qr.destination_url || APP_URL
        const expiredUrl = (event.config as any)?.expired_url || `${APP_URL}/evento-expirado`

        const { data: destinations } = await supabase
          .from('qr_destinations')
          .select(
            'id, type, target_url, payload, is_active, start_at, end_at, priority'
          )
          .eq('qr_id', qr.id)

        const destinationRecord = eventExpired
          ? null
          : resolveDestination(destinations || [], now)

        if (eventExpired) {
          resolvedUrl = expiredUrl
          destinationId = null
        } else if (destinationRecord) {
          resolvedUrl = destinationRecord.target_url || fallbackUrl
          destinationId = destinationRecord.id
        } else {
          resolvedUrl = fallbackUrl
          destinationId = null
        }
      }
    }

    resolvedUrl = resolvedUrl || APP_URL

    await logScan({
      req,
      qrId: qr.id,
      eventId,
      destinationId,
      resolvedUrl,
      expired: eventExpired,
      eventPhase,
    })

    await supabase
      .from('qrs')
      .update({
        scan_count: (qr.scan_count || 0) + 1,
        last_active_at: new Date().toISOString(),
      })
      .eq('id', qr.id)

    return NextResponse.redirect(resolvedUrl)
  } catch (error) {
    console.error('Error processing QR redirect:', error)
    return NextResponse.redirect(`${APP_URL}/404`)
  }
}

// POST - Update QR destination (authenticated)
export async function POST(
  req: NextRequest,
  { params }: { params: { code: string } }
) {
  try {
    const { code } = params
    const { destination_url, title, description, is_active } = await req.json()

    const supabaseAuth = createRouteHandlerClient({ cookies })
    const {
      data: { user },
    } = await supabaseAuth.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: existing, error: fetchError } = await supabase
      .from('qrs')
      .select('id, user_id')
      .eq('code', code)
      .single()

    if (fetchError || !existing) {
      return NextResponse.json({ error: 'QR not found' }, { status: 404 })
    }

    if (existing.user_id !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const updates: Record<string, unknown> = {}

    if (typeof destination_url === 'string' && destination_url.trim()) {
      updates.destination_url = destination_url.trim()
    }

    if (title !== undefined) {
      updates.title = (title ?? '').trim() || null
    }

    if (description !== undefined) {
      updates.description = (description ?? '').trim() || null
    }

    if (typeof is_active === 'boolean') {
      updates.is_active = is_active
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: 'No fields to update' }, { status: 400 })
    }

    updates.updated_at = new Date().toISOString()

    const { data, error } = await supabase
      .from('qrs')
      .update(updates)
      .eq('id', existing.id)
      .select()
      .single()

    if (error || !data) {
      console.error('Error updating QR:', error)
      return NextResponse.json({ error: 'Failed to update QR' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      qr: {
        ...data,
        qr_url: `${process.env.QR_DOMAIN}/${data.code}`,
      },
    })
  } catch (error) {
    console.error('Error updating QR:', error)
    return NextResponse.json({ error: 'Failed to update QR' }, { status: 500 })
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { code: string } }
) {
  try {
    const { code } = params

    const supabaseAuth = createRouteHandlerClient({ cookies })
    const {
      data: { user },
    } = await supabaseAuth.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: existing, error: fetchError } = await supabase
      .from('qrs')
      .select('id, user_id')
      .eq('code', code)
      .single()

    if (fetchError || !existing) {
      return NextResponse.json({ error: 'QR not found' }, { status: 404 })
    }

    if (existing.user_id !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { error: deleteError } = await supabase
      .from('qrs')
      .delete()
      .eq('id', existing.id)

    if (deleteError) {
      console.error('Error deleting QR:', deleteError)
      return NextResponse.json({ error: 'Failed to delete QR' }, { status: 500 })
    }

    const storagePath = `${user.id}/${code}.png`
    const { error: storageError } = await supabase.storage
      .from('designs')
      .remove([storagePath])

    if (storageError && storageError.message && !storageError.message.includes('not found')) {
      console.error('Error removing design asset:', storageError)
    }

    return NextResponse.json({ success: true, code })
  } catch (error) {
    console.error('Error deleting QR:', error)
    return NextResponse.json({ error: 'Failed to delete QR' }, { status: 500 })
  }
}

async function logScan({
  req,
  qrId,
  eventId,
  destinationId,
  resolvedUrl,
  expired,
  eventPhase,
}: {
  req: NextRequest
  qrId: string
  eventId: string | null
  destinationId: string | null
  resolvedUrl: string
  expired: boolean
  eventPhase: string
}) {
  try {
    const ip =
      req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown'
    const userAgent = req.headers.get('user-agent') || 'unknown'
    const referer = req.headers.get('referer') || 'direct'

    await supabase.from('scans').insert({
      qr_id: qrId,
      event_id: eventId,
      destination_id: destinationId,
      ip_address: ip,
      user_agent: userAgent,
      referer,
      resolved_url: resolvedUrl,
      device_type: detectDevice(userAgent),
      expired,
      event_phase: eventPhase,
    })
  } catch (error) {
    console.error('Error logging scan:', error)
  }
}


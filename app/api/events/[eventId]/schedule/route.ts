import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { createServiceSupabaseClient } from '@/lib/supabaseServer'

const serviceClient = createServiceSupabaseClient()

const scheduleSchema = z.object({
  eventDate: z.string().datetime(),
  contentTtlDays: z.number().int().positive().max(365).optional(),
  eventTimezone: z.string().min(2).max(128).optional(),
})

export async function POST(
  req: NextRequest,
  { params }: { params: { eventId: string } }
) {
  try {
    const { eventId } = params
    const body = await req.json()
    const parsed = scheduleSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid payload', details: parsed.error.flatten() }, { status: 400 })
    }

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

    if (!membership || !['owner', 'editor'].includes(membership.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const eventDate = new Date(parsed.data.eventDate)
    if (Number.isNaN(eventDate.getTime())) {
      return NextResponse.json({ error: 'Invalid event date' }, { status: 400 })
    }

    const ttl = parsed.data.contentTtlDays ?? 30
    const expires = new Date(eventDate)
    expires.setUTCDate(expires.getUTCDate() + ttl)

    const { data: event, error } = await serviceClient
      .from('events')
      .update({
        event_date: eventDate.toISOString(),
        content_ttl_days: ttl,
        expires_at: expires.toISOString(),
        event_timezone: parsed.data.eventTimezone ?? undefined,
        updated_at: new Date().toISOString(),
      })
      .eq('id', eventId)
      .select()
      .single()

    if (error || !event) {
      console.error('Failed to update schedule', error)
      return NextResponse.json({ error: 'Failed to update schedule' }, { status: 500 })
    }

    await serviceClient
      .from('event_actions_log')
      .insert({
        event_id: eventId,
        actor_id: user.id,
        action: 'event_schedule_updated',
        payload: {
          event_date: event.event_date,
          expires_at: event.expires_at,
          content_ttl_days: ttl,
        },
      })

    return NextResponse.json({ event })
  } catch (error) {
    console.error('Error updating event schedule:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

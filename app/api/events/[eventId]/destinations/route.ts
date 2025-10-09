import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { createServiceSupabaseClient } from '@/lib/supabaseServer'

const serviceClient = createServiceSupabaseClient()

const destinationSchema = z.object({
  qrId: z.string().uuid(),
  type: z.enum(['external', 'album', 'microsite', 'prueba', 'timeline', 'message_wall', 'playlist', 'map', 'surprise']),
  label: z.string().min(1).max(120),
  targetUrl: z.string().min(1).optional().transform((val) => {
    // Si no tiene protocolo, añadir https://
    if (val && !val.startsWith('http://') && !val.startsWith('https://') && !val.startsWith('/')) {
      return `https://${val}`
    }
    return val
  }),
  payload: z.record(z.any()).optional(),
  startAt: z.string().optional().transform((val) => {
    // Convertir formato datetime-local a ISO
    if (val && !val.includes('Z') && !val.includes('+')) {
      return new Date(val).toISOString()
    }
    return val
  }),
  endAt: z.string().optional().transform((val) => {
    // Convertir formato datetime-local a ISO
    if (val && !val.includes('Z') && !val.includes('+')) {
      return new Date(val).toISOString()
    }
    return val
  }),
  priority: z.number().int().optional(),
  isActive: z.boolean().optional(),
})

export async function POST(
  req: NextRequest,
  { params }: { params: { eventId: string } }
) {
  try {
    const { eventId } = params
    const body = await req.json()
    
    console.log('[CREATE DESTINATION] Body received:', JSON.stringify(body, null, 2))
    
    const parseResult = destinationSchema.safeParse(body)

    if (!parseResult.success) {
      console.error('[CREATE DESTINATION] Validation failed:', parseResult.error.flatten())
      return NextResponse.json({ 
        error: 'Invalid payload', 
        details: parseResult.error.flatten(),
        received: body 
      }, { status: 400 })
    }

    const { qrId, type, label, targetUrl, payload, startAt, endAt, priority, isActive } = parseResult.data

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

    if (membershipError || !membership || !['owner', 'editor'].includes(membership.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const nowIso = new Date().toISOString()

    const { data: inserted, error: insertError } = await serviceClient
      .from('qr_destinations')
      .insert({
        event_id: eventId,
        qr_id: qrId,
        type,
        label,
        target_url: targetUrl ?? null,
        payload: payload ?? {},
        start_at: startAt ?? null,
        end_at: endAt ?? null,
        priority: priority ?? 0,
        is_active: isActive ?? true,
        created_at: nowIso,
        updated_at: nowIso,
      })
      .select()
      .single()

    if (insertError || !inserted) {
      console.error('Failed to create destination', insertError)
      return NextResponse.json({ error: 'Failed to create destination' }, { status: 500 })
    }

    await serviceClient
      .from('event_actions_log')
      .insert({
        event_id: eventId,
        actor_id: user.id,
        action: 'destination_created',
        payload: {
          destination_id: inserted.id,
          qr_id: qrId,
          type,
        },
      })

    return NextResponse.json({ destination: inserted })
  } catch (error) {
    console.error('Error creating destination:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

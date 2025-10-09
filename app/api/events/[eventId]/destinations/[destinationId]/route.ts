import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { createServiceSupabaseClient } from '@/lib/supabaseServer'

const serviceClient = createServiceSupabaseClient()

const updateSchema = z.object({
  label: z.string().min(1).max(120).optional(),
  targetUrl: z.string().url().optional().nullable(),
  payload: z.record(z.any()).optional(),
  startAt: z.string().datetime().optional().nullable(),
  endAt: z.string().datetime().optional().nullable(),
  priority: z.number().int().optional(),
  isActive: z.boolean().optional(),
})

export async function PATCH(
  req: NextRequest,
  { params }: { params: { eventId: string; destinationId: string } }
) {
  try {
    const { eventId, destinationId } = params
    const data = await req.json()
    const parsed = updateSchema.safeParse(data)

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

    const updates: Record<string, unknown> = {}

    if (parsed.data.label !== undefined) updates.label = parsed.data.label
    if (parsed.data.targetUrl !== undefined) updates.target_url = parsed.data.targetUrl
    if (parsed.data.payload !== undefined) updates.payload = parsed.data.payload ?? {}
    if (parsed.data.startAt !== undefined) updates.start_at = parsed.data.startAt
    if (parsed.data.endAt !== undefined) updates.end_at = parsed.data.endAt
    if (parsed.data.priority !== undefined) updates.priority = parsed.data.priority
    if (parsed.data.isActive !== undefined) updates.is_active = parsed.data.isActive

    updates.updated_at = new Date().toISOString()

    const { data: destination, error: updateError } = await serviceClient
      .from('qr_destinations')
      .update(updates)
      .eq('event_id', eventId)
      .eq('id', destinationId)
      .select()
      .single()

    if (updateError || !destination) {
      console.error('Failed to update destination', updateError)
      return NextResponse.json({ error: 'Failed to update destination' }, { status: 500 })
    }

    await serviceClient
      .from('event_actions_log')
      .insert({
        event_id: eventId,
        actor_id: user.id,
        action: 'destination_updated',
        payload: {
          destination_id: destinationId,
          updates,
        },
      })

    return NextResponse.json({ destination })
  } catch (error) {
    console.error('Error updating destination:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { eventId: string; destinationId: string } }
) {
  try {
    const { eventId, destinationId } = params

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

    const { error } = await serviceClient
      .from('qr_destinations')
      .delete()
      .eq('event_id', eventId)
      .eq('id', destinationId)

    if (error) {
      console.error('Failed to delete destination', error)
      return NextResponse.json({ error: 'Failed to delete destination' }, { status: 500 })
    }

    await serviceClient
      .from('event_actions_log')
      .insert({
        event_id: eventId,
        actor_id: user.id,
        action: 'destination_deleted',
        payload: {
          destination_id: destinationId,
        },
      })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting destination:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

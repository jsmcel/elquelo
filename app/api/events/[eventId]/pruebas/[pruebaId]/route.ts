import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { createServiceSupabaseClient } from '@/lib/supabaseServer'

const serviceClient = createServiceSupabaseClient()

const updateSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().optional(),
  instructions: z.record(z.any()).optional(),
  reward: z.record(z.any()).optional(),
  startAt: z.string().datetime().optional().nullable(),
  endAt: z.string().datetime().optional().nullable(),
  autoLock: z.boolean().optional(),
})

export async function PATCH(
  req: NextRequest,
  { params }: { params: { eventId: string; pruebaId: string } }
) {
  try {
    const { eventId, pruebaId } = params
    const body = await req.json()
    const parsed = updateSchema.safeParse(body)

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
    const { data } = parsed
    if (data.title !== undefined) updates.title = data.title
    if (data.description !== undefined) updates.description = data.description
    if (data.instructions !== undefined) updates.instructions = data.instructions
    if (data.reward !== undefined) updates.reward = data.reward
    if (data.startAt !== undefined) updates.start_at = data.startAt
    if (data.endAt !== undefined) updates.end_at = data.endAt
    if (data.autoLock !== undefined) updates.auto_lock = data.autoLock
    updates.updated_at = new Date().toISOString()

    const { data: prueba, error } = await serviceClient
      .from('event_pruebas')
      .update(updates)
      .eq('event_id', eventId)
      .eq('id', pruebaId)
      .select()
      .single()

    if (error || !prueba) {
      console.error('Failed to update challenge', error)
      return NextResponse.json({ error: 'Failed to update challenge' }, { status: 500 })
    }

    await serviceClient
      .from('event_actions_log')
      .insert({
        event_id: eventId,
        actor_id: user.id,
        action: 'prueba_updated',
        payload: {
          prueba_id: pruebaId,
          updates,
        },
      })

    return NextResponse.json({ prueba })
  } catch (error) {
    console.error('Error updating challenge:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { eventId: string; pruebaId: string } }
) {
  try {
    const { eventId, pruebaId } = params

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
      .from('event_pruebas')
      .delete()
      .eq('event_id', eventId)
      .eq('id', pruebaId)

    if (error) {
      console.error('Failed to delete challenge', error)
      return NextResponse.json({ error: 'Failed to delete challenge' }, { status: 500 })
    }

    await serviceClient
      .from('event_actions_log')
      .insert({
        event_id: eventId,
        actor_id: user.id,
        action: 'prueba_deleted',
        payload: {
          prueba_id: pruebaId,
        },
      })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting challenge:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

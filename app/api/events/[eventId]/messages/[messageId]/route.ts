import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { createServiceSupabaseClient } from '@/lib/supabaseServer'

const serviceClient = createServiceSupabaseClient()

const updateSchema = z.object({
  visibility: z.enum(['draft', 'scheduled', 'published', 'archived']).optional(),
  scheduledAt: z.string().datetime().optional().nullable(),
  publishedAt: z.string().datetime().optional().nullable(),
  expiresAt: z.string().datetime().optional().nullable(),
  transcript: z.string().optional().nullable(),
})

export async function PATCH(
  req: NextRequest,
  { params }: { params: { eventId: string; messageId: string } }
) {
  try {
    const { eventId, messageId } = params
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
    if (parsed.data.visibility !== undefined) updates.visibility = parsed.data.visibility
    if (parsed.data.scheduledAt !== undefined) updates.scheduled_at = parsed.data.scheduledAt
    if (parsed.data.publishedAt !== undefined) updates.published_at = parsed.data.publishedAt
    if (parsed.data.expiresAt !== undefined) updates.expires_at = parsed.data.expiresAt
    if (parsed.data.transcript !== undefined) updates.transcript = parsed.data.transcript
    updates.updated_at = new Date().toISOString()

    const { data: message, error } = await serviceClient
      .from('event_messages')
      .update(updates)
      .eq('event_id', eventId)
      .eq('id', messageId)
      .select()
      .single()

    if (error || !message) {
      console.error('Failed to update message', error)
      return NextResponse.json({ error: 'Failed to update message' }, { status: 500 })
    }

    await serviceClient
      .from('event_actions_log')
      .insert({
        event_id: eventId,
        actor_id: user.id,
        action: 'message_updated',
        payload: {
          message_id: messageId,
          updates,
        },
      })

    return NextResponse.json({ message })
  } catch (error) {
    console.error('Error updating message:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { eventId: string; messageId: string } }
) {
  try {
    const { eventId, messageId } = params
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
      .from('event_messages')
      .delete()
      .eq('event_id', eventId)
      .eq('id', messageId)

    if (error) {
      console.error('Failed to delete message', error)
      return NextResponse.json({ error: 'Failed to delete message' }, { status: 500 })
    }

    await serviceClient
      .from('event_actions_log')
      .insert({
        event_id: eventId,
        actor_id: user.id,
        action: 'message_deleted',
        payload: {
          message_id: messageId,
        },
      })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting message:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

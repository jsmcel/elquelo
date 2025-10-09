import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { createServiceSupabaseClient } from '@/lib/supabaseServer'

const serviceClient = createServiceSupabaseClient()

const messageSchema = z.object({
  senderName: z.string().min(1).max(120),
  senderEmail: z.string().email().optional(),
  mediaUrl: z.string().url(),
  transcript: z.string().optional(),
  scheduledAt: z.string().datetime().optional(),
  visibility: z.enum(['draft', 'scheduled', 'published', 'archived']).optional(),
  moduleId: z.string().uuid().optional(),
})

export async function POST(
  req: NextRequest,
  { params }: { params: { eventId: string } }
) {
  try {
    const { eventId } = params
    const body = await req.json()
    const parsed = messageSchema.safeParse(body)

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

    if (!membership) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const nowIso = new Date().toISOString()

    const { data: message, error } = await serviceClient
      .from('event_messages')
      .insert({
        event_id: eventId,
        module_id: parsed.data.moduleId ?? null,
        sender_name: parsed.data.senderName,
        sender_email: parsed.data.senderEmail ?? null,
        media_url: parsed.data.mediaUrl,
        transcript: parsed.data.transcript ?? null,
        scheduled_at: parsed.data.scheduledAt ?? null,
        visibility: parsed.data.visibility ?? 'draft',
        created_at: nowIso,
        updated_at: nowIso,
      })
      .select()
      .single()

    if (error || !message) {
      console.error('Failed to create message', error)
      return NextResponse.json({ error: 'Failed to create message' }, { status: 500 })
    }

    await serviceClient
      .from('event_actions_log')
      .insert({
        event_id: eventId,
        actor_id: user.id,
        action: 'message_created',
        payload: {
          message_id: message.id,
          visibility: message.visibility,
        },
      })

    return NextResponse.json({ message })
  } catch (error) {
    console.error('Error creating message:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

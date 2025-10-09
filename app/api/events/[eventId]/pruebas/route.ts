import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { createServiceSupabaseClient } from '@/lib/supabaseServer'

const serviceClient = createServiceSupabaseClient()

const pruebaSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().optional(),
  instructions: z.record(z.any()).optional(),
  reward: z.record(z.any()).optional(),
  startAt: z.string().datetime().optional(),
  endAt: z.string().datetime().optional(),
  autoLock: z.boolean().optional(),
})

export async function POST(
  req: NextRequest,
  { params }: { params: { eventId: string } }
) {
  try {
    const { eventId } = params
    const body = await req.json()
    const parsed = pruebaSchema.safeParse(body)

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

    const nowIso = new Date().toISOString()

    const { data: prueba, error } = await serviceClient
      .from('event_pruebas')
      .insert({
        event_id: eventId,
        title: parsed.data.title,
        description: parsed.data.description ?? null,
        instructions: parsed.data.instructions ?? {},
        reward: parsed.data.reward ?? {},
        start_at: parsed.data.startAt ?? null,
        end_at: parsed.data.endAt ?? null,
        auto_lock: parsed.data.autoLock ?? true,
        created_at: nowIso,
        updated_at: nowIso,
      })
      .select()
      .single()

    if (error || !prueba) {
      console.error('Failed to create challenge', error)
      return NextResponse.json({ error: 'Failed to create challenge' }, { status: 500 })
    }

    await serviceClient
      .from('event_actions_log')
      .insert({
        event_id: eventId,
        actor_id: user.id,
        action: 'prueba_created',
        payload: {
          prueba_id: prueba.id,
        },
      })

    return NextResponse.json({ prueba })
  } catch (error) {
    console.error('Error creating challenge:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

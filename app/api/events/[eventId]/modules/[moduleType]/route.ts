import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { createServiceSupabaseClient } from '@/lib/supabaseServer'

const serviceClient = createServiceSupabaseClient()

const moduleSchema = z.object({
  status: z.enum(['draft', 'active', 'paused']).optional(),
  startAt: z.string().datetime().optional().nullable(),
  endAt: z.string().datetime().optional().nullable(),
  settings: z.record(z.any()).optional(),
})

export async function POST(
  req: NextRequest,
  { params }: { params: { eventId: string; moduleType: string } }
) {
  try {
    const { eventId, moduleType } = params
    const parsedType = moduleType.toLowerCase()
    const body = await req.json()
    const parsed = moduleSchema.safeParse(body)

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
    if (parsed.data.status) updates.status = parsed.data.status
    if (parsed.data.startAt !== undefined) updates.start_at = parsed.data.startAt
    if (parsed.data.endAt !== undefined) updates.end_at = parsed.data.endAt
    if (parsed.data.settings !== undefined) updates.settings = parsed.data.settings
    updates.updated_at = new Date().toISOString()

    const { data: module, error } = await serviceClient
      .from('event_modules')
      .upsert(
        {
          event_id: eventId,
          type: parsedType,
          ...updates,
        },
        { onConflict: 'event_id,type' }
      )
      .select()
      .single()

    if (error || !module) {
      console.error('Failed to update module', error)
      return NextResponse.json({ error: 'Failed to update module' }, { status: 500 })
    }

    await serviceClient
      .from('event_actions_log')
      .insert({
        event_id: eventId,
        actor_id: user.id,
        action: 'module_updated',
        payload: {
          module_type: parsedType,
          updates,
        },
      })

    return NextResponse.json({ module })
  } catch (error) {
    console.error('Error updating module:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

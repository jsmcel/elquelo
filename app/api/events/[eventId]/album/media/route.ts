import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { createServiceSupabaseClient } from '@/lib/supabaseServer'

const serviceClient = createServiceSupabaseClient()

const mediaSchema = z.object({
  albumId: z.string().uuid(),
  assetUrl: z.string().url(),
  thumbnailUrl: z.string().url().optional(),
  type: z.enum(['image', 'video', 'gif', 'audio']).default('image'),
  caption: z.string().optional(),
  visibility: z.enum(['approved', 'pending', 'hidden']).optional(),
  metadata: z.record(z.any()).optional(),
  recordedAt: z.string().datetime().optional(),
})

export async function POST(
  req: NextRequest,
  { params }: { params: { eventId: string } }
) {
  try {
    const { eventId } = params
    const body = await req.json()
    const parsed = mediaSchema.safeParse(body)

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

    const { data: media, error } = await serviceClient
      .from('event_album_media')
      .insert({
        album_id: parsed.data.albumId,
        uploader_id: user.id,
        asset_url: parsed.data.assetUrl,
        thumbnail_url: parsed.data.thumbnailUrl ?? null,
        type: parsed.data.type,
        caption: parsed.data.caption ?? null,
        visibility: parsed.data.visibility ?? 'pending',
        metadata: parsed.data.metadata ?? {},
        recorded_at: parsed.data.recordedAt ?? null,
        created_at: nowIso,
        updated_at: nowIso,
      })
      .select()
      .single()

    if (error || !media) {
      console.error('Failed to register media', error)
      return NextResponse.json({ error: 'Failed to register media' }, { status: 500 })
    }

    await serviceClient
      .from('event_actions_log')
      .insert({
        event_id: eventId,
        actor_id: user.id,
        action: 'album_media_added',
        payload: {
          media_id: media.id,
          album_id: parsed.data.albumId,
        },
      })

    return NextResponse.json({ media })
  } catch (error) {
    console.error('Error registering media:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

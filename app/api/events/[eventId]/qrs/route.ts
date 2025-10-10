import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { createServiceSupabaseClient } from '@/lib/supabaseServer'
import { randomUUID } from 'crypto'

const serviceClient = createServiceSupabaseClient()

function generateQrCode(): string {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789'
  let code = ''
  for (let i = 0; i < 8; i++) {
    code += chars[Math.floor(Math.random() * chars.length)]
  }
  return code
}

const linkQRsSchema = z.object({
  qrCodes: z.array(z.string()).optional(),
  createNew: z.boolean().optional(),
  count: z.number().int().min(1).max(50).optional(),
  groupName: z.string().optional(),
})

export async function POST(
  req: NextRequest,
  { params }: { params: { eventId: string } }
) {
  try {
    const { eventId } = params
    const body = await req.json()
    const parseResult = linkQRsSchema.safeParse(body)

    if (!parseResult.success) {
      return NextResponse.json(
        { error: 'Invalid payload', details: parseResult.error.flatten() },
        { status: 400 }
      )
    }

    const { qrCodes, createNew, count, groupName } = parseResult.data

    const supabaseAuth = createRouteHandlerClient({ cookies })
    const {
      data: { user },
    } = await supabaseAuth.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check membership
    const { data: membership, error: membershipError } = await serviceClient
      .from('event_members')
      .select('role')
      .eq('event_id', eventId)
      .eq('user_id', user.id)
      .maybeSingle()

    if (membershipError || !membership || membership.role !== 'owner') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Get event details
    const { data: event, error: eventError } = await serviceClient
      .from('events')
      .select('id, name, qr_group_id, event_date, expires_at')
      .eq('id', eventId)
      .single()

    if (eventError || !event) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 })
    }

    const nowIso = new Date().toISOString()
    
    // MODE 1: Link existing QRs by codes
    if (qrCodes && qrCodes.length > 0 && !createNew) {
      console.log('[LINK QRS] Starting to link QRs:', qrCodes)
      
      // Find existing QRs by codes
      const { data: existingQRs, error: findError } = await serviceClient
        .from('qrs')
        .select('id, code, group_id, destination_url, active_destination_id, metadata')
        .in('code', qrCodes)
        .eq('user_id', user.id)

      console.log('[LINK QRS] Found QRs:', existingQRs?.length, 'Error:', findError)

      if (findError) {
        console.error('[LINK QRS] Error finding QRs:', findError)
        return NextResponse.json({ 
          error: 'Error buscando QRs', 
          details: findError.message 
        }, { status: 500 })
      }

      if (!existingQRs || existingQRs.length === 0) {
        console.log('[LINK QRS] No QRs found for codes:', qrCodes)
        return NextResponse.json({ 
          error: 'No se encontraron QRs con esos códigos. Verifica que los QRs existan y te pertenezcan.',
          searchedCodes: qrCodes
        }, { status: 404 })
      }

      let groupId = event.qr_group_id || existingQRs[0].group_id

      // Create group if needed
      if (!groupId) {
        const { data: newGroup, error: groupError } = await serviceClient
          .from('groups')
          .insert({
            user_id: user.id,
            name: groupName || event.name || `Grupo ${eventId.slice(0, 8)}`,
            created_at: nowIso,
          })
          .select()
          .single()

        if (groupError || !newGroup) {
          console.error('Failed to create group', groupError)
          return NextResponse.json({ error: 'Failed to create group' }, { status: 500 })
        }
        groupId = newGroup.id
      }

      // Update event with group_id
      await serviceClient
        .from('events')
        .update({ qr_group_id: groupId })
        .eq('id', eventId)

      // Create destinations for existing QRs with explicit IDs
      const destinationRecords = existingQRs.map((qr, index) => {
        const destinationId = randomUUID()
        return {
          id: destinationId,
          event_id: eventId,
          qr_id: qr.id,
          type: 'microsite' as const,
          label: 'Microsite del evento',
          target_url: `${process.env.NEXT_PUBLIC_APP_URL}/e/${eventId}/microsite`,
          is_active: true,
          priority: 0,
          start_at: event.event_date || nowIso,
          end_at: event.expires_at,
          created_at: nowIso,
          updated_at: nowIso,
        }
      })

      // Insert destinations first
      console.log('[LINK QRS] Inserting destinations:', destinationRecords.length)
      const { data: insertedDestinations, error: destError } = await serviceClient
        .from('qr_destinations')
        .insert(destinationRecords)
        .select('id, qr_id')

      console.log('[LINK QRS] Destinations inserted:', insertedDestinations?.length, 'Error:', destError)

      if (destError) {
        console.error('[LINK QRS] Failed to create destinations:', destError)
        return NextResponse.json({ 
          error: 'Failed to create destinations', 
          details: destError.message,
          hint: destError.hint
        }, { status: 500 })
      }

      // Create a map of qr_id to destination_id
      const qrToDestinationMap = new Map(
        (insertedDestinations || []).map(dest => [dest.qr_id, dest.id])
      )

      // Update QRs to link to event and set active destination
      // Use UPDATE instead of UPSERT since we're only updating existing records
      console.log('[LINK QRS] Updating', existingQRs.length, 'QRs')
      
      // Update each QR individually
      const updatePromises = existingQRs.map(async (qr) => {
        const destinationId = qrToDestinationMap.get(qr.id)
        return serviceClient
          .from('qrs')
          .update({
            event_id: eventId,
            group_id: groupId,
            active_destination_id: destinationId || null,
            last_active_at: nowIso,
          })
          .eq('id', qr.id)
      })

      const updateResults = await Promise.all(updatePromises)
      const updateError = updateResults.find(result => result.error)?.error

      console.log('[LINK QRS] QRs updated. Error:', updateError)

      if (updateError) {
        console.error('[LINK QRS] Failed to update QRs:', updateError)
        return NextResponse.json({ 
          error: 'Failed to link QRs', 
          details: updateError.message,
          hint: updateError.hint
        }, { status: 500 })
      }

      console.log('[LINK QRS] Successfully linked', existingQRs.length, 'QRs to event', eventId)

      await serviceClient.from('event_actions_log').insert({
        event_id: eventId,
        actor_id: user.id,
        action: 'qrs_linked',
        payload: {
          count: existingQRs.length,
          codes: qrCodes,
          group_id: groupId,
        },
        created_at: nowIso,
      })

      return NextResponse.json({
        success: true,
        linked: existingQRs.length,
        qrs: existingQRs,
        groupId,
      })
    }

    // MODE 2: Create new QRs (only if explicitly requested)
    if (!createNew || !count) {
      return NextResponse.json({ 
        error: 'Debes especificar createNew: true y count para generar nuevos QRs' 
      }, { status: 400 })
    }

    let groupId = event.qr_group_id

    // Create group if it doesn't exist
    if (!groupId) {
      const { data: newGroup, error: groupError } = await serviceClient
        .from('groups')
        .insert({
          user_id: user.id,
          name: groupName || event.name || `Grupo ${eventId.slice(0, 8)}`,
          created_at: nowIso,
        })
        .select()
        .single()

      if (groupError || !newGroup) {
        console.error('Failed to create group', groupError)
        return NextResponse.json({ error: 'Failed to create group' }, { status: 500 })
      }

      groupId = newGroup.id

      // Update event with group_id
      await serviceClient
        .from('events')
        .update({ qr_group_id: groupId })
        .eq('id', eventId)
    }

    // Generate NEW QR codes
    const qrRecords = []
    const destinationRecords = []

    for (let i = 0; i < count; i++) {
      const qrId = randomUUID()
      const code = generateQrCode()
      const destinationId = randomUUID()

      qrRecords.push({
        id: qrId,
        code,
        user_id: user.id,
        group_id: groupId,
        event_id: eventId,
        title: `QR ${i + 1}`,
        destination_url: `${process.env.NEXT_PUBLIC_APP_URL}/qr/${code}`,
        active_destination_id: destinationId,
        scan_count: 0,
        created_at: nowIso,
        updated_at: nowIso,
      })

      destinationRecords.push({
        id: destinationId,
        event_id: eventId,
        qr_id: qrId,
        type: 'microsite',
        label: 'Microsite del evento',
        target_url: `${process.env.NEXT_PUBLIC_APP_URL}/e/${eventId}/microsite`,
        is_active: true,
        priority: 0,
        start_at: event.event_date || nowIso,
        end_at: event.expires_at,
        created_at: nowIso,
        updated_at: nowIso,
      })
    }

    // Insert QRs
    const { data: insertedQRs, error: qrError } = await serviceClient
      .from('qrs')
      .insert(qrRecords)
      .select()

    if (qrError) {
      console.error('Failed to create QRs', qrError)
      return NextResponse.json({ error: 'Failed to create QRs' }, { status: 500 })
    }

    // Insert destinations
    const { data: insertedDestinations, error: destError } = await serviceClient
      .from('qr_destinations')
      .insert(destinationRecords)
      .select()

    if (destError) {
      console.error('Failed to create destinations', destError)
      // Rollback QRs
      await serviceClient.from('qrs').delete().in('id', qrRecords.map(qr => qr.id))
      return NextResponse.json({ error: 'Failed to create destinations' }, { status: 500 })
    }

    // Log action
    await serviceClient.from('event_actions_log').insert({
      event_id: eventId,
      actor_id: user.id,
      action: 'qrs_generated',
      payload: {
        count,
        group_id: groupId,
      },
      created_at: nowIso,
    })

    return NextResponse.json({
      success: true,
      qrs: insertedQRs,
      destinations: insertedDestinations,
      groupId,
    })
  } catch (error) {
    console.error('Error creating QRs:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}


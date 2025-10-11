import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { createServiceSupabaseClient } from '@/lib/supabaseServer'
import { randomUUID } from 'crypto'

const serviceClient = createServiceSupabaseClient()

const APP_URL = (process.env.NEXT_PUBLIC_APP_URL || 'https://elquelo.eu').replace(/\/$/, '')
// Paquetes preconfigurados
const PACKAGES = {
  express: {
    microsite: {
      templateId: 'party-animal',
      title: 'Despedida Ã‰pica',
      subtitle: 'Â¡La Ãºltima noche de libertad!',
    },
    retos: [
      { templateId: 'reto-1', title: 'El Brindis del Desconocido', points: 20 },
      { templateId: 'reto-2', title: 'La CanciÃ³n Dedicada', points: 30 },
      { templateId: 'reto-3', title: 'El Baile Viral', points: 25 },
      { templateId: 'reto-4', title: 'La Foto con el/la MÃ¡s Mayor', points: 15 },
      { templateId: 'reto-5', title: 'El Mensaje Secreto del QR', points: 10 },
    ],
    modules: ['album', 'challenge_board', 'microsite'],
    timeline: 'auto-2days',
  },
  custom: {
    // Se configura en un paso adicional
    requiresSelection: true,
  },
  pro: {
    // Usuario configura todo manualmente
    manualSetup: true,
  },
}

export async function POST(
  req: NextRequest,
  { params }: { params: { eventId: string } }
) {
  try {
    const { eventId } = params
    const { packageId } = await req.json()

    const supabaseAuth = createRouteHandlerClient({ cookies })
    const {
      data: { user },
    } = await supabaseAuth.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Verificar permisos
    const { data: membership } = await serviceClient
      .from('event_members')
      .select('role')
      .eq('event_id', eventId)
      .eq('user_id', user.id)
      .maybeSingle()

    if (!membership || membership.role !== 'owner') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const pkg = PACKAGES[packageId as keyof typeof PACKAGES]

    if (!pkg) {
      return NextResponse.json({ error: 'Invalid package' }, { status: 400 })
    }

    if ('manualSetup' in pkg) {
      return NextResponse.json({ 
        message: 'Manual setup selected',
        redirect: `/dashboard/despedida/${eventId}/setup`,
      })
    }

    if ('requiresSelection' in pkg) {
      return NextResponse.json({
        message: 'Custom setup',
        redirect: `/dashboard/despedida/${eventId}/customize`,
      })
    }

    // Aplicar paquete EXPRESS
    if (packageId === 'express') {
      console.log('[QUICK START] Applying express package...')

      const { data: event, error: eventError } = await serviceClient
        .from('events')
        .select('id, name, event_date, expires_at, qr_group_id, event_timezone')
        .eq('id', eventId)
        .maybeSingle()

      if (eventError || !event) {
        console.error('[QUICK START] Event not found or failed to load', eventError)
        return NextResponse.json({ error: 'Evento no encontrado' }, { status: 404 })
      }

      const nowIso = new Date().toISOString()
      const eventStartDate = event.event_date ? new Date(event.event_date) : new Date()
      const fallbackEnd = new Date(eventStartDate)
      fallbackEnd.setUTCDate(fallbackEnd.getUTCDate() + 2)
      const eventStartIso = eventStartDate.toISOString()
      const eventEndIso = event.expires_at || fallbackEnd.toISOString()

      // Reiniciar configuraciones automáticas previas
      const { error: deleteDestinationsError } = await serviceClient
        .from('qr_destinations')
        .delete()
        .eq('event_id', eventId)

      if (deleteDestinationsError) {
        console.error('[QUICK START] Failed to reset QR destinations', deleteDestinationsError)
        return NextResponse.json({ error: 'No se pudo reiniciar los destinos' }, { status: 500 })
      }

      const { error: clearPruebasError } = await serviceClient
        .from('event_pruebas')
        .delete()
        .eq('event_id', eventId)

      if (clearPruebasError) {
        console.error('[QUICK START] Failed to reset retos', clearPruebasError)
        return NextResponse.json({ error: 'No se pudo reiniciar los retos' }, { status: 500 })
      }

      // 1. Activar módulos clave
      const moduleRecords = pkg.modules.map((moduleType) => ({
        event_id: eventId,
        type: moduleType,
        status: 'active',
        settings: moduleType === 'microsite' ? pkg.microsite : {},
        start_at: eventStartIso,
        end_at: eventEndIso,
        updated_at: nowIso,
      }))

      const { error: modulesError } = await serviceClient
        .from('event_modules')
        .upsert(moduleRecords, { onConflict: 'event_id,type' })

      if (modulesError) {
        console.error('[QUICK START] Failed to activate modules', modulesError)
        return NextResponse.json({ error: 'No se pudieron activar los módulos' }, { status: 500 })
      }

      console.log('[QUICK START] Modules activated')

      // 2. Crear retos con planificación básica
      const timelineHours = pkg.timeline === 'auto-2days' ? 48 : 24
      const slotHours = Math.max(4, Math.floor(timelineHours / Math.max(pkg.retos.length, 1)))
      const retoRecords = pkg.retos.map((reto, index) => {
        const start = new Date(eventStartDate.getTime() + index * slotHours * 60 * 60 * 1000)
        const end = new Date(start.getTime() + Math.max(4, Math.min(slotHours, 12)) * 60 * 60 * 1000)
        return {
          id: randomUUID(),
          event_id: eventId,
          title: reto.title,
          description: 'Reto preconfigurado generado por el setup Express.',
          instructions: {
            preset: 'express',
            templateId: reto.templateId,
          },
          reward: {
            points: reto.points,
          },
          auto_lock: false,
          start_at: start.toISOString(),
          end_at: end.toISOString(),
          created_at: nowIso,
          updated_at: nowIso,
        }
      })

      const { data: createdRetos, error: retosError } = await serviceClient
        .from('event_pruebas')
        .insert(retoRecords)
        .select()

      if (retosError) {
        console.error('[QUICK START] Error creating retos:', retosError)
        return NextResponse.json({ error: 'No se pudieron crear los retos' }, { status: 500 })
      }

      console.log('[QUICK START] Retos created:', createdRetos?.length)

      // 3. Configurar timeline para todos los QRs disponibles
      let { data: qrRows, error: qrError } = await serviceClient
        .from('qrs')
        .select('id, code, event_id, group_id')
        .eq('event_id', eventId)

      if (qrError) {
        console.error('[QUICK START] Failed to load QRs', qrError)
        return NextResponse.json({ error: 'No se pudieron cargar los QRs' }, { status: 500 })
      }

      if ((!qrRows || qrRows.length === 0) && event.qr_group_id) {
        const { data: groupQRs, error: groupQrError } = await serviceClient
          .from('qrs')
          .select('id, code, event_id, group_id')
          .eq('group_id', event.qr_group_id)

        if (groupQrError) {
          console.error('[QUICK START] Failed to load QRs by group', groupQrError)
          return NextResponse.json({ error: 'No se pudieron cargar los QRs del grupo' }, { status: 500 })
        }

        qrRows = groupQRs ?? []
      }

      let destinationsCreated = 0

      if (qrRows && qrRows.length > 0) {
        const updates: Array<{ qrId: string; destinationId: string | null }> = []

        for (const qr of qrRows) {
          const destinationRecords = [
            {
              id: randomUUID(),
              event_id: eventId,
              qr_id: qr.id,
              type: 'microsite',
              label: 'Microsite del evento',
              target_url: `${APP_URL}/e/${eventId}/microsite`,
              payload: { preset: 'express' },
              is_active: true,
              priority: 0,
              start_at: eventStartIso,
              end_at: eventEndIso,
              created_at: nowIso,
              updated_at: nowIso,
            },
            ...createdRetos.map((reto, index) => ({
              id: randomUUID(),
              event_id: eventId,
              qr_id: qr.id,
              type: 'prueba' as const,
              label: reto.title,
              target_url: `${APP_URL}/e/${eventId}/retos/${reto.id}`,
              payload: { retoId: reto.id, templateId: pkg.retos[index]?.templateId },
              is_active: false,
              priority: index + 1,
              start_at: retoRecords[index].start_at,
              end_at: retoRecords[index].end_at,
              created_at: nowIso,
              updated_at: nowIso,
            })),
          ]

          const { data: insertedDestinations, error: destinationsError } = await serviceClient
            .from('qr_destinations')
            .insert(destinationRecords)
            .select('id, is_active')

          if (destinationsError) {
            console.error('[QUICK START] Failed to create destinations', destinationsError)
            return NextResponse.json({ error: 'No se pudieron crear las planificaciones' }, { status: 500 })
          }

          destinationsCreated += insertedDestinations?.length ?? 0

          const activeDestination = insertedDestinations?.find((dest) => dest.is_active) ?? insertedDestinations?.[0] ?? null
          updates.push({ qrId: qr.id, destinationId: activeDestination?.id ?? null })
        }

        for (const update of updates) {
          if (!update.destinationId) continue

          const { error: updateError } = await serviceClient
            .from('qrs')
            .update({
              event_id: eventId,
              active_destination_id: update.destinationId,
              last_active_at: nowIso,
            })
            .eq('id', update.qrId)

          if (updateError) {
            console.error('[QUICK START] Failed to set active destination', updateError)
          }
        }

        console.log('[QUICK START] Timeline created for', qrRows.length, 'QRs')
      } else {
        console.warn('[QUICK START] No QRs available to schedule')
      }

      return NextResponse.json({
        success: true,
        message: 'Express package applied successfully',
        modulesActivated: moduleRecords.length,
        retosCreated: createdRetos?.length ?? 0,
        destinationsCreated,
      })
    }
    return NextResponse.json({ error: 'Not implemented' }, { status: 501 })
  } catch (error) {
    console.error('[QUICK START] Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}




















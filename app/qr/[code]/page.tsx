import { redirect } from 'next/navigation'
import { createServiceSupabaseClient } from '@/lib/supabaseServer'

// Forzar que sea dinámico (no estático)
export const dynamic = 'force-dynamic'
export const revalidate = 0

const supabase = createServiceSupabaseClient()

interface DestinationRecord {
  id: string
  type: string
  target_url: string | null
  is_active: boolean
  start_at: string | null
  end_at: string | null
  priority: number
}

function resolveDestination(
  destinations: DestinationRecord[],
  now: Date
): DestinationRecord | null {
  const active = destinations.filter((d) => d.is_active)

  const scheduled = active.filter((d) => {
    const startAt = d.start_at ? new Date(d.start_at) : null
    const endAt = d.end_at ? new Date(d.end_at) : null
    if (startAt && now < startAt) return false
    if (endAt && now > endAt) return false
    return true
  })

  if (scheduled.length > 0) {
    scheduled.sort((a, b) => b.priority - a.priority)
    return scheduled[0]
  }

  const fallback = active.filter((d) => !d.start_at && !d.end_at)
  if (fallback.length > 0) {
    fallback.sort((a, b) => b.priority - a.priority)
  }

  return fallback[0] ?? null
}

export default async function QRRedirectPage({
  params,
}: {
  params: { code: string }
}) {
  const { code } = params
  const now = new Date()
  const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

  console.log('[QR PAGE] Looking for code:', code)

  // 1. Buscar el QR
  const { data: qr, error } = await supabase
    .from('qrs')
    .select('id, code, destination_url, is_active, scan_count, event_id, active_destination_id')
    .eq('code', code)
    .single()

  console.log('[QR PAGE] Found QR:', qr ? `${qr.code} (active: ${qr.is_active})` : 'NOT FOUND')
  console.log('[QR PAGE] Error:', error)

  if (error || !qr || qr.is_active === false) {
    console.log('[QR PAGE] Redirecting to 404')
    redirect('/404')
  }

  let resolvedUrl = qr.destination_url || APP_URL
  let destinationId: string | null = qr.active_destination_id ?? null

  // 2. Si tiene evento, buscar destinos
  if (qr.event_id) {
    const { data: event } = await supabase
      .from('events')
      .select('id, status, expires_at, config')
      .eq('id', qr.event_id)
      .maybeSingle()

    if (event) {
      const expiresAt = event.expires_at ? new Date(event.expires_at) : null
      const eventExpired = Boolean(expiresAt && now >= expiresAt)

      const fallbackUrl =
        (event.config as any)?.fallback_url || qr.destination_url || APP_URL
      const expiredUrl = (event.config as any)?.expired_url || `${APP_URL}/evento-expirado`

      const { data: destinations } = await supabase
        .from('qr_destinations')
        .select('id, type, target_url, is_active, start_at, end_at, priority')
        .eq('qr_id', qr.id)

      const destinationRecord = eventExpired
        ? null
        : resolveDestination(destinations || [], now)

      if (eventExpired) {
        resolvedUrl = expiredUrl
        destinationId = null
      } else if (destinationRecord) {
        resolvedUrl = destinationRecord.target_url || fallbackUrl
        destinationId = destinationRecord.id
        console.log('[QR PAGE] Using destination:', destinationRecord.id, '→', resolvedUrl)
      } else {
        resolvedUrl = fallbackUrl
        destinationId = null
        console.log('[QR PAGE] No active destination, using fallback:', resolvedUrl)
      }
    }
  }

  resolvedUrl = resolvedUrl || APP_URL

  console.log('[QR PAGE] Final redirect URL:', resolvedUrl)

  // 3. Incrementar contador de escaneos
  const newScanCount = (qr.scan_count || 0) + 1
  
  await supabase
    .from('qrs')
    .update({
      scan_count: newScanCount,
      last_active_at: new Date().toISOString(),
    })
    .eq('id', qr.id)

  console.log('[QR PAGE] Scan count updated:', newScanCount)

  // 4. Ejecutar triggers si el destino tiene
  if (destinationId) {
    try {
      const { data: triggerResults } = await supabase
        .rpc('execute_qr_triggers', {
          p_destination_id: destinationId,
          p_scan_count: newScanCount,
        })

      if (triggerResults && Array.isArray(triggerResults) && triggerResults.length > 0) {
        console.log('[QR PAGE] Triggers executed:', triggerResults)
      }
    } catch (triggerError) {
      console.error('[QR PAGE] Error executing triggers:', triggerError)
      // No fallar el redirect si los triggers fallan
    }
  }

  // 5. Redirigir
  redirect(resolvedUrl)
}


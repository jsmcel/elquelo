import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.43.1'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SERVICE_ROLE_KEY')

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error('Missing Supabase service credentials')
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
})

serve(async (_req) => {
  const now = new Date().toISOString()

  const { data: events, error: eventsError } = await supabase
    .from('events')
    .select('id, event_date, expires_at, content_ttl_days')
    .eq('status', 'live')

  if (eventsError) {
    console.error('Failed to load events', eventsError)
    return new Response(JSON.stringify({ error: 'events_error' }), { status: 500 })
  }

  for (const event of events ?? []) {
    if (!event.id) continue

    if (event.expires_at && new Date(event.expires_at) <= new Date(now)) {
      await supabase
        .from('events')
        .update({ status: 'archived', updated_at: now })
        .eq('id', event.id)
    }

    const { data: destinations } = await supabase
      .from('qr_destinations')
      .select('id, qr_id, start_at, end_at, is_active, priority')
      .eq('event_id', event.id)

    if (!destinations || destinations.length === 0) continue

    const groups = new Map<string, typeof destinations>()
    destinations.forEach((destination) => {
      if (!destination.qr_id) return
      const list = groups.get(destination.qr_id) ?? []
      list.push(destination)
      groups.set(destination.qr_id, list)
    })

    for (const [qrId, list] of groups.entries()) {
      const active = list
        .filter((destination) => {
          const start = destination.start_at ? new Date(destination.start_at) : null
          const end = destination.end_at ? new Date(destination.end_at) : null
          const isInsideStart = !start || start <= new Date(now)
          const isInsideEnd = !end || end > new Date(now)
          return (destination.is_active ?? true) && isInsideStart && isInsideEnd
        })
        .sort((a, b) => (a.priority ?? 0) - (b.priority ?? 0))

      const selected = active[0] ?? null
      await supabase
        .from('qrs')
        .update({
          active_destination_id: selected?.id ?? null,
          last_active_at: now,
        })
        .eq('id', qrId)
    }
  }

  return new Response(JSON.stringify({ success: true, processed: events?.length ?? 0 }), {
    headers: { 'Content-Type': 'application/json' },
  })
})

import { randomUUID } from 'crypto'
import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import type Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'

export const runtime = 'nodejs'
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET

if (!webhookSecret) {
  throw new Error('STRIPE_WEBHOOK_SECRET is not set')
}

const DEFAULT_CONTENT_TTL = 30
const DEFAULT_TIMEZONE = 'Europe/Madrid'

function parseJsonArray(value: string | undefined): string[] {
  if (!value) return []
  try {
    const parsed = JSON.parse(value)
    return Array.isArray(parsed) ? parsed : []
  } catch (error) {
    console.warn('Failed to parse JSON array from metadata', error)
    return []
  }
}

function safeParseNumber(value: string | undefined, fallback: number): number {
  if (!value) return fallback
  const parsed = parseInt(value, 10)
  return Number.isNaN(parsed) ? fallback : parsed
}

function computeExpiresAt(eventDateIso: string, ttlDays: number): string | null {
  const date = new Date(eventDateIso)
  if (Number.isNaN(date.getTime())) {
    return null
  }
  const ttl = Number.isNaN(ttlDays) ? DEFAULT_CONTENT_TTL : ttlDays
  date.setUTCDate(date.getUTCDate() + ttl)
  return date.toISOString()
}

export async function POST(req: NextRequest) {
  const body = await req.text()
  const signature = req.headers.get('stripe-signature')

  if (!signature) {
    return NextResponse.json({ error: 'No signature' }, { status: 400 })
  }

  let event

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      webhookSecret
    )
  } catch (err: any) {
    console.error('Webhook signature verification failed:', err.message)
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session
        const metadata = session.metadata || {}
        const userId = metadata.user_id

        if (!userId) {
          console.warn('Stripe checkout missing user_id metadata, skipping provisioning.')
          break
        }

        
        console.log('[STRIPE WEBHOOK] checkout.session.completed', {
          sessionId: session.id,
          metadata,
        })

const nowIso = new Date().toISOString()
        const items = (() => {
          try {
            return JSON.parse(metadata.items || '[]')
          } catch (error) {
            console.error('Failed to parse checkout items metadata', error)
            return []
          }
        })()

        let qrGroupId = metadata.qr_group_id?.trim() ? metadata.qr_group_id : null
        const qrCodes = parseJsonArray(metadata.qr_codes || metadata.qrCodes)
        const eventType = metadata.event_type || metadata.product_type || 'evento_despedida'
        const eventTimezone = metadata.event_timezone || DEFAULT_TIMEZONE
        const eventDateIso = metadata.event_date || nowIso
        const contentTtlDays = safeParseNumber(metadata.content_ttl_days, DEFAULT_CONTENT_TTL)
        const expiresAtIso = computeExpiresAt(eventDateIso, contentTtlDays)

        const { data: order, error: orderError } = await supabase
          .from('orders')
          .insert({
            user_id: userId,
            stripe_payment_intent_id: session.payment_intent as string | null,
            status: 'paid',
            total_amount: session.amount_total ? session.amount_total / 100 : 0,
            currency: session.currency,
            shipping_address: session.shipping_details,
            event_type: eventType,
            qr_group_id: qrGroupId,
            qr_codes: qrCodes,
            event_date_request: eventDateIso,
            content_ttl_days: contentTtlDays,
            created_at: nowIso,
          })
          .select()
          .single()

        if (orderError || !order) {
          console.error('Error creating order:', orderError)
          return NextResponse.json({ error: 'Database error' }, { status: 500 })
        }

        for (const item of items) {
          try {
            await supabase.from('order_items').insert({
              order_id: order.id,
              product_id: null,
              quantity: item.quantity,
              price: item.price,
              qr_code: item.qr_code,
              created_at: nowIso,
            })
          } catch (itemError) {
            console.error('Failed to insert order item', itemError)
          }
        }

        const eventName = metadata.event_name || `Despedida ${order.id.slice(0, 8)}`
        const eventDescription = metadata.event_description || null
        const organizerName = metadata.organizer_name || session.customer_details?.name || null
        const organizerEmail = metadata.organizer_email || session.customer_details?.email || null

        const eventConfig = {
          timezone: eventTimezone,
          qrCodes,
          source: 'stripe_checkout',
        }

        const { data: eventRecord, error: eventError } = await supabase
          .from('events')
          .upsert(
            {
              name: eventName,
              description: eventDescription,
              event_date: eventDateIso,
              organizer_name: organizerName,
              organizer_email: organizerEmail,
              is_active: true,
              status: 'live',
              type: eventType,
              owner_id: userId,
              order_id: order.id,
              stripe_session_id: session.id,
              qr_group_id: qrGroupId,
              config: eventConfig,
              expires_at: expiresAtIso,
              content_ttl_days: contentTtlDays,
              event_timezone: eventTimezone,
            },
            { onConflict: 'stripe_session_id' }
          )
          .select()
          .single()

        if (eventError || !eventRecord) {
          console.error('Failed to upsert event:', eventError)
          return NextResponse.json({ error: 'Event provisioning failed' }, { status: 500 })
        }

        await supabase
          .from('event_members')
          .upsert(
            {
              event_id: eventRecord.id,
              user_id: userId,
              role: 'owner',
              accepted_at: nowIso,
            },
            { onConflict: 'event_id,user_id' }
          )

        // Try to find QRs either by group_id or by codes
        let qrRows: any[] = []
        
        if (qrGroupId) {
          const { data: qrByGroup, error: qrError } = await supabase
            .from('qrs')
            .select('id, code, destination_url, active_destination_id, metadata')
            .eq('group_id', qrGroupId)

          if (qrError) {
            console.error('Failed to load QRs for group', qrError)
          } else if (qrByGroup) {
            qrRows = qrByGroup
          }
        }
        
        // If no QRs found by group but we have codes, try to find by codes
        if (qrRows.length === 0 && qrCodes.length > 0) {
          const { data: qrByCodes, error: qrCodesError } = await supabase
            .from('qrs')
            .select('id, code, destination_url, active_destination_id, metadata, group_id')
            .in('code', qrCodes)

          if (qrCodesError) {
            console.error('Failed to load QRs by codes', qrCodesError)
          } else if (qrByCodes && qrByCodes.length > 0) {
            qrRows = qrByCodes
            // Update qrGroupId if we found QRs with a group
            if (!qrGroupId && qrByCodes[0].group_id) {
              qrGroupId = qrByCodes[0].group_id
              // Update event with the group_id
              await supabase
                .from('events')
                .update({ qr_group_id: qrGroupId })
                .eq('id', eventRecord.id)
            }
          }
        }

        if (qrRows.length === 0) {
          console.warn('[STRIPE WEBHOOK] No QRs found for event', {
            eventId: eventRecord.id,
            qrGroupId,
            qrCodes,
          })
        } else {
          const { data: existingDestinations } = await supabase
            .from('qr_destinations')
            .select('id, qr_id, is_active, priority')
            .in('qr_id', qrRows.map((qr) => qr.id))

          const destinationMap = new Map<string, string>()
          existingDestinations?.forEach((dest) => {
            if (!destinationMap.has(dest.qr_id) || dest.is_active) {
              destinationMap.set(dest.qr_id, dest.id)
            }
          })

          const destinationsToCreate = qrRows
            .filter((qr) => !destinationMap.has(qr.id))
            .map((qr, index) => ({
              id: randomUUID(),
              event_id: eventRecord.id,
              qr_id: qr.id,
              type: 'external',
              label: `Destino inicial ${index + 1}`,
              target_url: qr.destination_url || `${process.env.NEXT_PUBLIC_APP_URL}/bienvenida`,
              is_active: true,
              priority: 0,
              start_at: eventDateIso,
              end_at: expiresAtIso,
              created_at: nowIso,
              updated_at: nowIso,
            }))

          if (destinationsToCreate.length > 0) {
            const { data: insertedDestinations, error: insertDestError } = await supabase
              .from('qr_destinations')
              .insert(destinationsToCreate)
              .select('id, qr_id')

            if (insertDestError) {
              console.error('Failed to create default destinations', insertDestError)
            } else {
              insertedDestinations?.forEach((dest) => {
                destinationMap.set(dest.qr_id, dest.id)
              })
            }
          }

          const qrUpdates = qrRows.map((qr) => {
            const metadataPayload =
              qr.metadata && typeof qr.metadata === 'object'
                ? { ...qr.metadata }
                : {}

            if (!('original_destination_url' in metadataPayload) && qr.destination_url) {
              metadataPayload.original_destination_url = qr.destination_url
            }

            return {
              id: qr.id,
              event_id: eventRecord.id,
              active_destination_id:
                destinationMap.get(qr.id) || qr.active_destination_id || null,
              last_active_at: nowIso,
              metadata: metadataPayload,
            }
          })

          if (qrUpdates.length > 0) {
            const { error: updateQrError } = await supabase
              .from('qrs')
              .upsert(qrUpdates)

            if (updateQrError) {
              console.error('Failed to update QRs with event linkage', updateQrError)
            }
          }
        }

        const defaultModules = [
          { type: 'album', status: 'active' },
          { type: 'message_wall', status: 'draft' },
          { type: 'microsite', status: 'draft' },
          { type: 'challenge_board', status: 'draft' },
        ]

        await supabase
          .from('event_modules')
          .upsert(
            defaultModules.map((module) => ({
              event_id: eventRecord.id,
              type: module.type,
              status: module.status,
              start_at: eventDateIso,
              end_at: expiresAtIso,
            })),
            { onConflict: 'event_id,type' }
          )

        const { data: existingAlbum, error: existingAlbumError } = await supabase
          .from('event_albums')
          .select('id')
          .eq('event_id', eventRecord.id)
          .maybeSingle()

        if (!existingAlbumError && !existingAlbum) {
          await supabase.from('event_albums').insert({
            event_id: eventRecord.id,
            title: 'Álbum principal',
            settings: { visibility: 'members' },
            created_at: nowIso,
          })
        }

        await supabase.from('event_actions_log').insert({
          event_id: eventRecord.id,
          actor_id: userId,
          action: 'event_activated',
          payload: {
            source: 'stripe_webhook',
            order_id: order.id,
            qr_group_id: qrGroupId,
            qr_codes: qrCodes,
          },
          created_at: nowIso,
        })

        try {
          const printfulResponse = await fetch(
            `${process.env.NEXT_PUBLIC_APP_URL}/api/printful/orders`,
            {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                orderId: order.id,
              }),
            }
          )

          if (printfulResponse.ok) {
            const printfulResult = await printfulResponse.json()
            console.log('Order sent to Printful successfully:', printfulResult.printfulOrderId)
          } else {
            console.error('Failed to send order to Printful')
          }
        } catch (printfulError) {
          console.error('Error sending to Printful:', printfulError)
        }

        console.log('Order and event created successfully:', order.id, eventRecord.id)
        break
      }

      case 'payment_intent.payment_failed':
        console.log('Payment failed:', event.data.object.id)
        break

      default:
        console.log(`Unhandled event type: ${event.type}`)
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('Webhook error:', error)
    return NextResponse.json({ error: 'Webhook error' }, { status: 500 })
  }
}



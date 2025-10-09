import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { promises as fs } from 'fs'
import { createClient } from '@supabase/supabase-js'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: NextRequest) {
  try {
    const {
      items,
      productType,
      subscriptionId,
      qrGroupId,
      qrCodes,
      eventDate,
      eventTimezone,
      contentTtlDays,
    } = await req.json()

    const supabaseAuth = createRouteHandlerClient({ cookies })
    const {
      data: { user },
    } = await supabaseAuth.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const lineItems = (Array.isArray(items) ? items : []).reduce((acc: any[], item: any, index: number) => {
      if (!item) {
        return acc
      }
      const price = Number(item.price)
      const quantity = Number(item.quantity ?? 1)
      if (!Number.isFinite(price) || price <= 0 || !Number.isInteger(quantity) || quantity <= 0) {
        console.warn('Skipping invalid checkout item', { index, price, quantity })
        return acc
      }
      acc.push({
        price_data: {
          currency: 'eur',
          product_data: {
            name: String(item.name ?? `Camiseta ${index + 1}`),
            description: item.description ? String(item.description) : undefined,
            images: Array.isArray(item.images) ? item.images.map((img: any) => String(img)) : [],
          },
          unit_amount: Math.round(price * 100),
        },
        quantity,
      })
      return acc
    }, [])

    if (lineItems.length === 0) {
      return NextResponse.json({ error: 'No items provided for checkout' }, { status: 400 })
    }

    const totalAmount = lineItems.reduce((sum: number, item: any) => sum + item.price_data.unit_amount * item.quantity, 0) / 100

    const normalizedEventDate = eventDate ? new Date(eventDate).toISOString() : ''
    const normalizedTtl =
      typeof contentTtlDays === 'number'
        ? contentTtlDays
        : contentTtlDays
        ? parseInt(contentTtlDays, 10)
        : undefined

    const metadataItemsRaw = (Array.isArray(items) ? items : []).map((item) => ({
      price: Number(item?.price ?? 0),
      quantity: Number(item?.quantity ?? 1),
      qr_code: String(item?.qr_code ?? ''),
    }))

    let metadataItems = metadataItemsRaw
    let itemsJson = JSON.stringify(metadataItems)
    if (itemsJson.length > 500) {
      metadataItems = metadataItems.map(({ price, quantity, qr_code }) => ({
        price,
        quantity,
        qr_code,
      }))
      itemsJson = JSON.stringify(metadataItems)
    }

    const metadataEntries: Record<string, string> = {
      user_id: user.id,
      product_type: productType,
      subscription_id: subscriptionId ?? '',
      initial_url: items?.[0]?.initial_url || 'https://elquelo.eu/welcome',
      qr_group_id: qrGroupId ?? '',
      event_type: productType === 'evento' ? 'evento_despedida' : productType,
      event_date: normalizedEventDate,
      event_timezone: eventTimezone || '',
      content_ttl_days:
        typeof normalizedTtl === 'number' && !Number.isNaN(normalizedTtl)
          ? String(normalizedTtl)
          : '',
      qr_codes: Array.isArray(qrCodes) ? JSON.stringify(qrCodes) : '',
      total_amount_eur: totalAmount ? String(totalAmount) : '',
      item_count: String(lineItems.length),
      items: itemsJson,
    }

    const metadata = Object.fromEntries(
      Object.entries(metadataEntries).filter(([, value]) => value !== '')
    )

    console.log('Creating checkout session', {
      userId: user.id,
      items: lineItems.length,
      productType,
      totalAmount,
    })

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: lineItems,
      mode: productType === 'estado' ? 'subscription' : 'payment',
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/cancel`,
      customer_email: user.email,
      metadata,
      shipping_address_collection: {
        allowed_countries: ['ES', 'FR', 'DE', 'IT', 'PT', 'NL', 'BE', 'AT', 'CH'],
      },
      tax_id_collection: {
        enabled: true,
      },
    })

    return NextResponse.json({ sessionId: session.id })
  } catch (error) {
    console.error('Error creating checkout session:', error)
    const message = error instanceof Error ? error.message : 'Failed to create checkout session'
    try {
      await fs.appendFile(
        'checkout-error.log',
        `\n[${new Date().toISOString()}] ${message}\n${JSON.stringify({
          items,
          productType,
          qrGroupId,
          qrCodes,
        })}\n`
      )
    } catch (logError) {
      console.error('Failed to write checkout error log:', logError)
    }
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

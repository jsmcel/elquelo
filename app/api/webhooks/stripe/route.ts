import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { createClient } from '@supabase/supabase-js'
import { headers } from 'next/headers'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: NextRequest) {
  const body = await req.text()
  const signature = headers().get('stripe-signature')

  if (!signature) {
    return NextResponse.json({ error: 'No signature' }, { status: 400 })
  }

  let event

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    )
  } catch (err: any) {
    console.error('Webhook signature verification failed:', err.message)
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed':
        const session = event.data.object
        
        // Crear orden en la base de datos
        const { data: order, error: orderError } = await supabase
          .from('orders')
          .insert({
            id: session.id,
            user_id: session.metadata?.user_id,
            stripe_payment_intent_id: session.payment_intent,
            status: 'paid',
            total_amount: session.amount_total ? session.amount_total / 100 : 0,
            currency: session.currency,
            shipping_address: (session as any).shipping_details,
            created_at: new Date().toISOString()
          })
          .select()
          .single()

        if (orderError) {
          console.error('Error creating order:', orderError)
          return NextResponse.json({ error: 'Database error' }, { status: 500 })
        }

        // Procesar items del pedido
        const items = JSON.parse(session.metadata?.items || '[]')
        
        for (const item of items) {
          await supabase
            .from('order_items')
            .insert({
              order_id: session.id,
              product_id: null, // Por ahora null, se puede conectar con tabla de productos
              quantity: item.quantity,
              price: item.price,
              qr_code: item.qr_code,
              created_at: new Date().toISOString()
            })
        }

        // Enviar pedido a Printful automáticamente
        try {
          const printfulResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/printful/orders`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              orderId: session.id
            })
          })

          if (printfulResponse.ok) {
            const printfulResult = await printfulResponse.json()
            console.log('Order sent to Printful successfully:', printfulResult.printfulOrderId)
          } else {
            console.error('Failed to send order to Printful')
          }
        } catch (printfulError) {
          console.error('Error sending to Printful:', printfulError)
          // No fallar el webhook si Printful falla
        }

        console.log('Order created successfully:', order.id)
        break

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
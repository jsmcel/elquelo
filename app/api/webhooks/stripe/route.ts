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
        
        console.log('Processing checkout session completed:', session.id)
        
        // Actualizar orden existente (ya creada en checkout)
        const { data: order, error: orderError } = await supabase
          .from('orders')
          .update({
            stripe_payment_intent_id: session.payment_intent,
            status: 'paid',
            total_amount: session.amount_total ? session.amount_total / 100 : 0,
            currency: session.currency,
            shipping_address: (session as any).shipping_details,
            updated_at: new Date().toISOString()
          })
          .eq('id', session.metadata?.order_id)
          .select()
          .single()

        if (orderError) {
          console.error('Error updating order:', orderError)
          return NextResponse.json({ error: 'Database error' }, { status: 500 })
        }

        console.log('Order updated successfully:', order.id)

        // Enviar pedido a Printful automáticamente
        try {
          const printfulResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/printful/orders`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              orderId: session.metadata?.order_id
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
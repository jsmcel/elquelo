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
  const signature = headers().get('stripe-signature') as string

  let event

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    )
  } catch (err: any) {
    console.error('Webhook signature verification failed:', err.message)
    return NextResponse.json({ error: 'Webhook signature verification failed' }, { status: 400 })
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutSessionCompleted(event.data.object)
        break
      
      case 'customer.subscription.created':
      case 'customer.subscription.updated':
      case 'customer.subscription.deleted':
        await handleSubscriptionChange(event.data.object, event.type)
        break
      
      case 'invoice.payment_succeeded':
        await handleInvoicePaymentSucceeded(event.data.object)
        break
      
      case 'invoice.payment_failed':
        await handleInvoicePaymentFailed(event.data.object)
        break
      
      default:
        console.log(`Unhandled event type: ${event.type}`)
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('Error processing webhook:', error)
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 })
  }
}

async function handleCheckoutSessionCompleted(session: any) {
  const { data: order, error } = await supabase
    .from('orders')
    .insert({
      user_id: session.metadata?.user_id,
      stripe_payment_intent_id: session.payment_intent,
      status: 'paid',
      total_amount: session.amount_total / 100,
      currency: session.currency,
      shipping_address: session.shipping_details,
      billing_address: session.customer_details,
    })
    .select()
    .single()

  if (error) {
    console.error('Error creating order:', error)
    return
  }

  // Create order items
  if (session.metadata?.items) {
    const items = JSON.parse(session.metadata.items)
    for (const item of items) {
      await supabase.from('order_items').insert({
        order_id: order.id,
        product_id: item.product_id,
        quantity: item.quantity,
        price: item.price,
        size: item.size,
        color: item.color,
      })
    }
  }

  // Create QR code for Estado subscriptions
  if (session.metadata?.product_type === 'estado') {
    const qrCode = generateQRCode()
    await supabase.from('qrs').insert({
      code: qrCode,
      user_id: session.metadata?.user_id,
      destination_url: session.metadata?.initial_url || 'https://elquelo.com/welcome',
      title: 'Mi Estado',
      description: 'QR dinámico personal',
    })
  }

  // Create subscription record
  if (session.metadata?.subscription_id) {
    await supabase.from('subscriptions').insert({
      user_id: session.metadata?.user_id,
      stripe_subscription_id: session.metadata.subscription_id,
      status: 'active',
      current_period_start: new Date(session.subscription_details?.billing_cycle_anchor * 1000),
      current_period_end: new Date(session.subscription_details?.billing_cycle_anchor * 1000 + 30 * 24 * 60 * 60 * 1000),
    })
  }

  // Send confirmation email
  await sendConfirmationEmail(session.customer_details?.email, order.id)
}

async function handleSubscriptionChange(subscription: any, eventType: string) {
  const statusMap = {
    'customer.subscription.created': 'active',
    'customer.subscription.updated': subscription.status,
    'customer.subscription.deleted': 'cancelled',
  }

  await supabase
    .from('subscriptions')
    .update({
      status: statusMap[eventType as keyof typeof statusMap],
      current_period_start: new Date(subscription.current_period_start * 1000),
      current_period_end: new Date(subscription.current_period_end * 1000),
      cancel_at_period_end: subscription.cancel_at_period_end,
    })
    .eq('stripe_subscription_id', subscription.id)
}

async function handleInvoicePaymentSucceeded(invoice: any) {
  // Handle successful subscription payment
  console.log('Invoice payment succeeded:', invoice.id)
}

async function handleInvoicePaymentFailed(invoice: any) {
  // Handle failed subscription payment
  console.log('Invoice payment failed:', invoice.id)
  
  await supabase
    .from('subscriptions')
    .update({ status: 'past_due' })
    .eq('stripe_subscription_id', invoice.subscription)
}

function generateQRCode(): string {
  // Generate a unique QR code
  const timestamp = Date.now()
  const random = Math.random().toString(36).substring(2, 8)
  return `${timestamp}${random}`
}

async function sendConfirmationEmail(email: string, orderId: string) {
  // TODO: Implement email sending with Brevo
  console.log(`Sending confirmation email to ${email} for order ${orderId}`)
}

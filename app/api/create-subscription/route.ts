import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

export async function POST(req: NextRequest) {
  try {
    const { priceId, customerId } = await req.json()
    
    // Get user from auth
    const supabase = createRouteHandlerClient({ cookies })
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Create Stripe subscription
    const subscription = await stripe.subscriptions.create({
      customer: customerId,
      items: [{ price: priceId }],
      payment_behavior: 'default_incomplete',
      payment_settings: { save_default_payment_method: 'on_subscription' },
      expand: ['latest_invoice.payment_intent'],
      metadata: {
        user_id: user.id,
      },
    })

    const latestInvoice = subscription.latest_invoice
    let clientSecret: string | null = null

    if (latestInvoice && typeof latestInvoice !== 'string') {
      const paymentIntent = (latestInvoice as any).payment_intent
      if (paymentIntent && typeof paymentIntent !== 'string') {
        clientSecret = paymentIntent.client_secret ?? null
      }
    }

    return NextResponse.json({
      subscriptionId: subscription.id,
      clientSecret,
    })
  } catch (error) {
    console.error('Error creating subscription:', error)
    return NextResponse.json({ error: 'Failed to create subscription' }, { status: 500 })
  }
}

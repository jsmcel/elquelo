import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { createClient } from '@supabase/supabase-js'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: NextRequest) {
  try {
    const { items, productType, subscriptionId } = await req.json()
    
    // Get user from auth
    const supabaseAuth = createRouteHandlerClient({ cookies })
    const { data: { user } } = await supabaseAuth.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Calculate total amount
    const totalAmount = items.reduce((sum: number, item: any) => sum + (item.price * item.quantity), 0)
    
    // Save order to database before creating checkout session
    const { data: orderData, error: orderError } = await supabase
      .from('orders')
      .insert({
        user_id: user.id,
        total_amount: totalAmount,
        status: 'pending',
        created_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (orderError) {
      console.error('Error saving order:', orderError)
      return NextResponse.json({ error: 'Failed to save order' }, { status: 500 })
    }

    // Save order items separately
    const orderItems = items.map((item: any) => ({
      order_id: orderData.id,
      product_name: item.name,
      product_description: item.description,
      variant_id: item.variant_id,
      qr_code: item.qr_code,
      price: item.price,
      quantity: item.quantity,
      product_id: item.product_id,
    }))

    const { error: itemsError } = await supabase
      .from('order_items')
      .insert(orderItems)

    if (itemsError) {
      console.error('Error saving order items:', itemsError)
      return NextResponse.json({ error: 'Failed to save order items' }, { status: 500 })
    }
    
    // Create Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: items.map((item: any) => ({
        price_data: {
          currency: 'eur',
          product_data: {
            name: item.name,
            description: item.description,
            images: item.images || [],
          },
          unit_amount: Math.round(item.price * 100), // Convert to cents
        },
        quantity: item.quantity,
      })),
      mode: productType === 'estado' ? 'subscription' : 'payment',
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/cancel`,
      customer_email: user.email,
      metadata: {
        user_id: user.id,
        order_id: orderData.id,
        product_type: productType,
        items_count: items.length.toString(),
        subscription_id: subscriptionId,
      },
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
    return NextResponse.json({ error: 'Failed to create checkout session' }, { status: 500 })
  }
}

import { NextRequest, NextResponse } from 'next/server'
import { PrintfulAPI } from '@/lib/printful'
import { createClient } from '@supabase/supabase-js'

export async function POST(req: NextRequest) {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )
    const apiKey = process.env.PRINTFUL_API_KEY
    if (!apiKey) {
      return NextResponse.json({ error: 'Printful API key no configurada' }, { status: 500 })
    }
    const printfulClient = new PrintfulAPI(apiKey)

    const { orderId, items, shippingAddress } = await req.json()

    // Get order from database
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select(`
        *,
        order_items(
          *,
          product:products(*)
        )
      `)
      .eq('id', orderId)
      .single()

    if (orderError || !order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }

    // Prepare Printful order data
    const printfulItems = items.map((item: any) => ({
      variant_id: item.variant_id,
      quantity: item.quantity,
      retail_price: item.price.toString(),
      name: item.product.name,
      files: [
        {
          type: 'default',
          url: item.print_file_url || item.product.print_file_url,
          position: {
            area_width: 2000,
            area_height: 2000,
            width: 1000,
            height: 1000,
            top: 500,
            left: 500,
          },
        },
      ],
    }))

    // Create Printful order
    const printfulOrder = await printfulClient.createOrder({
      external_id: order.id,
      shipping: 'STANDARD',
      recipient: {
        name: shippingAddress.name,
        company: shippingAddress.company,
        address1: shippingAddress.address1,
        address2: shippingAddress.address2,
        city: shippingAddress.city,
        state_code: shippingAddress.state_code,
        country_code: shippingAddress.country_code,
        zip: shippingAddress.zip,
        phone: shippingAddress.phone,
        email: shippingAddress.email,
      },
      items: printfulItems,
      retail_costs: {
        currency: 'EUR',
        subtotal: order.total_amount.toString(),
        discount: '0',
        shipping: '0',
        tax: '0',
        total: order.total_amount.toString(),
      },
    })

    // Update order with Printful ID
    await supabase
      .from('orders')
      .update({
        printful_order_id: printfulOrder.id.toString(),
        status: 'processing',
      })
      .eq('id', orderId)

    return NextResponse.json({
      success: true,
      printfulOrderId: printfulOrder.id,
      status: printfulOrder.status,
    })
  } catch (error) {
    console.error('Error creating Printful order:', error)
    return NextResponse.json({ error: 'Failed to create Printful order' }, { status: 500 })
  }
}

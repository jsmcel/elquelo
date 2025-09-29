import { NextRequest, NextResponse } from 'next/server'
import { PrintfulAPI } from '@/lib/printful'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const printful = new PrintfulAPI(process.env.PRINTFUL_API_KEY!)

export async function POST(req: NextRequest) {
  try {
    const { orderId } = await req.json()

    if (!orderId) {
      return NextResponse.json({ error: 'Order ID is required' }, { status: 400 })
    }

    // Obtener datos de la orden desde la base de datos
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select(`
        *,
        order_items (*)
      `)
      .eq('id', orderId)
      .single()

    if (orderError || !order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }

    // Obtener datos de diseño para cada QR
    const designPromises = order.order_items.map(async (item: any) => {
      const { data: design } = await supabase
        .from('qr_designs')
        .select('*')
        .eq('qr_code', item.qr_code)
        .single()
      
      return { ...item, design }
    })

    const itemsWithDesigns = await Promise.all(designPromises)

    // Mapear a formato de Printful
    const printfulOrder = {
      external_id: order.id,
      shipping: 'STANDARD',
      recipient: {
        name: order.shipping_address?.name || 'Cliente',
        address1: order.shipping_address?.line1 || '',
        city: order.shipping_address?.city || '',
        country_code: order.shipping_address?.country || 'ES',
        zip: order.shipping_address?.postal_code || '',
        phone: order.shipping_address?.phone || '',
        email: order.customer_email || '',
      },
      items: itemsWithDesigns.map((item: any) => ({
        variant_id: getPrintfulVariantId(
          item.product_size || 'M',
          item.product_color || 'white', 
          item.product_gender || 'unisex'
        ),
        quantity: item.quantity,
        retail_price: item.price.toString(),
        name: `Camiseta personalizada - QR ${item.qr_code}`,
        files: item.design?.design_data?.imageUrl ? [{
          url: item.design.design_data.imageUrl,
          type: 'default'
        }] : []
      })),
      retail_costs: {
        currency: 'EUR',
        subtotal: order.total_amount.toString(),
        discount: '0.00',
        shipping: '0.00',
        tax: '0.00',
        total: order.total_amount.toString()
      }
    }

    // Crear orden en Printful
    const printfulResult = await printful.createOrder(printfulOrder)

    // Actualizar orden con ID de Printful
    await supabase
      .from('orders')
      .update({
        printful_order_id: printfulResult.id,
        status: 'processing',
        updated_at: new Date().toISOString()
      })
      .eq('id', orderId)

    return NextResponse.json({ 
      success: true, 
      printfulOrderId: printfulResult.id,
      status: printfulResult.status
    })

  } catch (error) {
    console.error('Error creating Printful order:', error)
    return NextResponse.json({ 
      error: 'Failed to create Printful order',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

// Mapear tallas, colores y géneros a IDs de Printful
function getPrintfulVariantId(size: string, color: string, gender: string): number {
  // Estos IDs son ejemplos - necesitas obtener los reales de tu cuenta de Printful
  const variantMap: Record<string, number> = {
    // Tallas Unisex
    'XS-unisex-white': 4011,
    'S-unisex-white': 4012,
    'M-unisex-white': 4013,
    'L-unisex-white': 4014,
    'XL-unisex-white': 4015,
    'XXL-unisex-white': 4016,
    
    // Tallas Chica
    'XS-chica-white': 4021,
    'S-chica-white': 4022,
    'M-chica-white': 4023,
    'L-chica-white': 4024,
    'XL-chica-white': 4025,
    
    // Tallas Chico
    'XS-chico-white': 4031,
    'S-chico-white': 4032,
    'M-chico-white': 4033,
    'L-chico-white': 4034,
    'XL-chico-white': 4035,
    'XXL-chico-white': 4036,
  }

  const key = `${size}-${gender}-${color}`
  return variantMap[key] || 4013 // Default: M unisex white
}

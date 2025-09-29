import { NextRequest, NextResponse } from 'next/server'
import { PrintfulAPI } from '@/lib/printful'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const printful = new PrintfulAPI(process.env.PRINTFUL_API_KEY!)

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const orderId = searchParams.get('orderId')

    if (!orderId) {
      return NextResponse.json({ error: 'Order ID is required' }, { status: 400 })
    }

    // Obtener orden de la base de datos
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('*')
      .eq('id', orderId)
      .single()

    if (orderError || !order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }

    if (!order.printful_order_id) {
      return NextResponse.json({ 
        status: 'not_sent',
        message: 'Order not sent to Printful yet'
      })
    }

    // Obtener estado desde Printful
    const printfulStatus = await printful.getOrderStatus(order.printful_order_id)

    // Actualizar estado en la base de datos
    const newStatus = mapPrintfulStatus(printfulStatus.status)
    await supabase
      .from('orders')
      .update({
        status: newStatus,
        tracking_number: printfulStatus.tracking_number || null,
        updated_at: new Date().toISOString()
      })
      .eq('id', orderId)

    return NextResponse.json({
      orderId: order.id,
      printfulOrderId: order.printful_order_id,
      status: newStatus,
      trackingNumber: printfulStatus.tracking_number,
      printfulStatus: printfulStatus.status,
      lastUpdated: new Date().toISOString()
    })

  } catch (error) {
    console.error('Error getting Printful status:', error)
    return NextResponse.json({ 
      error: 'Failed to get order status',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

// Mapear estados de Printful a nuestros estados
function mapPrintfulStatus(printfulStatus: string): string {
  const statusMap: Record<string, string> = {
    'draft': 'pending',
    'pending': 'processing',
    'failed': 'cancelled',
    'canceled': 'cancelled',
    'onhold': 'processing',
    'inprocess': 'processing',
    'fulfilled': 'shipped',
    'returned': 'cancelled'
  }

  return statusMap[printfulStatus] || 'processing'
}

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(req: NextRequest) {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )
    const webhookData = await req.json()
    const { type, data } = webhookData

    console.log('Printful webhook received:', type, data)

    switch (type) {
      case 'order_updated':
        await handleOrderUpdated(supabase, data)
        break
      case 'order_failed':
        await handleOrderFailed(supabase, data)
        break
      case 'order_canceled':
        await handleOrderCanceled(supabase, data)
        break
      case 'package_shipped':
        await handlePackageShipped(supabase, data)
        break
      case 'package_returned':
        await handlePackageReturned(supabase, data)
        break
      default:
        console.log(`Unhandled webhook type: ${type}`)
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('Error processing Printful webhook:', error)
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 })
  }
}

async function handleOrderUpdated(supabase: any, data: any) {
  const { external_id, status } = data
  
  await supabase
    .from('orders')
    .update({ status: mapPrintfulStatus(status) })
    .eq('id', external_id)
}

async function handleOrderFailed(supabase: any, data: any) {
  const { external_id, reason } = data
  
  await supabase
    .from('orders')
    .update({ 
      status: 'cancelled',
      metadata: { failure_reason: reason }
    })
    .eq('id', external_id)
}

async function handleOrderCanceled(supabase: any, data: any) {
  const { external_id } = data
  
  await supabase
    .from('orders')
    .update({ status: 'cancelled' })
    .eq('id', external_id)
}

async function handlePackageShipped(supabase: any, data: any) {
  const { external_id, tracking_number, tracking_url } = data
  
  await supabase
    .from('orders')
    .update({ 
      status: 'shipped',
      tracking_number,
      metadata: { tracking_url }
    })
    .eq('id', external_id)
}

async function handlePackageReturned(supabase: any, data: any) {
  const { external_id, reason } = data
  
  await supabase
    .from('orders')
    .update({ 
      status: 'returned',
      metadata: { return_reason: reason }
    })
    .eq('id', external_id)
}

function mapPrintfulStatus(status: string): string {
  const statusMap: { [key: string]: string } = {
    'draft': 'pending',
    'pending': 'processing',
    'failed': 'cancelled',
    'canceled': 'cancelled',
    'onhold': 'processing',
    'inprocess': 'processing',
    'fulfilled': 'shipped',
  }
  
  return statusMap[status] || 'processing'
}

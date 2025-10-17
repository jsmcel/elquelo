import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function GET() {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )
    console.log('Checking events and orders...')
    
    // Check events
    const { data: events, error: eventsError } = await supabase
      .from('events')
      .select('*')
      .order('created_at', { ascending: false })
    
    if (eventsError) {
      console.error('Error fetching events:', eventsError)
      return NextResponse.json({ success: false, error: eventsError.message }, { status: 500 })
    }
    
    // Check orders
    const { data: orders, error: ordersError } = await supabase
      .from('orders')
      .select('*')
      .order('created_at', { ascending: false })
    
    if (ordersError) {
      console.error('Error fetching orders:', ordersError)
      return NextResponse.json({ success: false, error: ordersError.message }, { status: 500 })
    }
    
    // Check QRs with event_id
    const { data: qrs, error: qrsError } = await supabase
      .from('qrs')
      .select('*')
      .not('event_id', 'is', null)
      .order('created_at', { ascending: false })
    
    if (qrsError) {
      console.error('Error fetching QRs:', qrsError)
      return NextResponse.json({ success: false, error: qrsError.message }, { status: 500 })
    }
    
    return NextResponse.json({ 
      success: true, 
      data: {
        events: events || [],
        orders: orders || [],
        qrs: qrs || []
      }
    })
    
  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json({ success: false, error: 'Check failed' }, { status: 500 })
  }
}


import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

export async function GET(req: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Obtener órdenes del usuario
    const { data: orders, error } = await supabase
      .from('orders')
      .select(`
        id,
        status,
        total_amount,
        currency,
        printful_order_id,
        tracking_number,
        created_at,
        updated_at
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching orders:', error)
      return NextResponse.json({ error: 'Failed to fetch orders' }, { status: 500 })
    }

    return NextResponse.json({ orders: orders || [] })

  } catch (error) {
    console.error('Error in orders API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

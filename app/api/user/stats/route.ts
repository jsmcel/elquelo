import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

export async function GET(req: NextRequest) {
  try {
    // Get user from auth
    const supabase = createRouteHandlerClient({ cookies })
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user stats
    const [
      { count: totalQRs },
      { count: totalOrders },
      { count: totalNFTs },
      { data: scansData }
    ] = await Promise.all([
      supabase.from('qrs').select('*', { count: 'exact', head: true }).eq('user_id', user.id),
      supabase.from('orders').select('*', { count: 'exact', head: true }).eq('user_id', user.id),
      supabase.from('claims').select('*', { count: 'exact', head: true }).eq('user_id', user.id),
      supabase.from('scans').select('qr_id').in('qr_id', 
        (await supabase.from('qrs').select('id').eq('user_id', user.id)).data?.map(qr => qr.id) || []
      )
    ])

    const totalScans = scansData?.length || 0

    return NextResponse.json({
      totalQRs: totalQRs || 0,
      totalScans,
      totalOrders: totalOrders || 0,
      totalNFTs: totalNFTs || 0,
    })
  } catch (error) {
    console.error('Error fetching user stats:', error)
    return NextResponse.json({ error: 'Failed to fetch stats' }, { status: 500 })
  }
}

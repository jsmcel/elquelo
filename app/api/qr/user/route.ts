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

    // Get user's QRs
    const { data: qrs, error } = await supabase
      .from('qrs')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (error) {
      return NextResponse.json({ error: 'Failed to fetch QRs' }, { status: 500 })
    }

    // Add QR URLs
    const qrsWithUrls = qrs.map(qr => ({
      ...qr,
      qr_url: `${process.env.QR_DOMAIN}/${qr.code}`,
    }))

    return NextResponse.json({ qrs: qrsWithUrls })
  } catch (error) {
    console.error('Error fetching user QRs:', error)
    return NextResponse.json({ error: 'Failed to fetch QRs' }, { status: 500 })
  }
}

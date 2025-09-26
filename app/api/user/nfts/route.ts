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

    // Get user's NFTs with drop information
    const { data: nfts, error } = await supabase
      .from('claims')
      .select(`
        *,
        drop:drops(*)
      `)
      .eq('user_id', user.id)
      .order('claimed_at', { ascending: false })

    if (error) {
      return NextResponse.json({ error: 'Failed to fetch NFTs' }, { status: 500 })
    }

    return NextResponse.json({ nfts })
  } catch (error) {
    console.error('Error fetching user NFTs:', error)
    return NextResponse.json({ error: 'Failed to fetch NFTs' }, { status: 500 })
  }
}

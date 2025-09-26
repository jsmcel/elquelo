import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

export async function POST(req: NextRequest) {
  try {
    const { dropId, orderId } = await req.json()

    // Get user from auth
    const supabase = createRouteHandlerClient({ cookies })
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get drop information
    const { data: drop, error: dropError } = await supabase
      .from('drops')
      .select('*')
      .eq('id', dropId)
      .single()

    if (dropError || !drop) {
      return NextResponse.json({ error: 'Drop not found' }, { status: 404 })
    }

    // Check if user already claimed
    const { data: existingClaim } = await supabase
      .from('claims')
      .select('*')
      .eq('user_id', user.id)
      .eq('drop_id', dropId)
      .single()

    if (existingClaim) {
      return NextResponse.json({ error: 'Already claimed' }, { status: 400 })
    }

    // Create claim record (simplified - no actual NFT minting for now)
    const { data: claim, error: claimError } = await supabase
      .from('claims')
      .insert({
        user_id: user.id,
        drop_id: dropId,
        order_id: orderId,
        nft_token_id: drop.nft_token_id,
        wallet_address: user.email,
        transaction_hash: 'pending', // Placeholder
      })
      .select()
      .single()

    if (claimError) {
      return NextResponse.json({ error: 'Failed to create claim record' }, { status: 500 })
    }

    // Update minted count
    await supabase
      .from('drops')
      .update({ minted_count: drop.minted_count + 1 })
      .eq('id', dropId)

    return NextResponse.json({
      success: true,
      claim,
      message: 'NFT claim recorded (NFT functionality will be added later)',
    })
  } catch (error) {
    console.error('Error claiming NFT:', error)
    return NextResponse.json({ error: 'Failed to claim NFT' }, { status: 500 })
  }
}
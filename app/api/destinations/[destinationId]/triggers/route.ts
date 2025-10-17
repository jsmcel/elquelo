import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { createServiceSupabaseClient } from '@/lib/supabaseServer'

const serviceClient = createServiceSupabaseClient()

export async function POST(
  req: NextRequest,
  { params }: { params: { destinationId: string } }
) {
  try {
    const { destinationId } = params
    const { triggers } = await req.json()

    const supabaseAuth = createRouteHandlerClient({ cookies })
    const {
      data: { user },
    } = await supabaseAuth.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Actualizar triggers del destino
    const { data: updated, error } = await serviceClient
      .from('qr_destinations')
      .update({ triggers })
      .eq('id', destinationId)
      .select()
      .single()

    if (error) {
      console.error('[TRIGGERS] Error updating:', error)
      return NextResponse.json({ error: 'Failed to update triggers' }, { status: 500 })
    }

    console.log('[TRIGGERS] Updated for destination:', destinationId, 'Triggers:', triggers.length)

    return NextResponse.json({ success: true, destination: updated })
  } catch (error) {
    console.error('[TRIGGERS] Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function GET(
  req: NextRequest,
  { params }: { params: { destinationId: string } }
) {
  try {
    const { destinationId } = params

    const { data: destination, error } = await serviceClient
      .from('qr_destinations')
      .select('triggers')
      .eq('id', destinationId)
      .single()

    if (error) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    return NextResponse.json({ triggers: destination.triggers || [] })
  } catch (error) {
    console.error('[TRIGGERS] Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

















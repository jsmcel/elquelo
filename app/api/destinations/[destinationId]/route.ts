import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { createServiceSupabaseClient } from '@/lib/supabaseServer'

const serviceClient = createServiceSupabaseClient()

export async function PATCH(
  req: NextRequest,
  { params }: { params: { destinationId: string } }
) {
  try {
    const { destinationId } = params
    const body = await req.json()

    const supabaseAuth = createRouteHandlerClient({ cookies })
    const {
      data: { user },
    } = await supabaseAuth.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Actualizar el destino
    const { data: updated, error } = await serviceClient
      .from('qr_destinations')
      .update(body)
      .eq('id', destinationId)
      .select()
      .single()

    if (error) {
      console.error('Error updating destination:', error)
      return NextResponse.json({ error: 'Failed to update destination' }, { status: 500 })
    }

    return NextResponse.json({ destination: updated })
  } catch (error) {
    console.error('Error updating destination:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}













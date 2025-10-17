import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

// GET - Redirect to QR destination
export async function GET(
  req: NextRequest,
  { params }: { params: { code: string } }
) {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )
    const { code } = params

    const { data: qr, error } = await supabase
      .from('qrs')
      .select('*')
      .eq('code', code)
      .eq('is_active', true)
      .single()

    if (error || !qr) {
      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/404`)
    }

    await logScan(supabase, qr.id, req)

    await supabase
      .from('qrs')
      .update({ scan_count: qr.scan_count + 1 })
      .eq('id', qr.id)

    return NextResponse.redirect(qr.destination_url)
  } catch (error) {
    console.error('Error processing QR redirect:', error)
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/404`)
  }
}

// POST - Update QR destination (authenticated)
export async function POST(
  req: NextRequest,
  { params }: { params: { code: string } }
) {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )
    const { code } = params
    const { destination_url, title, description, is_active } = await req.json()

    const supabaseAuth = createRouteHandlerClient({ cookies })
    const {
      data: { user },
    } = await supabaseAuth.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: existing, error: fetchError } = await supabase
      .from('qrs')
      .select('id, user_id')
      .eq('code', code)
      .single()

    if (fetchError || !existing) {
      return NextResponse.json({ error: 'QR not found' }, { status: 404 })
    }

    if (existing.user_id !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const updates: Record<string, unknown> = {}

    if (typeof destination_url === 'string' && destination_url.trim()) {
      updates.destination_url = destination_url.trim()
    }

    if (title !== undefined) {
      updates.title = (title ?? '').trim() || null
    }

    if (description !== undefined) {
      updates.description = (description ?? '').trim() || null
    }

    if (typeof is_active === 'boolean') {
      updates.is_active = is_active
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: 'No fields to update' }, { status: 400 })
    }

    updates.updated_at = new Date().toISOString()

    const { data, error } = await supabase
      .from('qrs')
      .update(updates)
      .eq('id', existing.id)
      .select()
      .single()

    if (error || !data) {
      console.error('Error updating QR:', error)
      return NextResponse.json({ error: 'Failed to update QR' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      qr: {
        ...data,
        qr_url: `${process.env.QR_DOMAIN}/${data.code}`,
      },
    })
  } catch (error) {
    console.error('Error updating QR:', error)
    return NextResponse.json({ error: 'Failed to update QR' }, { status: 500 })
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { code: string } }
) {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )
    const { code } = params

    const supabaseAuth = createRouteHandlerClient({ cookies })
    const {
      data: { user },
    } = await supabaseAuth.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: existing, error: fetchError } = await supabase
      .from('qrs')
      .select('id, user_id')
      .eq('code', code)
      .single()

    if (fetchError || !existing) {
      return NextResponse.json({ error: 'QR not found' }, { status: 404 })
    }

    if (existing.user_id !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { error: deleteError } = await supabase
      .from('qrs')
      .delete()
      .eq('id', existing.id)

    if (deleteError) {
      console.error('Error deleting QR:', deleteError)
      return NextResponse.json({ error: 'Failed to delete QR' }, { status: 500 })
    }

    const storagePath = `${user.id}/${code}.png`
    const { error: storageError } = await supabase.storage
      .from('designs')
      .remove([storagePath])

    if (storageError && storageError.message && !storageError.message.includes('not found')) {
      console.error('Error removing design asset:', storageError)
    }

    return NextResponse.json({ success: true, code })
  } catch (error) {
    console.error('Error deleting QR:', error)
    return NextResponse.json({ error: 'Failed to delete QR' }, { status: 500 })
  }
}

async function logScan(supabase: any, qrId: string, req: NextRequest) {
  try {
    const ip = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown'
    const userAgent = req.headers.get('user-agent') || 'unknown'
    const referer = req.headers.get('referer') || 'direct'

    await supabase.from('scans').insert({
      qr_id: qrId,
      ip_address: ip,
      user_agent: userAgent,
      referer,
    })
  } catch (error) {
    console.error('Error logging scan:', error)
  }
}

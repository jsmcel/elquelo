import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// GET - Redirect to QR destination
export async function GET(
  req: NextRequest,
  { params }: { params: { code: string } }
) {
  try {
    const { code } = params
    
    // Get QR data
    const { data: qr, error } = await supabase
      .from('qrs')
      .select('*')
      .eq('code', code)
      .eq('is_active', true)
      .single()

    if (error || !qr) {
      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/404`)
    }

    // Log the scan
    await logScan(qr.id, req)

    // Update scan count
    await supabase
      .from('qrs')
      .update({ scan_count: qr.scan_count + 1 })
      .eq('id', qr.id)

    // Redirect to destination
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
    const { code } = params
    const { destination_url, title, description } = await req.json()

    // Get user from auth header
    const authHeader = req.headers.get('authorization')
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Update QR destination
    const { data, error } = await supabase
      .from('qrs')
      .update({
        destination_url,
        title,
        description,
        updated_at: new Date().toISOString(),
      })
      .eq('code', code)
      .eq('user_id', user.id)
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: 'Failed to update QR' }, { status: 500 })
    }

    return NextResponse.json({ success: true, qr: data })
  } catch (error) {
    console.error('Error updating QR:', error)
    return NextResponse.json({ error: 'Failed to update QR' }, { status: 500 })
  }
}

async function logScan(qrId: string, req: NextRequest) {
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

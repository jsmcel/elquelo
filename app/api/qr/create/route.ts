import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: NextRequest) {
  try {
    const { destination_url, title, description } = await req.json()

    // Get user from auth
    const supabaseAuth = createRouteHandlerClient({ cookies })
    const { data: { user } } = await supabaseAuth.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Generate unique QR code
    const qrCode = generateQRCode()

    // Create QR record
    const { data, error } = await supabase
      .from('qrs')
      .insert({
        code: qrCode,
        user_id: user.id,
        destination_url,
        title,
        description,
      })
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: 'Failed to create QR' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      qr: data,
      qr_url: `${process.env.QR_DOMAIN}/${qrCode}`,
    })
  } catch (error) {
    console.error('Error creating QR:', error)
    return NextResponse.json({ error: 'Failed to create QR' }, { status: 500 })
  }
}

function generateQRCode(): string {
  const timestamp = Date.now()
  const random = Math.random().toString(36).substring(2, 8)
  return `${timestamp}${random}`
}

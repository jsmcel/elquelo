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
    const supabaseAuth = createRouteHandlerClient({ cookies })
    const {
      data: { user },
    } = await supabaseAuth.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const formData = await req.formData()
    const file = formData.get('file') as File | null
    const code = formData.get('code') as string | null

    if (!file || !code) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    if (file.type !== 'image/png') {
      return NextResponse.json({ error: 'El archivo debe ser un PNG' }, { status: 400 })
    }

    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    const storagePath = `${user.id}/${code}.png`

    const { error: uploadError } = await supabase.storage
      .from('designs')
      .upload(storagePath, buffer, {
        contentType: 'image/png',
        upsert: true,
      })

    if (uploadError) {
      console.error('Error uploading design:', uploadError)
      return NextResponse.json({ error: 'Failed to upload design' }, { status: 500 })
    }

    const { data: publicUrlData } = supabase.storage
      .from('designs')
      .getPublicUrl(storagePath)

    return NextResponse.json({ success: true, path: storagePath, url: publicUrlData.publicUrl })
  } catch (error) {
    console.error('Design upload error:', error)
    return NextResponse.json({ error: 'Failed to upload design' }, { status: 500 })
  }
}

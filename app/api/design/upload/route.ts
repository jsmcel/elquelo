import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

const ALLOWED_IMAGE_TYPES = ['image/png', 'image/jpeg'] as const

function resolveExtension(mimeType: string) {
  if (mimeType === 'image/png') return 'png'
  if (mimeType === 'image/jpeg') return 'jpg'
  return 'png'
}

export async function POST(req: NextRequest) {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )
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

    if (!ALLOWED_IMAGE_TYPES.includes(file.type as any)) {
      return NextResponse.json({ error: 'El archivo debe ser PNG o JPG' }, { status: 400 })
    }

    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    const safeCode = code.replace(/[^a-zA-Z0-9-_]/g, '_')
    const extension = resolveExtension(file.type)
    const storagePath = `${user.id}/${safeCode}.${extension}`

    const { error: uploadError } = await supabase.storage
      .from('designs')
      .upload(storagePath, buffer, {
        contentType: file.type,
        upsert: true,
      })

    if (uploadError) {
      console.error('Error uploading design:', uploadError)
      return NextResponse.json({ error: 'Failed to upload design' }, { status: 500 })
    }

    const { data: publicUrlData } = supabase.storage
      .from('designs')
      .getPublicUrl(storagePath)

    const cacheBuster = Date.now().toString(36)
    const publicUrl = `${publicUrlData.publicUrl}?v=${cacheBuster}`

    return NextResponse.json({ success: true, path: storagePath, url: publicUrl })
  } catch (error) {
    console.error('Design upload error:', error)
    return NextResponse.json({ error: 'Failed to upload design' }, { status: 500 })
  }
}


import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File
    const code = formData.get('code') as string
    const placement = formData.get('placement') as string

    if (!file || !code || !placement) {
      return NextResponse.json({ success: false, error: 'Missing required fields' }, { status: 400 })
    }

    // Convertir el archivo a buffer
    const qrBuffer = Buffer.from(await file.arrayBuffer())

    // Generar nombre de archivo único
    const fileName = `${code}-${placement}-qr.png`
    const filePath = `designs/${fileName}`

    // Subir a Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('designs')
      .upload(filePath, qrBuffer, {
        contentType: 'image/png',
        upsert: true, // Sobrescribir si existe
      })

    if (uploadError) {
      console.error('Supabase upload error:', uploadError)
      return NextResponse.json({ success: false, error: 'Error uploading QR code' }, { status: 500 })
    }

    // Obtener URL pública
    const { data: urlData } = supabase.storage
      .from('designs')
      .getPublicUrl(filePath)

    return NextResponse.json({
      success: true,
      url: urlData.publicUrl,
      fileName,
      placement,
    })
  } catch (error) {
    console.error('QR upload error:', error)
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}

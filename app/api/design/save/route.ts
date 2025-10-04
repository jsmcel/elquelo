import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

export async function POST(request: NextRequest) {
  try {
    const { code, designData } = await request.json()
    
    console.log('=== DESIGN SAVE DEBUG ===')
    console.log('Code:', code)
    console.log('DesignData keys:', Object.keys(designData || {}))
    console.log('ProductOptions:', designData?.productOptions)
    
    if (!code || !designData) {
      return NextResponse.json(
        { success: false, error: 'Código y datos de diseño requeridos' },
        { status: 400 }
      )
    }

    // Get user from auth
    const supabaseAuth = createRouteHandlerClient({ cookies })
    const { data: { user } } = await supabaseAuth.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )
    
    // Guardar el diseño en la base de datos
    const designDataToStore = {
      ...designData,
      printFileUrl: designData.printFileUrl ?? null,
      printFilePath: designData.printFilePath ?? null,
      printUploadedAt: designData.printUploadedAt ?? new Date().toISOString()
    }

    const timestamp = new Date().toISOString()

    const upsertData = {
      qr_code: code,
      design_data: designDataToStore,
      product_size: designData.productOptions?.size || null,
      product_color: designData.productOptions?.color || null,
      product_gender: designData.productOptions?.gender || null,
      created_at: timestamp,
    }

    console.log('Upsert data:', JSON.stringify(upsertData, null, 2))

    const { data, error } = await supabase
      .from('qr_designs')
      .upsert(upsertData, { onConflict: 'qr_code' })
      .select()

    if (error) {
      console.error('Supabase error details:', {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code
      })
      return NextResponse.json(
        { 
          success: false, 
          error: 'Error al guardar el diseño',
          details: error.message,
          code: error.code
        },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Diseño guardado correctamente',
      data: data[0]
    })

  } catch (error) {
    console.error('Error in design save:', error)
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

// Función para normalizar designsByPlacement
function normalizeDesignsByPlacement(designsByPlacement: any): Record<string, string | null> {
  if (!designsByPlacement || typeof designsByPlacement !== 'object') {
    return {}
  }

  return Object.fromEntries(
    Object.entries(designsByPlacement).map(([key, value]: [string, any]) => {
      if (typeof value === 'string') {
        return [key, value]
      }
      if (value && typeof value === 'object' && 'imageUrl' in value) {
        return [key, value.imageUrl || null]
      }
      return [key, null]
    })
  )
}

// Función para limpiar un producto individual
function cleanProduct(product: any) {
  if (!product || typeof product !== 'object') {
    return product
  }

  const cleanedProduct = { ...product }

  // Normalizar designsByPlacement
  if (cleanedProduct.designsByPlacement) {
    cleanedProduct.designsByPlacement = normalizeDesignsByPlacement(cleanedProduct.designsByPlacement)
  }

  return cleanedProduct
}

// Función para limpiar designData completo
function cleanDesignData(designData: any) {
  if (!designData || typeof designData !== 'object') {
    return designData
  }

  const cleaned = { ...designData }

  // Limpiar products array si existe
  if (cleaned.products && Array.isArray(cleaned.products)) {
    cleaned.products = cleaned.products.map(cleanProduct)
  }

  // Limpiar también el formato legacy si existe
  if (cleaned.designsByPlacement) {
    cleaned.designsByPlacement = normalizeDesignsByPlacement(cleaned.designsByPlacement)
  }

  return cleaned
}

export async function POST(request: NextRequest) {
  try {
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

    console.log('🧹 Iniciando limpieza de diseños...')

    // Obtener todos los diseños
    const { data: designs, error: fetchError } = await supabase
      .from('qr_designs')
      .select('*')

    if (fetchError) {
      console.error('Error fetching designs:', fetchError)
      return NextResponse.json(
        { success: false, error: 'Error al obtener diseños', details: fetchError.message },
        { status: 500 }
      )
    }

    console.log(`📊 Encontrados ${designs?.length || 0} diseños para limpiar`)

    let cleanedCount = 0
    let errorCount = 0

    // Procesar cada diseño
    for (const design of designs || []) {
      try {
        const originalDesignData = design.design_data
        const cleanedDesignData = cleanDesignData(originalDesignData)

        // Solo actualizar si hay cambios
        if (JSON.stringify(originalDesignData) !== JSON.stringify(cleanedDesignData)) {
          const { error: updateError } = await supabase
            .from('qr_designs')
            .update({ design_data: cleanedDesignData })
            .eq('qr_code', design.qr_code)

          if (updateError) {
            console.error(`Error actualizando diseño ${design.qr_code}:`, updateError)
            errorCount++
          } else {
            console.log(`✅ Limpiado diseño ${design.qr_code}`)
            cleanedCount++
          }
        }
      } catch (error) {
        console.error(`Error procesando diseño ${design.qr_code}:`, error)
        errorCount++
      }
    }

    console.log(`🎉 Limpieza completada: ${cleanedCount} limpiados, ${errorCount} errores`)

    return NextResponse.json({
      success: true,
      message: 'Limpieza de diseños completada',
      stats: {
        total: designs?.length || 0,
        cleaned: cleanedCount,
        errors: errorCount
      }
    })

  } catch (error) {
    console.error('Error in design cleanup:', error)
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

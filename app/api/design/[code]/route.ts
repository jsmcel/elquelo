import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(
  _req: NextRequest,
  { params }: { params: { code: string } }
) {
  try {
    const supabaseAuth = createRouteHandlerClient({ cookies })
    const {
      data: { user },
    } = await supabaseAuth.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Buscar en la tabla qr_designs primero
    const { data: designData, error: designError } = await supabase
      .from('qr_designs')
      .select('design_data, product_size, product_color, product_gender')
      .eq('qr_code', params.code)
      .single()

    if (!designError && designData) {
      // Si hay datos en la tabla, devolver un indicador de que existe
      return NextResponse.json({ 
        success: true, 
        url: 'design-saved', // Indicador de que el diseño está guardado
        designData: {
          ...designData.design_data,
          productOptions: {
            size: designData.product_size,
            color: designData.product_color,
            gender: designData.product_gender
          }
        },
        hasDesign: true
      })
    }

    // Fallback: buscar en storage (para diseños antiguos)
    const storagePath = `${user.id}/${params.code}.png`

    const { data, error } = await supabase.storage
      .from('designs')
      .createSignedUrl(storagePath, 60 * 60)

    if (error || !data?.signedUrl) {
      return NextResponse.json({ error: 'Design not found' }, { status: 404 })
    }

    return NextResponse.json({ success: true, url: data.signedUrl })
  } catch (error) {
    console.error('Error retrieving design:', error)
    return NextResponse.json({ error: 'Failed to retrieve design' }, { status: 500 })
  }
}

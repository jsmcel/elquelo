import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(_req: NextRequest, { params }: { params: { code: string } }) {
  try {
    const supabaseAuth = createRouteHandlerClient({ cookies })
    const {
      data: { user },
    } = await supabaseAuth.auth.getUser()

    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const { data: designData, error: designError } = await supabase
      .from('qr_designs')
      .select('design_data, product_size, product_color, product_gender')
      .eq('qr_code', params.code)
      .maybeSingle()

    if (designError && designError.code && designError.code !== 'PGRST116') {
      console.error('[design:get] error loading design row', designError)
      return NextResponse.json({ success: false, error: 'Failed to load design' }, { status: 500 })
    }

    if (designData?.design_data) {
      return NextResponse.json({
        success: true,
        hasDesign: true,
        url: 'design-saved',
        designData: {
          ...designData.design_data,
          productOptions: {
            size: designData.product_size,
            color: designData.product_color,
            gender: designData.product_gender,
          },
        },
      })
    }

    const storagePath = `${user.id}/${params.code}.png`
    const { data, error } = await supabase.storage
      .from('designs')
      .createSignedUrl(storagePath, 60 * 10)

    if (!error && data?.signedUrl) {
      return NextResponse.json({ success: true, hasDesign: true, url: data.signedUrl, designData: null })
    }

    return NextResponse.json({ success: true, hasDesign: false, designData: null })
  } catch (error) {
    console.error('Error retrieving design:', error)
    return NextResponse.json({ success: false, error: 'Failed to retrieve design' }, { status: 500 })
  }
}

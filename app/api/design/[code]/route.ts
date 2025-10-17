import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

export async function GET(_req: NextRequest, { params }: { params: { code: string } }) {
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
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const { data: designRows, error: designError } = await supabase
      .from('qr_designs')
      .select('design_data, product_size, product_color, product_gender, created_at')
      .eq('qr_code', params.code)
      .order('created_at', { ascending: false, nullsFirst: false })
      .limit(1)

    if (designError) {
      console.error('[design:get] error loading design row', designError)
      return NextResponse.json({ success: false, error: 'Failed to load design' }, { status: 500 })
    }

    const designData = designRows?.[0]

    if (designData?.design_data) {
      // Parse design_data if it's a string
      let parsedDesignData = designData.design_data
      if (typeof parsedDesignData === 'string') {
        try {
          parsedDesignData = JSON.parse(parsedDesignData)
        } catch (error) {
          console.error('Error parsing design_data:', error)
          parsedDesignData = {}
        }
      }

      return NextResponse.json({
        success: true,
        hasDesign: true,
        url: 'design-saved',
        designData: {
          ...parsedDesignData,
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

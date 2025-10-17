import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { z } from 'zod'
import { generateMockupsForQrs } from '@/lib/mockup-generation'

const requestSchema = z.object({
  qrCodes: z.array(z.string()).optional(),
  groupId: z.string().optional(),
})

export async function POST(req: NextRequest) {
  const cookieStore = cookies()
  const supabase = createRouteHandlerClient({ cookies: () => cookieStore })

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let body: z.infer<typeof requestSchema>
  try {
    body = requestSchema.parse(await req.json())
  } catch (error) {
    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 })
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL
  if (!appUrl) {
    return NextResponse.json({ error: 'NEXT_PUBLIC_APP_URL is not configured' }, { status: 500 })
  }

  let qrs: Array<Record<string, any>> = []

  if (body.qrCodes?.length) {
    const { data, error } = await supabase
      .from('qrs')
      .select('id, code, title, description, group_id')
      .in('code', body.qrCodes)
      .eq('user_id', user.id)

    if (error) {
      return NextResponse.json({ error: 'Error fetching QR codes' }, { status: 500 })
    }
    qrs = data || []
  } else if (body.groupId) {
    const { data, error } = await supabase
      .from('qrs')
      .select('id, code, title, description, group_id')
      .eq('group_id', body.groupId)
      .eq('user_id', user.id)

    if (error) {
      return NextResponse.json({ error: 'Error fetching group QR codes' }, { status: 500 })
    }
    qrs = data || []
  } else {
    return NextResponse.json({ error: 'Provide qrCodes or groupId' }, { status: 400 })
  }

  if (!qrs.length) {
    return NextResponse.json({ error: 'No QR codes found' }, { status: 404 })
  }

  const results = await generateMockupsForQrs({
    qrs,
    cookieStore: () => cookieStore,
    appUrl,
  })

  const hasSuccess = results.some((item) => item.mockupsCompleted > 0)
  return NextResponse.json({ success: hasSuccess, results })
}

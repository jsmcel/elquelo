import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const redirectParam = requestUrl.searchParams.get('redirect')

  if (code) {
    const supabase = createRouteHandlerClient({ cookies })
    await supabase.auth.exchangeCodeForSession(code)
  }

  // Use redirect parameter or default to configurador for new users
  const destination = redirectParam || '/configurador'
  return NextResponse.redirect(`${requestUrl.origin}${destination}`)
}

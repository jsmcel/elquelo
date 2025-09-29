import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { ensureUserProfile } from '@/lib/user-profile'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(_req: NextRequest) {
  try {
    const supabaseAuth = createRouteHandlerClient({ cookies })
    const {
      data: { user },
    } = await supabaseAuth.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    await ensureUserProfile(supabase, user)

    const { data: profile, error: profileError } = await supabaseAuth
      .from('users')
      .select('email, full_name, avatar_url, created_at, updated_at')
      .eq('id', user.id)
      .maybeSingle()

    if (profileError && profileError.code !== 'PGRST116') {
      throw profileError
    }

    return NextResponse.json({
      success: true,
      profile: {
        id: user.id,
        email: profile?.email ?? user.email ?? '',
        full_name: profile?.full_name ?? null,
        avatar_url: profile?.avatar_url ?? (user.user_metadata as any)?.avatar_url ?? null,
        created_at: profile?.created_at ?? null,
        updated_at: profile?.updated_at ?? null,
      },
    })
  } catch (error) {
    console.error('Error loading user profile:', error)
    return NextResponse.json({ error: 'Failed to load profile' }, { status: 500 })
  }
}

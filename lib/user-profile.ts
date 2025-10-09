import { randomBytes } from 'crypto'
import type { SupabaseClient, User } from '@supabase/supabase-js'

export async function ensureUserProfile(
  supabase: SupabaseClient,
  user: User
): Promise<void> {
  const { data: existing } = await supabase
    .from('users')
    .select('id')
    .eq('id', user.id)
    .maybeSingle()

  if (existing) {
    return
  }

  const metadata = (user.user_metadata ?? {}) as {
    full_name?: string
    avatar_url?: string
  }

  const { error: upsertError } = await supabase.from('users').upsert(
    {
      id: user.id,
      email: user.email ?? '',
      full_name: metadata.full_name ?? null,
      avatar_url: metadata.avatar_url ?? null,
    },
    { onConflict: 'id' }
  )

  if (upsertError) {
    console.error('Failed to create user profile on login:', upsertError)
    throw new Error(`Failed to ensure user profile: ${upsertError.message}`)
  }
}

export function generateQrCodeValue(): string {
  return randomBytes(6).toString('hex')
}

export function buildDefaultDestination(): string {
  const base = getAppBaseUrl()
  return `${base}/bienvenida`
}

export function getAppBaseUrl(): string {
  const raw =
    process.env.NEXT_PUBLIC_APP_URL || process.env.APP_URL || 'https://elquelo.eu'
  return raw.replace(/\/+$/, '')
}

export function generateUniqueDestinationUrl(
  baseUrl: string,
  qrCode: string,
  participantName: string,
  groupName?: string,
  additionalParams?: Record<string, string>
): string {
  try {
    const url = new URL(baseUrl)
    
    // Add QR-specific parameters
    url.searchParams.set('qr', qrCode)
    url.searchParams.set('name', encodeURIComponent(participantName))
    url.searchParams.set('source', 'qr')
    url.searchParams.set('timestamp', Date.now().toString())
    
    if (groupName) {
      url.searchParams.set('group', encodeURIComponent(groupName))
    }
    
    // Add any additional parameters
    if (additionalParams) {
      Object.entries(additionalParams).forEach(([key, value]) => {
        url.searchParams.set(key, encodeURIComponent(value))
      })
    }
    
    return url.toString()
  } catch (error) {
    // If baseUrl is not a valid URL, create a simple parameterized version
    const separator = baseUrl.includes('?') ? '&' : '?'
    const params = [
      `qr=${qrCode}`,
      `name=${encodeURIComponent(participantName)}`,
      'source=qr',
      `timestamp=${Date.now()}`
    ]
    
    if (groupName) {
      params.push(`group=${encodeURIComponent(groupName)}`)
    }
    
    if (additionalParams) {
      Object.entries(additionalParams).forEach(([key, value]) => {
        params.push(`${key}=${encodeURIComponent(value)}`)
      })
    }
    
    return `${baseUrl}${separator}${params.join('&')}`
  }
}

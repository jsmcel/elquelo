import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'

type StatusEntry = {
  code: string
  totalProducts: number
  completedProducts: number
  percent: number
  finished: boolean
}

function getVariantKeyMap(obj: Record<string, any> | undefined | null) {
  const map: Record<number, any> = {}
  if (!obj || typeof obj !== 'object') return map
  for (const [key, value] of Object.entries(obj)) {
    const num = Number(key)
    if (!Number.isNaN(num)) {
      map[num] = value
    }
  }
  return map
}

function computeProductCompleted(product: any): { completed: boolean; placements: string[] } {
  const variantId = Number(product?.variantId)
  const vmap = getVariantKeyMap(product?.variantMockups)
  const entry = vmap[variantId]
  const placements = entry && typeof entry === 'object' ? Object.keys(entry) : []
  const completed = placements.length > 0
  return { completed, placements }
}

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

  let body: any
  try {
    body = await req.json()
  } catch (error) {
    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 })
  }

  const qrCodes = Array.isArray(body?.qrCodes) ? (body.qrCodes as string[]).filter(Boolean) : []
  const groupId = typeof body?.groupId === 'string' && body.groupId.trim() ? body.groupId : null

  if (!qrCodes.length && !groupId) {
    return NextResponse.json({ error: 'Provide qrCodes or groupId' }, { status: 400 })
  }

  // Resolve authorized QR codes for this user
  let authorizedCodes: string[] = []
  if (qrCodes.length) {
    const { data: rows, error } = await supabase
      .from('qrs')
      .select('code')
      .in('code', qrCodes)
      .eq('user_id', user.id)

    if (error) {
      return NextResponse.json({ error: 'Error fetching QR codes' }, { status: 500 })
    }
    authorizedCodes = (rows || []).map((r: any) => r.code)
  } else if (groupId) {
    const { data: rows, error } = await supabase
      .from('qrs')
      .select('code')
      .eq('group_id', groupId)
      .eq('user_id', user.id)

    if (error) {
      return NextResponse.json({ error: 'Error fetching group QR codes' }, { status: 500 })
    }
    authorizedCodes = (rows || []).map((r: any) => r.code)
  }

  if (!authorizedCodes.length) {
    return NextResponse.json({ success: true, codes: [], entries: [], allFinished: true })
  }

  // Fetch design data for authorized codes
  const { data: designs, error: designError } = await supabase
    .from('qr_designs')
    .select('qr_code, design_data')
    .in('qr_code', authorizedCodes)

  if (designError) {
    return NextResponse.json({ error: 'Error fetching design data' }, { status: 500 })
  }

  const entries: StatusEntry[] = []
  const byCode: Record<string, any> = {}
  designs?.forEach((row: any) => {
    byCode[row.qr_code] = row.design_data || {}
  })

  authorizedCodes.forEach((code) => {
    const design = byCode[code] || {}
    const products: any[] = Array.isArray(design?.products) ? design.products : []

    const totalProducts = products.length
    let completedProducts = 0
    products.forEach((p) => {
      const status = computeProductCompleted(p)
      if (status.completed) completedProducts += 1
    })

    const percent = totalProducts > 0 ? Math.round((completedProducts / totalProducts) * 100) : 0
    const finished = totalProducts > 0 && completedProducts >= totalProducts

    entries.push({ code, totalProducts, completedProducts, percent, finished })
  })

  const allFinished = entries.length > 0 && entries.every((e) => e.finished)

  return NextResponse.json({ success: true, codes: authorizedCodes, entries, allFinished })
}


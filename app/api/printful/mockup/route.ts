import { NextRequest, NextResponse } from 'next/server'
import { PrintfulClient } from '@/lib/printful-v2'

function normalizePlacement(value: unknown) {
  if (!value) return ''
  const normalized = String(value).toLowerCase()
  switch (normalized) {
    case 'default':
    case 'front_default':
    case 'front_default_flat':
    case 'default_front':
    case 'default_front_flat':
      return 'front'
    case 'default_back':
    case 'back_default':
    case 'back_default_flat':
    case 'default_back_flat':
      return 'back'
    case 'left_sleeve':
    case 'sleeve_left':
      return 'sleeve_left'
    case 'right_sleeve':
    case 'sleeve_right':
      return 'sleeve_right'
    default:
      return normalized
  }
}

function pickUrl(value: unknown): string | null {
  if (typeof value === 'string' && value.trim()) {
    return value
  }
  return null
}

function resolveMockupUrl(mockup: any): string | null {
  if (!mockup) return null

  if (Array.isArray(mockup.files)) {
    for (const file of mockup.files) {
      const fromFile =
        pickUrl(file?.preview_url) ||
        pickUrl(file?.url) ||
        pickUrl(file?.mockup_url) ||
        pickUrl(file?.image_url) ||
        pickUrl(file?.thumbnail_url)

      if (fromFile) {
        return fromFile
      }
    }
  }

  return (
    pickUrl(mockup?.mockup_url) ||
    pickUrl(mockup?.preview_url) ||
    pickUrl(mockup?.thumbnail_url) ||
    pickUrl(mockup?.mockupUrl) ||
    pickUrl(mockup?.image_url)
  )
}

function extractVariantIds(mockup: any): number[] {
  const variantCandidates = [
    Array.isArray(mockup?.variant_ids) ? mockup.variant_ids : null,
    Array.isArray(mockup?.variants) ? mockup.variants : null,
    Array.isArray(mockup?.variantIds) ? mockup.variantIds : null,
  ].find(Boolean) as any[] | undefined

  const ids = (variantCandidates || [])
    .map((value) => Number(value))
    .filter((value) => !Number.isNaN(value))

  if (!ids.length && mockup?.variant_id) {
    const numeric = Number(mockup.variant_id)
    if (!Number.isNaN(numeric)) {
      ids.push(numeric)
    }
  }

  return ids
}

function normalizeMockups(mockups: any[]) {
  const raw = Array.isArray(mockups) ? mockups : []
  const normalized: Array<{ variantId: number; placement: string; url: string }> = []

  raw.forEach((mockup) => {
    const placement = normalizePlacement(mockup?.placement || mockup?.print_area || mockup?.printPlacement)
    const variantIds = extractVariantIds(mockup)
    const previewUrl = resolveMockupUrl(mockup)

    if (!placement || !previewUrl) {
      return
    }

    if (!variantIds.length) {
      normalized.push({ variantId: Number.NaN, placement, url: previewUrl })
      return
    }

    variantIds.forEach((variantId) => {
      if (!Number.isNaN(variantId)) {
        normalized.push({ variantId, placement, url: previewUrl })
      }
    })
  })

  return { raw, normalized }
}

function toNumber(value: unknown, fallback: number) {
  if (typeof value === 'number' && !Number.isNaN(value)) {
    return value
  }
  if (typeof value === 'string') {
    const parsed = Number(value)
    if (!Number.isNaN(parsed)) return parsed
  }
  return fallback
}

export async function POST(request: NextRequest) {
  const client = new PrintfulClient()

  let body: any
  try {
    body = await request.json()
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Cuerpo de peticion invalido' }, { status: 400 })
  }

  const variantIds = Array.isArray(body.variantIds) ? body.variantIds.filter((id: any) => Number(id)) : []
  if (!variantIds.length) {
    return NextResponse.json({ success: false, error: 'Debes especificar al menos un variantId' }, { status: 400 })
  }

  const productId = Number(body.productId)
  if (!productId) {
    return NextResponse.json({ success: false, error: 'Debes indicar productId' }, { status: 400 })
  }

  const files = Array.isArray(body.files) ? body.files : []
  if (!files.length) {
    return NextResponse.json({ success: false, error: 'Debes subir al menos un archivo' }, { status: 400 })
  }

  try {
    const payload = {
      variant_ids: variantIds.map((id: any) => Number(id)),
      files: files.map((file: any) => {
        const position = file.position || {}
        const areaWidth = toNumber(position.areaWidth ?? position.area_width ?? file.areaWidth, toNumber(position.width, 3600))
        const areaHeight = toNumber(position.areaHeight ?? position.area_height ?? file.areaHeight, toNumber(position.height, 4800))
        return {
          placement: file.placement,
          image_url: file.imageUrl,
          printfile_id: file.printfileId ?? undefined,
          position: {
            top: toNumber(position.top, 0),
            left: toNumber(position.left, 0),
            width: toNumber(position.width, areaWidth),
            height: toNumber(position.height, areaHeight),
            area_width: areaWidth,
            area_height: areaHeight,
          },
        }
      }),
    }

    const response: any = await client.createMockupTask(productId, payload)
    const result = response?.result || response?.data || response

    if (!result?.task_key) {
      return NextResponse.json({ success: false, error: 'Printful no devolvio task_key' }, { status: 502 })
    }

    return NextResponse.json({
      success: true,
      source: 'printful',
      requestId: String(result.task_key),
      status: result.status || 'pending',
      message: result.message,
    })
  } catch (error) {
    console.error('Error calling Printful mockup create-task', error)
    const message = error instanceof Error ? error.message : 'Error solicitando mockup en Printful'
    return NextResponse.json({ success: false, error: message }, { status: 502 })
  }
}

export async function GET(request: NextRequest) {
  const client = new PrintfulClient()
  const { searchParams } = new URL(request.url)
  const requestId = searchParams.get('requestId') || searchParams.get('taskKey')

  if (!requestId) {
    return NextResponse.json({ success: false, error: 'Debes indicar requestId' }, { status: 400 })
  }

  try {
    const response: any = await client.getMockupTask(requestId)
    const data = response?.result || response?.data || response
    const { raw, normalized } = normalizeMockups(data?.mockups || [])

    return NextResponse.json({
      success: true,
      source: 'printful',
      status: data?.status || 'pending',
      isCompleted: data?.status === 'completed',
      mockups: raw,
      normalizedMockups: normalized,
      message: data?.message,
    })
  } catch (error) {
    console.error('Error fetching Printful mockup status', error)
    const message = error instanceof Error ? error.message : 'Error consultando el mockup en Printful'
    return NextResponse.json({ success: false, error: message }, { status: 502 })
  }
}

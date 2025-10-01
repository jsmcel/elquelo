import { NextRequest, NextResponse } from 'next/server'
import { PrintfulClient } from '@/lib/printful-v2'

interface PlacementEntry {
  placement: string
  label: string
  printfileId: number | null
  width: number
  height: number
  areaWidth: number
  areaHeight: number
  position: {
    top: number
    left: number
    width: number
    height: number
  }
}

const FALLBACK_PLACEMENTS: PlacementEntry[] = [
  {
    placement: 'front',
    label: 'Frente',
    printfileId: null,
    width: 3600,
    height: 4800,
    areaWidth: 3600,
    areaHeight: 4800,
    position: { top: 0, left: 0, width: 3600, height: 4800 },
  },
  {
    placement: 'back',
    label: 'Espalda',
    printfileId: null,
    width: 3600,
    height: 4800,
    areaWidth: 3600,
    areaHeight: 4800,
    position: { top: 0, left: 0, width: 3600, height: 4800 },
  },
  {
    placement: 'sleeve_left',
    label: 'Manga izquierda',
    printfileId: null,
    width: 1800,
    height: 1800,
    areaWidth: 1800,
    areaHeight: 1800,
    position: { top: 0, left: 0, width: 1800, height: 1800 },
  },
  {
    placement: 'sleeve_right',
    label: 'Manga derecha',
    printfileId: null,
    width: 1800,
    height: 1800,
    areaWidth: 1800,
    areaHeight: 1800,
    position: { top: 0, left: 0, width: 1800, height: 1800 },
  },
]

const LEGACY_SLUGS: Record<string, number> = {
  'gildan-64000': 71,
}

function resolveProductId(identifier: string): number | null {
  if (!identifier) {
    return null
  }
  const numeric = Number(identifier)
  if (!Number.isNaN(numeric) && numeric > 0) {
    return numeric
  }
  const fallback = LEGACY_SLUGS[identifier.toLowerCase()]
  if (fallback) {
    return fallback
  }
  return null
}

function buildPlacements(files: any[] | undefined, printfilesData?: any): PlacementEntry[] {
  const resultMap = new Map<string, PlacementEntry>()
  FALLBACK_PLACEMENTS.forEach((entry) => resultMap.set(entry.placement, { ...entry }))

  if (Array.isArray(files)) {
    files.forEach((file) => {
      const placementCode = String(file.type || file.id || file.placement || '').toLowerCase()
      if (!placementCode) return
      const width = Number(file.width) || 3600
      const height = Number(file.height) || 4800
      const existing = resultMap.get(placementCode) || {
        placement: placementCode,
        label: file.title || file.type || placementCode,
        printfileId: file.id ?? file.printfile_id ?? null,
        width,
        height,
        areaWidth: width,
        areaHeight: height,
        position: { top: 0, left: 0, width, height },
      }
      resultMap.set(placementCode, {
        ...existing,
        label: file.title || existing.label || placementCode,
        printfileId: file.id ?? file.printfile_id ?? existing.printfileId,
        width,
        height,
        areaWidth: width,
        areaHeight: height,
        position: {
          top: Number(file.position?.top ?? existing.position.top),
          left: Number(file.position?.left ?? existing.position.left),
          width: Number(file.position?.width ?? file.width ?? existing.position.width),
          height: Number(file.position?.height ?? file.height ?? existing.position.height),
        },
      })
    })
  }

  if (printfilesData && typeof printfilesData === 'object') {
    const availablePlacements: Record<string, string> = printfilesData.available_placements || {}
    const printfiles: any[] = Array.isArray(printfilesData.printfiles) ? printfilesData.printfiles : []
    const variantPrintfiles = Array.isArray(printfilesData.variant_printfiles)
      ? printfilesData.variant_printfiles[0]?.placements || {}
      : {}

    const printfileLookup = new Map<number, any>()
    printfiles.forEach((pf) => {
      if (pf?.printfile_id || pf?.id) {
        const key = Number(pf.printfile_id ?? pf.id)
        printfileLookup.set(key, pf)
      }
    })

    Object.entries(variantPrintfiles).forEach(([placementKey, printfileIdValue]) => {
      const printfileId = Number(printfileIdValue)
      const printfile = printfileLookup.get(printfileId)
      const label = availablePlacements[placementKey] || placementKey
      const width = printfile?.width ? Number(printfile.width) : 3600
      const height = printfile?.height ? Number(printfile.height) : 4800

      const existing = resultMap.get(placementKey) || {
        placement: placementKey,
        label,
        printfileId,
        width,
        height,
        areaWidth: width,
        areaHeight: height,
        position: { top: 0, left: 0, width, height },
      }

      resultMap.set(placementKey, {
        ...existing,
        label,
        printfileId,
        width,
        height,
        areaWidth: width,
        areaHeight: height,
        position: { top: 0, left: 0, width, height },
      })
    })
  }

  return Array.from(resultMap.values())
}

function normalizeVariants(variants: any[] | undefined) {
  if (!Array.isArray(variants)) return []
  return variants
    .map((variant) => ({
      id: Number(variant.id ?? variant.variant_id ?? NaN),
      size: String(variant.size || '').toUpperCase(),
      colorName: variant.color || variant.color_name || '',
      colorCode: String(variant.color_code || variant.color || '').toLowerCase(),
      availability: variant.availability_status || variant.availability || null,
      imageUrl: variant.product_image || variant.files?.find((file: any) => file.type === 'preview')?.preview_url || null,
    }))
    .filter((variant) => !Number.isNaN(variant.id))
}

function normalizeColors(variants: ReturnType<typeof normalizeVariants>) {
  const grouped: Record<string, { name: string; ids: number[] }> = {}
  variants.forEach((variant) => {
    const key = variant.colorCode || variant.colorName.toLowerCase()
    if (!key) return
    if (!grouped[key]) {
      grouped[key] = { name: variant.colorName || key, ids: [] }
    }
    grouped[key].ids.push(variant.id)
  })
  return Object.entries(grouped).map(([code, value]) => ({
    name: value.name,
    code,
    hex: null,
    variantIds: value.ids,
  }))
}

export async function GET(request: NextRequest, context: { params: { productId: string } }) {
  const identifier = context.params.productId || ''
  const productId = resolveProductId(identifier)

  if (!productId) {
    return NextResponse.json({ error: 'Producto Printful no soportado' }, { status: 404 })
  }

  try {
    const client = new PrintfulClient()
    const productResponse: any = await client.getProduct(productId)
    const productPayload = productResponse?.result || productResponse
    const product = productPayload?.product || productPayload || {}

    const variants = normalizeVariants(productPayload?.variants)
    const colors = normalizeColors(variants)
    const sizes = [...new Set(variants.map((variant) => variant.size).filter(Boolean))]

    let printfilesData: any = null
    try {
      const response = await client.getPrintfiles(productId)
      printfilesData = response?.result || response
    } catch (error) {
      console.warn('[printful products] printfiles unavailable', error)
    }

    const filesSource = Array.isArray(productPayload?.files)
      ? productPayload.files
      : Array.isArray(product?.files)
        ? product.files
        : undefined
    const placements = buildPlacements(filesSource, printfilesData)

    const name =
      product.title ||
      product.name ||
      [product.brand, product.model || product.type]
        .filter((value: any) => typeof value === 'string' && value.trim().length)
        .join(' ') ||
      `Producto ${productId}`

    const image =
      product.product_image ||
      product.image ||
      product.thumbnail ||
      product.preview ||
      (Array.isArray(product.images) && product.images.length ? product.images[0]?.url || product.images[0] : null)

    return NextResponse.json({
      source: 'printful',
      productId,
      templateId: Number(product.template_id ?? product.templateId ?? productId),
      name,
      brand: product.brand || null,
      model: product.model || null,
      type: product.type || null,
      image: typeof image === 'string' ? image : null,
      placements,
      variants,
      colors,
      sizes,
      message: null,
    })
  } catch (error) {
    console.error('Error fetching Printful product', error)
    const message = error instanceof Error ? error.message : 'Error consultando Printful'
    return NextResponse.json({ error: message }, { status: 502 })
  }
}

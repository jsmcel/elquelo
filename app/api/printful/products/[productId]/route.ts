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

const PRODUCT_CONFIGS: Record<string, { productId: number; templateId?: number }> = {
  'gildan-64000': { productId: 71, templateId: 71 },
}

function buildPlacements(files: any[] | undefined, printfilesData?: any): PlacementEntry[] {
  const resultMap = new Map<string, PlacementEntry>()
  FALLBACK_PLACEMENTS.forEach((entry) => resultMap.set(entry.placement, { ...entry }))

  if (Array.isArray(files)) {
    files.forEach((file) => {
      const placementCode = String(file.type || file.id || '').toLowerCase()
      if (!placementCode) return
      const existing = resultMap.get(placementCode) || {
        placement: placementCode,
        label: file.title || file.type || placementCode,
        printfileId: null,
        width: 3600,
        height: 4800,
        areaWidth: 3600,
        areaHeight: 4800,
        position: { top: 0, left: 0, width: 3600, height: 4800 },
      }
      resultMap.set(placementCode, {
        ...existing,
        label: file.title || existing.label || placementCode,
        printfileId: file.id ?? existing.printfileId,
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
      if (pf?.printfile_id) {
        printfileLookup.set(Number(pf.printfile_id), pf)
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
        printfileId: printfileId,
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

export async function GET(_request: NextRequest, context: { params: { productId: string } }) {
  const slug = context.params.productId?.toLowerCase?.() || ''
  console.log('[printful products] slug', slug)

  const config = PRODUCT_CONFIGS[slug]
  if (!config) {
    console.error('[printful products] unsupported slug', slug)
    return NextResponse.json({ error: 'Producto Printful no soportado' }, { status: 404 })
  }

  try {
    const client = new PrintfulClient()
    const productResponse: any = await client.getProduct(config.productId)
    const productData = productResponse?.result || productResponse
    const product = productData?.product || {}
    const variants = normalizeVariants(productData?.variants)
    const colors = normalizeColors(variants)
    const sizes = [...new Set(variants.map((variant) => variant.size).filter(Boolean))]

    let printfilesData: any = null
    try {
      const response = await client.getPrintfiles(config.productId)
      printfilesData = response?.result || response
    } catch (error) {
      console.warn('[printful products] printfiles unavailable', error)
    }

    const placements = buildPlacements(product.files, printfilesData)

    return NextResponse.json({
      source: 'printful',
      productId: config.productId,
      templateId: config.templateId ?? config.productId,
      name: product.title || product.name || slug,
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

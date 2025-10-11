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
  
  // PASO 1: Normalizar placement codes
  const PLACEMENT_CODES: Record<string, string> = {
    'front': 'front',
    'default': 'front',
    'front_print': 'front',
    'front_center': 'front',
    'front center': 'front',
    'back': 'back',
    'back_print': 'back',
    'back_center': 'back',
    'back center': 'back',
    'left': 'sleeve_left',
    'sleeve_left': 'sleeve_left',
    'left_sleeve': 'sleeve_left',
    'left sleeve': 'sleeve_left',
    'right': 'sleeve_right',
    'sleeve_right': 'sleeve_right',
    'right_sleeve': 'sleeve_right',
    'right sleeve': 'sleeve_right',
    'embroidery_left_chest': 'embroidery_left_chest',
    'embroidery_chest_left': 'embroidery_left_chest',
    'embroidery chest left': 'embroidery_left_chest',
  }
  
  // PASO 2: Labels claros en español
  const PLACEMENT_LABELS: Record<string, string> = {
    'front': 'Frente',
    'front_large': 'Frente Grande',
    'back': 'Espalda',
    'sleeve_left': 'Manga Izquierda',
    'sleeve_right': 'Manga Derecha',
    'embroidery_left_chest': 'Bordado Pecho Izquierdo',
  }
  
  // Solo usar FALLBACK_PLACEMENTS si no hay datos específicos del producto
  const hasSpecificPlacements = Array.isArray(files) && files.length > 0
  const hasPrintfilesPlacements = printfilesData && printfilesData.variant_printfiles && 
    Array.isArray(printfilesData.variant_printfiles) && 
    printfilesData.variant_printfiles[0]?.placements &&
    Object.keys(printfilesData.variant_printfiles[0].placements).length > 0
  
  if (!hasSpecificPlacements && !hasPrintfilesPlacements) {
    // Solo usar fallbacks si no hay áreas específicas del producto
    FALLBACK_PLACEMENTS.forEach((entry) => resultMap.set(entry.placement, { ...entry }))
  }

  if (Array.isArray(files)) {
    files.forEach((file) => {
      // PASO 3: Filtrar áreas con additional_price > 0
      const additionalPrice = Number(file.additional_price || file.additionalPrice || 0)
      if (additionalPrice > 0) {
        return // SKIP áreas con precio adicional
      }
      
      const rawCode = String(file.type || file.id || file.placement || '').toLowerCase()
      if (!rawCode) return
      
      // PASO 3b: Filtrar áreas que contengan "label" o "mockup" en su código
      if (rawCode.includes('label') || rawCode.includes('mockup')) {
        return // SKIP áreas de etiquetas y mockups (label_outside, mockup, etc.)
      }
      
      // Normalizar el código de placement
      const normalizedCode = PLACEMENT_CODES[rawCode] || rawCode
      const label = PLACEMENT_LABELS[normalizedCode] || normalizedCode
      
      // Solo agregar si NO existe ya (deduplicación)
      if (!resultMap.has(normalizedCode)) {
        const width = Number(file.width) || 3600
        const height = Number(file.height) || 4800
        
        resultMap.set(normalizedCode, {
          placement: normalizedCode,
          label,
          printfileId: file.id ?? file.printfile_id ?? null,
          width,
          height,
          areaWidth: width,
          areaHeight: height,
          position: {
            top: Number(file.position?.top ?? 0),
            left: Number(file.position?.left ?? 0),
            width: Number(file.position?.width ?? file.width ?? width),
            height: Number(file.position?.height ?? file.height ?? height),
          },
        })
      }
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

    // PASO 4: Agregar printfiles data (sin duplicar)
    Object.entries(variantPrintfiles).forEach(([placementKey, printfileIdValue]) => {
      // Filtrar áreas que contengan "label" o "mockup"
      const lowerKey = placementKey.toLowerCase()
      if (lowerKey.includes('label') || lowerKey.includes('mockup')) {
        return // SKIP áreas de etiquetas y mockups
      }
      
      // Normalizar el código de placement
      const normalizedCode = PLACEMENT_CODES[placementKey] || placementKey
      
      // Solo agregar si NO existe ya (evitar duplicados)
      if (!resultMap.has(normalizedCode)) {
        const printfileId = Number(printfileIdValue)
        const printfile = printfileLookup.get(printfileId)
        const label = PLACEMENT_LABELS[normalizedCode] || normalizedCode
        const width = printfile?.width ? Number(printfile.width) : 3600
        const height = printfile?.height ? Number(printfile.height) : 4800

        resultMap.set(normalizedCode, {
          placement: normalizedCode,
          label,
          printfileId,
          width,
          height,
          areaWidth: width,
          areaHeight: height,
          position: { top: 0, left: 0, width, height },
        })
      }
    })
  }

  // PASO 5: Detectar y resolver placements conflictivos
  const finalPlacements = Array.from(resultMap.values())
  
  // Detectar conflictos front/front_large
  const hasFront = finalPlacements.some(p => p.placement === 'front')
  const hasFrontLarge = finalPlacements.some(p => p.placement === 'front_large')
  
  if (hasFront && hasFrontLarge) {
    console.log('⚠️ Detectado conflicto: front y front_large presentes')
    // Mantener solo front_large (más grande) y eliminar front
    return finalPlacements.filter(p => p.placement !== 'front')
  }
  
  return finalPlacements
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
    const sizes = Array.from(new Set(variants.map((variant) => variant.size).filter(Boolean)))

    let printfilesData: any = null
    try {
      const response: any = await client.getPrintfiles(productId)
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

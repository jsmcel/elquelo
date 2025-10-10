import { NextRequest, NextResponse } from 'next/server'
import { promises as fs } from 'fs'
import path from 'path'

const CATALOG_PATH = path.resolve(process.cwd(), 'mocks', 'printful-catalog-full.json')
const CACHE_TTL_MS = 15 * 60 * 1000
const IN_STOCK_STATUSES = new Set(['in_stock', 'stocked_on_demand'])

interface RawCatalogFile {
  items?: any[]
  products?: any[]
  fetchedAt?: string
}

interface AvailabilityEntry {
  region: string
  status: string
}

interface CatalogPlacement {
  id: string
  label: string
  additionalPrice: number | null
}

interface CatalogVariant {
  id: number
  size: string | null
  color: string | null
  colorCode: string | null
  price: number | null
  image: string | null
  inStock: boolean
  availability: AvailabilityEntry[]
  availableRegions: string[]
}

interface CatalogProduct {
  id: number
  name: string
  type: string | null
  brand: string | null
  image: string | null
  placements: CatalogPlacement[]
  variants: CatalogVariant[]
  fetchedAt: string | null
}

interface FilteredVariant extends CatalogVariant {
  matchedRegion: string | null
}

interface FilteredCatalogProduct {
  id: number
  name: string
  type: string | null
  brand: string | null
  image: string | null
  placements: CatalogPlacement[]
  variants: FilteredVariant[]
  priceMin: number | null
  priceMax: number | null
  colors: { name: string; code: string | null }[]
  sizes: string[]
  availableRegions: string[]
}

interface LoadedCatalog {
  items: CatalogProduct[]
  fetchedAt: string | null
}

const REGION_PRIORITY: Record<string, string[]> = {
  US: ['US'],
  CA: ['CA', 'US'],
  BR: ['BR', 'US'],
  MX: ['US', 'CA'],
  AU: ['AU', 'US'],
  NZ: ['AU', 'US'],
  JP: ['JP', 'US'],
  CN: ['CN', 'US'],
  GB: ['UK', 'EU'],
  UK: ['UK', 'EU'],
  ES: ['EU_ES', 'EU'],
  FR: ['EU', 'EU_ES'],
  IT: ['EU'],
  PT: ['EU'],
  DE: ['EU'],
  NL: ['EU'],
  BE: ['EU'],
  LV: ['EU_LV', 'EU'],
}

const REGION_FALLBACK = ['EU_ES', 'EU', 'US']
const EUROPEAN_COUNTRIES = new Set([
  'AT', 'BE', 'BG', 'CY', 'CZ', 'DE', 'DK', 'EE', 'ES', 'FI', 'FR', 'GR', 'HR', 'HU', 'IE', 'IT', 'LT', 'LU', 'LV',
  'MT', 'NL', 'PL', 'PT', 'RO', 'SE', 'SI', 'SK', 'NO', 'IS', 'LI', 'CH', 'MC'
])

let cachedCatalog: LoadedCatalog | null = null
let cacheTimestamp = 0

function coerceString(value: unknown): string | null {
  if (typeof value === 'string') {
    const trimmed = value.trim()
    return trimmed.length ? trimmed : null
  }
  if (typeof value === 'number' && Number.isFinite(value)) {
    return String(value)
  }
  return null
}

function coerceNumber(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value
  }
  if (typeof value === 'string') {
    const parsed = Number.parseFloat(value)
    if (Number.isFinite(parsed)) {
      return parsed
    }
  }
  return null
}

function normalizePlacements(source: any): CatalogPlacement[] {
  const filesArray: any[] = Array.isArray(source?.files)
    ? source.files
    : Array.isArray(source)
      ? source
      : []

  const placements = new Map<string, CatalogPlacement>()

  filesArray.forEach((file) => {
    if (!file) return
    // Priorizar file.id (único) o file.type, nunca file.title como código
    const code = coerceString(file.id || file.type || file.placement)
    if (!code) return
    const id = code.toLowerCase()
    const label = coerceString(file.title || file.label) || code
    const additionalPrice = coerceNumber(file.additional_price ?? file.additionalPrice ?? null)

    const existing = placements.get(id)
    if (existing) {
      // Si ya existe, solo actualizar el precio si es mayor
      if (additionalPrice !== null && (existing.additionalPrice === null || additionalPrice > existing.additionalPrice)) {
        existing.additionalPrice = additionalPrice
      }
      return
    }

    placements.set(id, {
      id,
      label,
      additionalPrice: additionalPrice !== null ? additionalPrice : null,
    })
  })

  return Array.from(placements.values())
}

function normalizeVariant(raw: any): CatalogVariant | null {
  if (!raw) return null
  const variantId = Number(raw.id ?? raw.variant_id)
  if (!Number.isFinite(variantId) || variantId <= 0) {
    return null
  }

  const availability: AvailabilityEntry[] = Array.isArray(raw.availability_status)
    ? raw.availability_status
        .map((entry: any) => ({
          region: coerceString(entry?.region)?.toUpperCase(),
          status: coerceString(entry?.status)?.toLowerCase(),
        }))
        .filter((entry: any): entry is AvailabilityEntry => Boolean(entry.region && entry.status))
    : []

  const regionSet = new Set<string>()
  if (raw.availability_regions && typeof raw.availability_regions === 'object') {
    Object.keys(raw.availability_regions).forEach((key) => {
      const normalized = coerceString(key)?.toUpperCase()
      if (normalized) {
        regionSet.add(normalized)
      }
    })
  }
  if (Array.isArray(raw.available_regions)) {
    raw.available_regions.forEach((value: any) => {
      const normalized = coerceString(value)?.toUpperCase()
      if (normalized) {
        regionSet.add(normalized)
      }
    })
  }
  if (Array.isArray(raw.availableRegions)) {
    raw.availableRegions.forEach((value: any) => {
      const normalized = coerceString(value)?.toUpperCase()
      if (normalized) {
        regionSet.add(normalized)
      }
    })
  }
  availability.forEach(({ region }) => regionSet.add(region))

  const size = coerceString(raw.size)
  const color = coerceString(raw.color) || coerceString(raw.color_name)
  const colorCode = coerceString(raw.color_code || raw.color_code2)?.toLowerCase() || null
  const price = coerceNumber(raw.price ?? raw.variant_price ?? raw.retail_price)
  const image =
    coerceString(raw.product_image) ||
    coerceString(raw.image) ||
    coerceString(raw.preview_url) ||
    null

  const inStock = Boolean(raw.in_stock) || availability.some((entry) => IN_STOCK_STATUSES.has(entry.status))

  return {
    id: variantId,
    size: size || null,
    color: color || null,
    colorCode,
    price,
    image,
    inStock,
    availability,
    availableRegions: Array.from(regionSet),
  }
}

function normalizeProduct(raw: any, fetchedAt: string | null): CatalogProduct | null {
  if (!raw || typeof raw !== 'object') {
    return null
  }

  const idCandidate = raw.productId ?? raw.id ?? raw.product_id ?? raw.templateId ?? raw.template_id
  const id = Number(idCandidate)
  if (!Number.isFinite(id) || id <= 0) {
    return null
  }

  const name =
    coerceString(raw.name) ||
    coerceString(raw.title) ||
    [coerceString(raw.brand), coerceString(raw.model) || coerceString(raw.type)]
      .filter((value): value is string => Boolean(value && value.trim().length))
      .join(' ') ||
    `Producto ${id}`

  const type =
    coerceString(raw.producto) ||
    coerceString(raw.type_name) ||
    coerceString(raw.type) ||
    null

  const brand = coerceString(raw.brand)

  const image =
    coerceString(raw.image) ||
    coerceString(raw.preview) ||
    coerceString(raw.thumbnail) ||
    (Array.isArray(raw.images) && raw.images.length
      ? coerceString(raw.images[0]?.url ?? raw.images[0])
      : null)

  const variantsSource: any[] = Array.isArray(raw.variants) ? raw.variants : []
  const variants = variantsSource
    .map((variant) => normalizeVariant(variant))
    .filter((variant): variant is CatalogVariant => Boolean(variant))

  const placements = normalizePlacements(raw.files || raw.placements)

  return {
    id,
    name,
    type,
    brand,
    image,
    variants,
    placements,
    fetchedAt,
  }
}

async function loadCatalog(): Promise<LoadedCatalog> {
  const now = Date.now()
  if (cachedCatalog && now - cacheTimestamp < CACHE_TTL_MS) {
    return cachedCatalog
  }

  try {
    const file = await fs.readFile(CATALOG_PATH, 'utf8')
    const data: RawCatalogFile = JSON.parse(file)
    const fetchedAt = typeof data?.fetchedAt === 'string' ? data.fetchedAt : null
    const rawItems = Array.isArray(data?.items)
      ? data.items
      : Array.isArray(data?.products)
        ? data.products
        : []

    const items = rawItems
      .map((item) => normalizeProduct(item, fetchedAt))
      .filter((item): item is CatalogProduct => Boolean(item))

    cachedCatalog = { items, fetchedAt }
    cacheTimestamp = now
    return cachedCatalog
  } catch (error) {
    console.error('[printful catalog] no pudimos cargar printful-catalog-full.json', error)
    cachedCatalog = { items: [], fetchedAt: null }
    cacheTimestamp = now
    return cachedCatalog
  }
}

function detectCountry(request: NextRequest): string {
  const geoCountry = (request.geo?.country as string | undefined) || null
  const headerCountry =
    request.headers.get('x-vercel-ip-country') ||
    request.headers.get('cf-ipcountry') ||
    request.headers.get('x-country-code')
  return (geoCountry || headerCountry || 'ES').toUpperCase()
}

function resolveRegionsForCountry(countryCode: string): string[] {
  if (REGION_PRIORITY[countryCode]) {
    return REGION_PRIORITY[countryCode]
  }
  if (EUROPEAN_COUNTRIES.has(countryCode)) {
    if (countryCode === 'ES') {
      return REGION_PRIORITY.ES
    }
    if (countryCode === 'LV') {
      return REGION_PRIORITY.LV
    }
    return ['EU']
  }
  return REGION_FALLBACK
}

function variantMatchesRegions(variant: CatalogVariant, regions: string[]): { matched: boolean; region: string | null } {
  for (const region of regions) {
    const availability = variant.availability.find((entry) => entry.region === region)
    if (availability && IN_STOCK_STATUSES.has(availability.status)) {
      return { matched: true, region }
    }
    if (variant.availableRegions.includes(region) && variant.inStock) {
      return { matched: true, region }
    }
  }
  return { matched: false, region: null }
}

function filterProductForRegions(product: CatalogProduct, regions: string[], typeFilter: string | null): FilteredCatalogProduct | null {
  if (typeFilter) {
    const typeValue = product.type?.toLowerCase() || ''
    if (typeValue !== typeFilter.toLowerCase()) {
      return null
    }
  }

  const filteredVariants: FilteredVariant[] = []

  product.variants.forEach((variant) => {
    const { matched, region } = variantMatchesRegions(variant, regions)
    if (matched) {
      filteredVariants.push({ ...variant, matchedRegion: region })
    }
  })

  if (!filteredVariants.length) {
    return null
  }

  const priceValues = filteredVariants
    .map((variant) => variant.price)
    .filter((value): value is number => typeof value === 'number' && Number.isFinite(value))

  const priceMin = priceValues.length ? Math.min(...priceValues) : null
  const priceMax = priceValues.length ? Math.max(...priceValues) : null

  const colorMap = new Map<string, { name: string; code: string | null }>()
  const sizeSet = new Set<string>()
  const regionSet = new Set<string>()

  filteredVariants.forEach((variant) => {
    if (variant.color) {
      const key = (variant.colorCode || variant.color).toLowerCase()
      if (!colorMap.has(key)) {
        colorMap.set(key, { name: variant.color, code: variant.colorCode })
      }
    }
    if (variant.size) {
      sizeSet.add(variant.size.toUpperCase())
    }
    variant.availableRegions.forEach((region) => regionSet.add(region))
    variant.availability.forEach(({ region }) => regionSet.add(region))
  })

  const colors = Array.from(colorMap.values())
  const sizes = Array.from(sizeSet.values())
  const availableRegions = Array.from(regionSet.values())

  return {
    id: product.id,
    name: product.name,
    type: product.type,
    brand: product.brand,
    image: product.image,
    placements: product.placements,
    variants: filteredVariants,
    priceMin,
    priceMax,
    colors,
    sizes,
    availableRegions,
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const limit = Number.parseInt(searchParams.get('limit') || '50', 10)
  const offset = Number.parseInt(searchParams.get('offset') || '0', 10)
  const typeFilter = searchParams.get('type') || searchParams.get('producto') || null

  const safeLimit = Number.isFinite(limit) ? Math.min(Math.max(limit, 1), 200) : 50
  const safeOffset = Number.isFinite(offset) && offset > 0 ? offset : 0

  const country = detectCountry(request)
  const preferredRegions = resolveRegionsForCountry(country)

  const catalog = await loadCatalog()
  const normalizedTypeFilter = typeFilter ? typeFilter.trim().toLowerCase() : null

  const filteredProducts = catalog.items
    .map((item) => filterProductForRegions(item, preferredRegions, normalizedTypeFilter))
    .filter((item): item is FilteredCatalogProduct => Boolean(item))

  const typeCounter = new Map<string, number>()
  filteredProducts.forEach((item) => {
    if (item.type) {
      const key = item.type.toLowerCase()
      typeCounter.set(key, (typeCounter.get(key) || 0) + 1)
    }
  })

  filteredProducts.sort((a, b) => {
    const aPrice = typeof a.priceMin === 'number' ? a.priceMin : Number.POSITIVE_INFINITY
    const bPrice = typeof b.priceMin === 'number' ? b.priceMin : Number.POSITIVE_INFINITY
    if (aPrice !== bPrice) {
      return aPrice - bPrice
    }
    return a.name.localeCompare(b.name)
  })

  const total = filteredProducts.length
  const pageItems = filteredProducts.slice(safeOffset, safeOffset + safeLimit)

  const typeOptions = Array.from(typeCounter.entries())
    .map(([value, count]) => ({ value, count }))
    .sort((a, b) => a.value.localeCompare(b.value))

  return NextResponse.json({
    success: true,
    country,
    regions: preferredRegions,
    fetchedAt: catalog.fetchedAt,
    total,
    paging: {
      limit: safeLimit,
      offset: safeOffset,
    },
    typeOptions,
    items: pageItems,
    products: pageItems,
  })
}





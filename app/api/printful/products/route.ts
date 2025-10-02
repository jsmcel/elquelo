import { NextRequest, NextResponse } from 'next/server'
import { PrintfulClient } from '@/lib/printful-v2'
import { promises as fs } from 'fs'
import path from 'path'

const CATALOG_CACHE_PATH = path.resolve(process.cwd(), 'mocks', 'printful-catalog.json')

interface CachedCatalogProduct {
  id: number
  name: string
  type: string | null
  brand: string | null
  model: string | null
  image: string | null
  variantsCount: number | null
}

interface CachedCatalog {
  products: CachedCatalogProduct[]
  fetchedAt: string | null
  source: string | null
}

async function loadCachedCatalog(): Promise<CachedCatalog> {
  try {
    const file = await fs.readFile(CATALOG_CACHE_PATH, 'utf8')
    const data = JSON.parse(file)
    if (Array.isArray(data?.products)) {
      const products = data.products
        .map((product: any) => normalizeProduct(product))
        .filter(Boolean) as CachedCatalogProduct[]
      return {
        products,
        fetchedAt: typeof data?.fetchedAt === 'string' ? data.fetchedAt : null,
        source: typeof data?.source === 'string' ? data.source : null,
      }
    }
  } catch (error) {
    // ignore load errors
  }
  return { products: [], fetchedAt: null, source: null }
}

async function saveCatalogCache(
  products: CachedCatalogProduct[],
  source: string,
  fetchedAt: string = new Date().toISOString(),
) {
  try {
    const payload = {
      fetchedAt,
      source,
      products,
    }
    await fs.mkdir(path.dirname(CATALOG_CACHE_PATH), { recursive: true })
    await fs.writeFile(CATALOG_CACHE_PATH, JSON.stringify(payload, null, 2), 'utf8')
  } catch (error) {
    console.warn('[printful catalog] no pudimos guardar cache', error)
  }
}

const LEGACY_CATALOG_FALLBACK = [
  {
    id: 71,
    name: 'GILDAN 64000',
    brand: 'Legacy',
    model: 'gildan-64000',
    type: 'T-SHIRT',
    image: null,
    variantsCount: null,
  },
]

function parseInteger(value: string | null, fallback: number) {
  if (!value) return fallback
  const parsed = Number.parseInt(value, 10)
  if (Number.isNaN(parsed) || parsed < 0) {
    return fallback
  }
  return parsed
}

function normalizeProduct(product: any) {
  if (!product) return null
  const idCandidate = product.id ?? product.product_id ?? product.productId
  const id = Number(idCandidate)
  if (!id || Number.isNaN(id)) {
    return null
  }

  const name =
    product.name ||
    product.title ||
    [product.brand, product.model || product.type]
      .filter((value) => typeof value === 'string' && value.trim().length)
      .join(' ') ||
    `Producto ${id}`

  const image =
    product.image ||
    product.preview ||
    product.thumbnail ||
    (Array.isArray(product.images) && product.images.length ? product.images[0]?.url || product.images[0] : null) ||
    (Array.isArray(product.variant_images) && product.variant_images.length ? product.variant_images[0] : null)

  return {
    id,
    name,
    type: product.type || null,
    brand: product.brand || null,
    model: product.model || null,
    image: typeof image === 'string' ? image : null,
    variantsCount: Array.isArray(product.variants) ? product.variants.length : product.variants_count ?? null,
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const limit = Math.min(Math.max(parseInteger(searchParams.get('limit'), 50), 1), 200)
  const offset = parseInteger(searchParams.get('offset'), 0)
  const search = searchParams.get('search') || undefined
  const category = searchParams.get('category') || undefined
  const type = searchParams.get('type') || undefined

  try {
    const client = new PrintfulClient()
    const params: Record<string, unknown> = { limit, offset }
    if (search) params['search'] = search
    if (category) params['category_id'] = category
    if (type) params['type'] = type

    const response: any = await client.getCatalogProducts(params)
    const payload = response?.result || response?.data || response
    const rawProducts = Array.isArray(payload?.products)
      ? payload.products
      : Array.isArray(payload?.items)
        ? payload.items
        : []

    let products = rawProducts
      .map(normalizeProduct)
      .filter((product): product is CachedCatalogProduct => Boolean(product))

    let responseSource: 'printful' | 'cache' | 'fallback' = 'printful'
    let cachedAt: string | null = null

    if (products.length) {
      const fetchedAt = new Date().toISOString()
      await saveCatalogCache(products, 'printful', fetchedAt)
      cachedAt = fetchedAt
    } else {
      const cached = await loadCachedCatalog()
      if (cached.products.length) {
        products = cached.products
        responseSource = 'cache'
        cachedAt = cached.fetchedAt
      } else {
        products = [...LEGACY_CATALOG_FALLBACK]
        responseSource = 'fallback'
      }
    }

    return NextResponse.json({
      success: true,
      source: responseSource,
      products,
      paging: payload?.paging || null,
      cachedAt,
    })
  } catch (error) {
    console.error('Error fetching Printful catalog products', error)
    const cached = await loadCachedCatalog()
    if (cached.products.length) {
      return NextResponse.json({
        success: true,
        source: 'cache',
        products: cached.products,
        paging: null,
        cachedAt: cached.fetchedAt,
        error: error instanceof Error ? error.message : 'No pudimos cargar el catalogo real de Printful',
      })
    }
    return NextResponse.json(
      {
        success: true,
        source: 'fallback',
        products: [...LEGACY_CATALOG_FALLBACK],
        paging: null,
        cachedAt: null,
        error: error instanceof Error ? error.message : 'No pudimos cargar el catalogo real de Printful',
      },
      { status: 200 },
    )
  }
}

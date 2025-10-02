import { NextRequest, NextResponse } from 'next/server'
import { PrintfulClient } from '@/lib/printful-v2'
import { promises as fs } from 'fs'
import path from 'path'

const CATALOG_CACHE_PATH = path.resolve(process.cwd(), 'mocks', 'printful-catalog.json')

async function loadCachedCatalog() {
  try {
    const file = await fs.readFile(CATALOG_CACHE_PATH, 'utf8')
    const data = JSON.parse(file)
    if (Array.isArray(data?.products)) {
      return data.products
    }
    return []
  } catch (error) {
    return []
  }
}

async function saveCatalogCache(products: any[], source: string) {
  try {
    const payload = {
      fetchedAt: new Date().toISOString(),
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
      .filter((product): product is NonNullable<ReturnType<typeof normalizeProduct>> => Boolean(product))

    if (products.length) {
      await saveCatalogCache(products, 'printful')
    } else {
      const cached = await loadCachedCatalog()
      if (cached.length) {
        products = cached
      } else {
        products = [...LEGACY_CATALOG_FALLBACK]
      }
    }

    const responseSource = products === LEGACY_CATALOG_FALLBACK ? 'fallback' : 'printful'

    return NextResponse.json({
      success: true,
      source: responseSource,
      products,
      paging: payload?.paging || null,
    })
  } catch (error) {
    console.error('Error fetching Printful catalog products', error)
    const cached = await loadCachedCatalog()
    if (cached.length) {
      return NextResponse.json({
        success: true,
        source: 'cache',
        products: cached,
        paging: null,
        error: error instanceof Error ? error.message : 'No pudimos cargar el catalogo real de Printful',
      })
    }
    return NextResponse.json(
      {
        success: true,
        source: 'fallback',
        products: [...LEGACY_CATALOG_FALLBACK],
        paging: null,
        error: error instanceof Error ? error.message : 'No pudimos cargar el catalogo real de Printful',
      },
      { status: 200 },
    )
  }
}

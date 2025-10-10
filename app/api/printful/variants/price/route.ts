import { NextRequest, NextResponse } from 'next/server'
import { promises as fs } from 'fs'
import path from 'path'

const CATALOG_PATH = path.resolve(process.cwd(), 'mocks', 'printful-catalog-full.json')
const MARKUP_PERCENTAGE = 40 // 40% markup

interface CachedCatalog {
  data: any
  timestamp: number
}

let cachedCatalog: CachedCatalog | null = null
const CACHE_TTL_MS = 15 * 60 * 1000 // 15 minutos

async function loadCatalog() {
  const now = Date.now()
  
  if (cachedCatalog && (now - cachedCatalog.timestamp) < CACHE_TTL_MS) {
    return cachedCatalog.data
  }

  try {
    const raw = await fs.readFile(CATALOG_PATH, 'utf-8')
    const data = JSON.parse(raw)
    
    cachedCatalog = {
      data,
      timestamp: now
    }
    
    return data
  } catch (error) {
    console.error('Error loading catalog:', error)
    throw new Error('Catalog not available')
  }
}

function findVariantInCatalog(catalog: any, variantId: number): { price: number; currency: string } | null {
  const items = catalog?.items || []
  
  for (const product of items) {
    const variants = product?.variants || []
    const variant = variants.find((v: any) => Number(v.id) === variantId)
    
    if (variant && variant.price) {
      const priceUSD = parseFloat(variant.price)
      if (!isNaN(priceUSD)) {
        return {
          price: priceUSD,
          currency: 'USD'
        }
      }
    }
  }
  
  return null
}

function convertUSDtoEUR(usd: number): number {
  // Tipo de cambio aproximado USD -> EUR (actualizar según necesidad)
  const exchangeRate = 0.92
  return usd * exchangeRate
}

function applyMarkup(basePrice: number): number {
  return basePrice * (1 + MARKUP_PERCENTAGE / 100)
}

export async function POST(req: NextRequest) {
  try {
    const { variantIds } = await req.json()
    
    if (!Array.isArray(variantIds) || variantIds.length === 0) {
      return NextResponse.json(
        { error: 'Se requiere un array de variantIds' },
        { status: 400 }
      )
    }

    const catalog = await loadCatalog()
    const prices: Record<number, { basePrice: number; finalPrice: number; currency: string }> = {}

    for (const variantId of variantIds) {
      const numericId = Number(variantId)
      
      if (!Number.isFinite(numericId) || numericId <= 0) {
        continue
      }

      const variantData = findVariantInCatalog(catalog, numericId)
      
      if (variantData) {
        // Convertir USD a EUR
        const basePriceEUR = convertUSDtoEUR(variantData.price)
        // Aplicar markup del 40%
        const finalPriceEUR = applyMarkup(basePriceEUR)
        
        prices[numericId] = {
          basePrice: Math.round(basePriceEUR * 100) / 100,
          finalPrice: Math.round(finalPriceEUR * 100) / 100,
          currency: 'EUR'
        }
      }
    }

    return NextResponse.json({
      success: true,
      prices,
      markup: MARKUP_PERCENTAGE
    })
  } catch (error) {
    console.error('Error calculating prices:', error)
    return NextResponse.json(
      { error: 'Error al calcular precios' },
      { status: 500 }
    )
  }
}


import { NextRequest, NextResponse } from 'next/server'
import { promises as fs } from 'fs'
import path from 'path'

const CATALOG_PATH = path.resolve(process.cwd(), 'mocks', 'printful-catalog-full.json')
const MARKUP_PERCENTAGE = 40 // 40% markup
const FALLBACK_EXCHANGE_RATE = 0.92 // Fallback si falla la API de tipo de cambio

interface CachedCatalog {
  data: any
  timestamp: number
}

interface ExchangeRateCache {
  rate: number
  timestamp: number
}

let cachedCatalog: CachedCatalog | null = null
let cachedExchangeRate: ExchangeRateCache | null = null
const CATALOG_CACHE_TTL_MS = 15 * 60 * 1000 // 15 minutos
const EXCHANGE_RATE_CACHE_TTL_MS = 24 * 60 * 60 * 1000 // 24 horas

async function getExchangeRate(): Promise<number> {
  const now = Date.now()
  
  // Verificar cache
  if (cachedExchangeRate && (now - cachedExchangeRate.timestamp) < EXCHANGE_RATE_CACHE_TTL_MS) {
    return cachedExchangeRate.rate
  }

  try {
    // Obtener tipo de cambio de Frankfurter API
    const response = await fetch('https://api.frankfurter.app/latest?from=USD&to=EUR', {
      next: { revalidate: 86400 } // Cache de Next.js por 24h
    })

    if (!response.ok) {
      throw new Error(`Frankfurter API error: ${response.status}`)
    }

    const data = await response.json()
    const rate = data?.rates?.EUR

    if (typeof rate !== 'number' || isNaN(rate) || rate <= 0) {
      throw new Error('Invalid exchange rate from API')
    }

    // Cachear el resultado
    cachedExchangeRate = {
      rate,
      timestamp: now
    }

    console.log(`✅ Exchange rate updated: 1 USD = ${rate} EUR`)
    return rate

  } catch (error) {
    console.error('⚠️ Error fetching exchange rate, using fallback:', error)
    
    // Si hay un cache antiguo, usarlo
    if (cachedExchangeRate) {
      console.log(`Using stale cached rate: ${cachedExchangeRate.rate}`)
      return cachedExchangeRate.rate
    }
    
    // Usar fallback
    console.log(`Using fallback rate: ${FALLBACK_EXCHANGE_RATE}`)
    return FALLBACK_EXCHANGE_RATE
  }
}

async function loadCatalog() {
  const now = Date.now()
  
  if (cachedCatalog && (now - cachedCatalog.timestamp) < CATALOG_CACHE_TTL_MS) {
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

async function convertUSDtoEUR(usd: number): Promise<number> {
  const exchangeRate = await getExchangeRate()
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
    const exchangeRate = await getExchangeRate()
    const prices: Record<number, { basePrice: number; finalPrice: number; currency: string }> = {}

    for (const variantId of variantIds) {
      const numericId = Number(variantId)
      
      if (!Number.isFinite(numericId) || numericId <= 0) {
        continue
      }

      const variantData = findVariantInCatalog(catalog, numericId)
      
      if (variantData) {
        // Convertir USD a EUR con tipo de cambio real
        const basePriceEUR = await convertUSDtoEUR(variantData.price)
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
      markup: MARKUP_PERCENTAGE,
      exchangeRate: Math.round(exchangeRate * 10000) / 10000 // 4 decimales
    })
  } catch (error) {
    console.error('Error calculating prices:', error)
    return NextResponse.json(
      { error: 'Error al calcular precios' },
      { status: 500 }
    )
  }
}


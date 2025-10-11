const FRANKFURTER_API = 'https://api.frankfurter.app/latest'
const CACHE_TTL_MS = 24 * 60 * 60 * 1000 // 24 horas
const FALLBACK_RATE = 0.92 // Fallback si falla la API

interface ExchangeRateCache {
  rate: number
  timestamp: number
  source: 'api' | 'fallback'
}

let cachedRate: ExchangeRateCache | null = null

export async function fetchExchangeRate(): Promise<number> {
  const now = Date.now()

  // Verificar cache
  if (cachedRate && (now - cachedRate.timestamp) < CACHE_TTL_MS) {
    return cachedRate.rate
  }

  try {
    // Obtener tipo de cambio de Frankfurter
    const response = await fetch(`${FRANKFURTER_API}?from=USD&to=EUR`, {
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
    cachedRate = {
      rate,
      timestamp: now,
      source: 'api'
    }

    console.log(`✅ Exchange rate updated: 1 USD = ${rate} EUR (from Frankfurter API)`)
    return rate

  } catch (error) {
    console.error('Error fetching exchange rate from Frankfurter:', error)
    
    // Usar fallback
    if (!cachedRate) {
      cachedRate = {
        rate: FALLBACK_RATE,
        timestamp: now,
        source: 'fallback'
      }
      console.warn(`⚠️ Using fallback exchange rate: ${FALLBACK_RATE}`)
    }

    return cachedRate.rate
  }
}

export function getCachedRate() {
  return cachedRate
}

export const FALLBACK_EXCHANGE_RATE = FALLBACK_RATE


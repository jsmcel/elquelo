import { NextRequest, NextResponse } from 'next/server'
import { fetchExchangeRate, getCachedRate, FALLBACK_EXCHANGE_RATE } from '@/lib/exchange-rate'

const CACHE_TTL_MS = 24 * 60 * 60 * 1000 // 24 horas

export async function GET(req: NextRequest) {
  try {
    const rate = await fetchExchangeRate()
    const cachedRate = getCachedRate()
    
    return NextResponse.json({
      success: true,
      rate,
      from: 'USD',
      to: 'EUR',
      source: cachedRate?.source || 'unknown',
      cachedAt: cachedRate?.timestamp ? new Date(cachedRate.timestamp).toISOString() : null,
      expiresIn: cachedRate?.timestamp 
        ? Math.max(0, CACHE_TTL_MS - (Date.now() - cachedRate.timestamp))
        : 0
    })
  } catch (error) {
    console.error('Exchange rate endpoint error:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to get exchange rate',
        rate: FALLBACK_EXCHANGE_RATE,
        source: 'fallback'
      },
      { status: 500 }
    )
  }
}


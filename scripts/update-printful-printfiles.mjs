#!/usr/bin/env node

/**
 * Script para actualizar los printfiles de Printful
 * Se ejecuta diariamente a las 5 AM via GitHub Actions
 * 
 * Los printfiles contienen información detallada sobre:
 * - Dimensiones exactas de áreas de impresión
 * - Posiciones y limitaciones de cada placement
 * - IDs de printfiles para cada producto/variante
 */

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const PRINTFUL_API_KEY = process.env.PRINTFUL_API_KEY
const PRINTFUL_STORE_ID = process.env.PRINTFUL_STORE_ID
const PRINTFUL_API_BASE = 'https://api.printful.com'

const DELAY_MS = 300 // Delay entre requests para no saturar la API
const CATALOG_PATH = './mocks/printful-catalog-full.json'

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

async function fetchPrintfiles(productId, silent = false) {
  const url = `${PRINTFUL_API_BASE}/mockup-generator/printfiles/${productId}`
  
  if (!silent) {
    console.log(`Fetching printfiles for product ${productId}...`)
  }
  
  try {
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${PRINTFUL_API_KEY}`,
        'X-PF-Store-Id': PRINTFUL_STORE_ID,
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      // No loggear 404s (producto no tiene printfiles)
      if (response.status !== 404 && !silent) {
        const errorText = await response.text()
        console.error(`❌ Error ${response.status} for product ${productId}`)
      }
      return null
    }

    const data = await response.json()
    const result = data?.result || data
    
    if (!result || !result.printfiles || result.printfiles.length === 0) {
      return null
    }

    if (!silent) {
      console.log(`✅ Fetched printfiles for product ${productId}`)
    }
    
    return {
      productId,
      ...result
    }
  } catch (error) {
    if (!silent) {
      console.error(`❌ Exception for product ${productId}:`, error.message)
    }
    return null
  }
}

async function loadProductIdsFromCatalog() {
  try {
    console.log('📖 Loading product IDs from catalog...')
    const catalogData = JSON.parse(fs.readFileSync(CATALOG_PATH, 'utf8'))
    const items = catalogData.items || []
    
    // Extraer IDs únicos de productos
    const productIds = [...new Set(items.map(item => item.productId).filter(Boolean))]
    
    console.log(`✅ Found ${productIds.length} unique products in catalog`)
    return productIds.sort((a, b) => a - b)
  } catch (error) {
    console.error('❌ Error loading catalog:', error.message)
    console.log('⚠️  Falling back to essential products only')
    
    // Fallback: solo productos esenciales
    return [71, 145, 19, 257, 259, 242, 92, 382, 474]
  }
}

async function updatePrintfiles() {
  console.log('🚀 Starting Printful printfiles update...')
  
  if (!PRINTFUL_API_KEY) {
    console.error('❌ PRINTFUL_API_KEY environment variable is not set')
    process.exit(1)
  }
  
  if (!PRINTFUL_STORE_ID) {
    console.error('❌ PRINTFUL_STORE_ID environment variable is not set')
    process.exit(1)
  }

  // Cargar todos los IDs del catálogo
  const PRODUCT_IDS = await loadProductIdsFromCatalog()
  console.log(`📦 Fetching printfiles for ${PRODUCT_IDS.length} products`)

  const allPrintfiles = {}
  let successCount = 0
  let failCount = 0
  let skipCount = 0

  const startTime = Date.now()
  
  for (let i = 0; i < PRODUCT_IDS.length; i++) {
    const productId = PRODUCT_IDS[i]
    // Silenciar logs individuales para muchos productos
    const silent = PRODUCT_IDS.length > 50
    const printfiles = await fetchPrintfiles(productId, silent)
    
    if (printfiles) {
      allPrintfiles[productId] = printfiles
      successCount++
    } else {
      failCount++
    }

    // Delay entre requests para respetar rate limits
    if (i < PRODUCT_IDS.length - 1) {
      await delay(DELAY_MS)
    }
    
    // Progress indicator cada 50 productos
    if ((i + 1) % 50 === 0 || i === PRODUCT_IDS.length - 1) {
      const elapsed = Math.round((Date.now() - startTime) / 1000)
      const rate = (i + 1) / elapsed
      const remaining = Math.round((PRODUCT_IDS.length - i - 1) / rate)
      console.log(`📊 Progress: ${i + 1}/${PRODUCT_IDS.length} (${Math.round((i + 1) / PRODUCT_IDS.length * 100)}%) | ✅ ${successCount} | ❌ ${failCount} | ⏱️ ${remaining}s remaining`)
    }
  }

  console.log(`\n📊 Summary:`)
  console.log(`   ✅ Success: ${successCount}`)
  console.log(`   ❌ Failed: ${failCount}`)
  console.log(`   ⏭️  Total processed: ${successCount + failCount}`)

  // Guardar resultado
  const output = {
    fetchedAt: new Date().toISOString(),
    source: 'printful',
    productCount: successCount,
    products: allPrintfiles,
  }

  const outDir = path.resolve(process.cwd(), 'mocks')
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true })
  }

  const outPath = path.join(outDir, 'printful-printfiles.json')
  fs.writeFileSync(outPath, JSON.stringify(output, null, 2), 'utf8')
  
  console.log(`\n💾 Printfiles saved to ${outPath}`)
  console.log(`📁 File size: ${(fs.statSync(outPath).size / 1024).toFixed(2)} KB`)
  console.log('✨ Done!')
}

// Ejecutar
updatePrintfiles().catch((error) => {
  console.error('❌ Fatal error:', error)
  process.exit(1)
})


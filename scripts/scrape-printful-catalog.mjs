import fs from 'fs'
import path from 'path'

const API_BASE = process.env.PRINTFUL_API_SCRAPE_BASE || 'http://localhost:3000/api/printful/products'
const OUTPUT_PATH = path.resolve('mocks', 'printful-catalog-full.json')
const MAX_ID = Number(process.env.PRINTFUL_SCRAPE_MAX_ID ?? 6000)
const MAX_CONSECUTIVE_FAILURES = Number(process.env.PRINTFUL_SCRAPE_MAX_FAILURES ?? 150)
const INITIAL_DELAY_MS = Number(process.env.PRINTFUL_SCRAPE_DELAY_MS ?? 150)
const MAX_DELAY_MS = Number(process.env.PRINTFUL_SCRAPE_MAX_DELAY_MS ?? 60000)

const API_KEY = process.env.PRINTFUL_API_KEY || ''
const STORE_ID = process.env.PRINTFUL_STORE_ID || ''

const SILENT_MODE = process.env.PRINTFUL_SCRAPE_SILENT === '1' || process.argv.includes('--silent')

const log = (...args) => {
  if (!SILENT_MODE) {
    console.log(...args)
  }
}

const warn = (...args) => {
  console.warn(...args)
}


async function pause(ms) {
  if (ms <= 0) return
  await new Promise((resolve) => setTimeout(resolve, ms))
}

async function fetchProduct(id, signal) {
  const headers = {}
  if (API_KEY) {
    headers.Authorization = 'Bearer ' + API_KEY
  }
  if (STORE_ID) {
    headers['X-PF-Store-Id'] = STORE_ID
  }

  let url = API_BASE
  if (!url.endsWith('/')) {
    url += '/'
  }
  url += String(id)

  const response = await fetch(url, { signal, headers })
  const status = response.status

  if (status === 404) {
    return { status }
  }

  if (!response.ok) {
    const text = await response.text().catch(() => '')
    return { status, error: text }
  }

  let data
  try {
    data = await response.json()
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    return { status, error: message }
  }

  const payload = data && typeof data === 'object' && 'result' in data ? data.result : data
  return { status, data: payload }
}

function normalizeProduct(raw, fallbackId) {
  if (!raw || typeof raw !== 'object') {
    return null
  }

  const product = raw && typeof raw.product === 'object' && raw.product !== null ? raw.product : raw

  const idCandidate = raw.productId
    ?? raw.templateId
    ?? product.productId
    ?? product.templateId
    ?? product.id
    ?? product.product_id
    ?? fallbackId

  const id = Number(idCandidate)
  if (!Number.isFinite(id)) {
    return null
  }

  const variants = Array.isArray(raw.variants)
    ? raw.variants
    : Array.isArray(product.variants)
      ? product.variants
      : []

  const name = product.name
    ?? product.title
    ?? [product.brand, product.model ?? product.type]
      .filter((value) => typeof value === 'string' && value.trim().length)
      .join(' ')
    ?? `Producto ${id}`

  const image = product.image
    ?? product.thumbnail
    ?? product.preview
    ?? (Array.isArray(product.images) && product.images.length ? product.images[0]?.url ?? product.images[0] : null)

  return {
    ...product,
    productId: id,
    templateId: Number(product.template_id ?? product.templateId ?? id),
    name,
    image: typeof image === 'string' ? image : null,
    variants,
  }
}

async function scrapeAll() {
  const collected = new Map()
  let consecutiveFailures = 0
  let delayMs = INITIAL_DELAY_MS
  let resetDelayAfterPause = false
  let abortInfo = null

  for (let id = 1; id <= MAX_ID; id += 1) {
    const currentDelay = delayMs
    await pause(currentDelay)
    if (resetDelayAfterPause) {
      delayMs = INITIAL_DELAY_MS
      resetDelayAfterPause = false
    }
    log(`-- intento #${id} (delay ${currentDelay} ms, productos ${collected.size})`)

    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 20000)

    let result
    try {
      result = await fetchProduct(id, controller.signal)
    } catch (error) {
      consecutiveFailures += 1
      delayMs = Math.min(delayMs * 2, MAX_DELAY_MS)
      console.error(`#${id}: fetch error ${error?.message ?? error}`)
      if (consecutiveFailures >= MAX_CONSECUTIVE_FAILURES) {
        abortInfo = { reason: 'consecutive_failures', failures: consecutiveFailures, lastId: Math.max(1, id) }
        break
      }
      id -= 1
      continue
    } finally {
      clearTimeout(timeout)
    }

    const { status, data, error } = result

    if (status === 404) {
      consecutiveFailures += 1
      if (consecutiveFailures >= MAX_CONSECUTIVE_FAILURES) {
        abortInfo = { reason: 'consecutive_failures', failures: consecutiveFailures, lastId: id }
        break
      }
      continue
    }

    if (status === 429 || (status === 502 && error && error.includes('TooManyRequests'))) {
      consecutiveFailures += 1
      delayMs = Math.max(delayMs * 2, 60000)
      resetDelayAfterPause = true
      warn(`#${id}: rate limited (status ${status}). Backing off to ${delayMs} ms`)
      if (consecutiveFailures >= MAX_CONSECUTIVE_FAILURES) {
        abortInfo = { reason: 'consecutive_failures', failures: consecutiveFailures, lastId: Math.max(1, id) }
        break
      }
      id -= 1
      continue
    }

    if (status === 0 || status >= 500) {
      consecutiveFailures += 1
      delayMs = Math.min(delayMs * 2, MAX_DELAY_MS)
      warn(`#${id}: server error ${status} ${error ?? ''}`)
      if (consecutiveFailures >= MAX_CONSECUTIVE_FAILURES) {
        abortInfo = { reason: 'consecutive_failures', failures: consecutiveFailures, lastId: Math.max(1, id) }
        break
      }
      id -= 1
      continue
    }

    if (status >= 400) {
      consecutiveFailures += 1
      warn(`#${id}: client error ${status} ${error ?? ''}`)
      if (consecutiveFailures >= MAX_CONSECUTIVE_FAILURES) {
        abortInfo = { reason: 'consecutive_failures', failures: consecutiveFailures, lastId: id }
        break
      }
      continue
    }

    const normalized = normalizeProduct(data, id)
    if (normalized && !collected.has(normalized.productId)) {
      collected.set(normalized.productId, normalized)
      log(`FOUND productId=${normalized.productId} via attempt #${id}: ${normalized.name ?? 'sin nombre'} (total=${collected.size})`)
    }

    consecutiveFailures = 0
    delayMs = INITIAL_DELAY_MS
  }

  if (abortInfo?.reason === 'consecutive_failures') {
    warn(`Stopped after ${abortInfo.failures} consecutive failures at attempt #${abortInfo.lastId}`)
  }

  const items = Array.from(collected.values()).sort((a, b) => a.productId - b.productId)
  fs.mkdirSync(path.dirname(OUTPUT_PATH), { recursive: true })
  fs.writeFileSync(
    OUTPUT_PATH,
    JSON.stringify({
      fetchedAt: new Date().toISOString(),
      items,
      source: API_BASE,
      maxId: MAX_ID,
      initialDelayMs: INITIAL_DELAY_MS,
    }, null, 2),
    'utf8',
  )
  console.log(`Saved ${items.length} products to ${OUTPUT_PATH}`)
}

scrapeAll().catch((error) => {
  console.error('Fatal error while scraping Printful products', error)
  process.exit(1)
})








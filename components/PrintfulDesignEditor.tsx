'use client'

/* eslint-disable @next/next/no-img-element */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Loader2, RefreshCw, Upload, X, Check, Image as ImageIcon } from 'lucide-react'
import { toast } from 'react-hot-toast'
import { Modal, ModalFooter } from './ui/Modal'
import { calculateOptimalDimensions, ensureSquareQR, validatePosition } from '@/lib/printful-dimensions'
import { getProductName, getProductInfo, getProductCategory, CATEGORY_INFO } from '@/lib/product-names'

// ========================================
// MOCKUP CACHE UTILITIES
// ========================================

const MOCKUP_CACHE_KEY = 'printful_mockup_cache_v1'
const CACHE_TTL_MS = 24 * 60 * 60 * 1000 // 24 horas
const MAX_CACHE_ENTRIES = 50

interface MockupCacheEntry {
  variantId: number
  designHash: string
  mockups: Record<string, string>
  timestamp: number
}

type MockupCache = Record<string, MockupCacheEntry>

/**
 * Calcula un hash simple del dise�o basado en las im�genes por placement
 */
function hashDesign(designsByPlacement: Record<string, string>): string {
  const sorted = Object.keys(designsByPlacement)
    .sort()
    .filter(key => designsByPlacement[key]) // Solo incluir placements con dise�o
  const serialized = sorted.map(key => `${key}:${designsByPlacement[key]}`).join('|')
  
  // Simple base64 hash (para algo m�s robusto, usar crypto.subtle.digest)
  try {
    return btoa(serialized)
  } catch {
    // Fallback para contenido no ASCII
    return serialized
  }
}

/**
 * Obtiene un mockup desde la cach� de localStorage
 */
function getCachedMockup(variantId: number, designHash: string): Record<string, string> | null {
  if (typeof window === 'undefined') return null
  
  try {
    const cacheStr = localStorage.getItem(MOCKUP_CACHE_KEY)
    if (!cacheStr) return null
    
    const cache: MockupCache = JSON.parse(cacheStr)
    const key = `${variantId}_${designHash}`
    const entry = cache[key]
    
    if (!entry) return null
    
    // Verificar TTL
    const isExpired = Date.now() - entry.timestamp > CACHE_TTL_MS
    if (isExpired) {
      // Eliminar entrada expirada
      delete cache[key]
      localStorage.setItem(MOCKUP_CACHE_KEY, JSON.stringify(cache))
      return null
    }
    
    return entry.mockups
  } catch (error) {
    console.error('Error reading mockup cache:', error)
    return null
  }
}

/**
 * Guarda un mockup en la cach� de localStorage
 */
function saveMockupToCache(
  variantId: number,
  designHash: string,
  mockups: Record<string, string>
): void {
  if (typeof window === 'undefined') return
  
  try {
    const cacheStr = localStorage.getItem(MOCKUP_CACHE_KEY) || '{}'
    const cache: MockupCache = JSON.parse(cacheStr)
    const key = `${variantId}_${designHash}`
    
    cache[key] = {
      variantId,
      designHash,
      mockups,
      timestamp: Date.now(),
    }
    
    // Limpiar entradas antiguas si excedemos el l�mite
    const entries = Object.entries(cache)
    if (entries.length > MAX_CACHE_ENTRIES) {
      const sorted = entries.sort((a, b) => b[1].timestamp - a[1].timestamp)
      const cleaned = Object.fromEntries(sorted.slice(0, MAX_CACHE_ENTRIES))
      localStorage.setItem(MOCKUP_CACHE_KEY, JSON.stringify(cleaned))
    } else {
      localStorage.setItem(MOCKUP_CACHE_KEY, JSON.stringify(cache))
    }
  } catch (error) {
    console.error('Error saving mockup cache:', error)
  }
}

// ========================================
// COMPONENT INTERFACES
// ========================================

interface PrintfulDesignEditorProps {
  // Short QR code identifier (e.g., ABC123) used for filenames/DB
  qrCode: string
  // Canonical QR content to encode (e.g., lql.to/ABC123), must match dashboard
  qrContent: string
  onSave: (designData: any) => void
  onClose: () => void
  savedDesignData?: any
}

interface ProductPlacement {
  placement: string
  label: string
  description?: string
  printfileId?: number | null
  position?: {
    top?: number | null
    left?: number | null
    width?: number | null
    height?: number | null
  } | null
  width?: number | null
  height?: number | null
  areaWidth?: number | null
  areaHeight?: number | null
  isConflicting?: boolean
  conflictMessage?: string
}

interface ProductVariant {
  id: number
  size: string
  colorName: string
  colorCode: string
  colorHex?: string | null
  availability?: string | null
  imageUrl?: string | null
}

interface ProductColor {
  name: string
  code: string
  hex?: string | null
  variantIds: number[]
}

interface ProductData {
  productId: number
  templateId: number
  name: string
  brand: string | null
  model: string | null
  type: string | null
  image: string | null
  defaultVariantId: number | null
  sizes: string[]
  variants: ProductVariant[]
  placements: ProductPlacement[]
  colors: ProductColor[]
  source: 'printful'
  message?: string | null
}

interface CatalogPlacementSummary {
  id: string
  label: string
  additionalPrice: number | null
}

interface CatalogVariantSummary {
  id: number
  size: string | null
  color: string | null
  colorCode: string | null
  price: number | null
  image: string | null
  inStock: boolean
  availability: { region: string; status: string }[]
  availableRegions: string[]
}

interface CatalogItem {
  id: number
  name: string
  type: string | null
  brand: string | null
  image: string | null
  placements: CatalogPlacementSummary[]
  variants: CatalogVariantSummary[]
  priceMin: number | null
  priceMax: number | null
  colors: { name: string; code: string | null }[]
  sizes: string[]
  availableRegions: string[]
}

interface CatalogTypeOption {
  value: string
  count: number
}


type DesignsByPlacement = Record<string, string>

type VariantMockups = Record<number, Record<string, { url: string; raw?: any }>>

type VariantMockupsFromApi = Record<string, Record<string, string>>

const DEFAULT_PRODUCT_ID = 71

type DesignMetadata = Record<string, { width: number; height: number }>

const POLL_INTERVAL_MS = 2000
const MAX_POLL_ATTEMPTS = 20

// Dimensiones gen�ricas optimizadas como fallback
const FALLBACK_PLACEMENTS: ProductPlacement[] = [
  {
    placement: 'front',
    label: 'Frente',
    description: '�rea frontal est�ndar (12" � 16" / 30.5 � 40.6 cm)',
    printfileId: null,
    position: { top: 0, left: 0, width: 3600, height: 4800 },
    width: 3600,  // 12 inches @ 300 DPI
    height: 4800, // 16 inches @ 300 DPI
    areaWidth: 3600,
    areaHeight: 4800,
  },
  {
    placement: 'back',
    label: 'Espalda',
    description: '�rea trasera completa (12" � 16" / 30.5 � 40.6 cm)',
    printfileId: null,
    position: { top: 800, left: 0, width: 3600, height: 4000 }, // Ajustado hacia abajo
    width: 3600,
    height: 4000, // Reducido para mejor centrado
    areaWidth: 3600,
    areaHeight: 4800,
  },
  {
    placement: 'sleeve_right',
    label: 'Manga derecha',
    description: '�rea de manga derecha (2.5" � 4.5" / 6.4 � 11.4 cm)',
    printfileId: null,
    position: { top: 0, left: 0, width: 750, height: 1350 },
    width: 750,  // 2.5 inches @ 300 DPI
    height: 1350, // 4.5 inches @ 300 DPI
    areaWidth: 750,
    areaHeight: 1350,
  },
  {
    placement: 'sleeve_left',
    label: 'Manga izquierda',
    description: '�rea de manga izquierda (2.5" � 4.5" / 6.4 � 11.4 cm)',
    printfileId: null,
    position: { top: 0, left: 0, width: 750, height: 1350 },
    width: 750,
    height: 1350,
    areaWidth: 750,
    areaHeight: 1350,
  },
]

function ensureNumber(value: unknown, fallback: number): number {
  if (typeof value === 'number' && !Number.isNaN(value)) {
    return value
  }
  if (typeof value === 'string') {
    const parsed = Number(value)
    if (!Number.isNaN(parsed)) {
      return parsed
    }
  }
  return fallback
}


function normalizePlacementCode(value: unknown): string {
  if (typeof value !== 'string') return ''
  const normalized = value.toLowerCase()
  switch (normalized) {
    case 'default':
    case 'front_default':
    case 'front_default_flat':
    case 'default_front':
    case 'default_front_flat':
      return 'front'
    case 'default_back':
    case 'back_default':
    case 'back_default_flat':
    case 'default_back_flat':
      return 'back'
    case 'left_sleeve':
      return 'sleeve_left'
    case 'right_sleeve':
      return 'sleeve_right'
    default:
      return normalized
  }
}

function normalizePlacements(raw: ProductPlacement[] | undefined | null): ProductPlacement[] {
  if (!raw || !raw.length) {
    return FALLBACK_PLACEMENTS.map((entry) => ({ ...entry }))
  }
  return raw.map((placement) => {
    const position = placement.position || {}
    const width = ensureNumber(position.width, ensureNumber(placement.width, 3600))
    const height = ensureNumber(position.height, ensureNumber(placement.height, 4800))
    const top = ensureNumber(position.top, 0)
    const left = ensureNumber(position.left, 0)
    const areaWidth = ensureNumber((placement as any).areaWidth, width)
    const areaHeight = ensureNumber((placement as any).areaHeight, height)
    return {
      placement: placement.placement,
      label: placement.label || placement.placement,
      printfileId: placement.printfileId ?? null,
      position: { top, left, width, height },
      width,
      height,
      areaWidth,
      areaHeight,
    }
  })
}

function normalizeDesignMetadata(source: any): DesignMetadata {
  if (!source || typeof source !== 'object') {
    return {}
  }
  return Object.entries(source as Record<string, any>).reduce((acc, [placement, value]) => {
    const width = ensureNumber((value as any)?.width, 0)
    const height = ensureNumber((value as any)?.height, 0)
    if (width > 0 && height > 0) {
      acc[placement] = { width, height }
    }
    return acc
  }, {} as DesignMetadata)
}

function loadImageDimensions(url: string): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined') {
      reject(new Error('No se puede calcular el tamano de la imagen en el servidor'))
      return
    }
    const image = new window.Image()
    image.crossOrigin = 'anonymous'
    image.onload = () => {
      const width = image.naturalWidth || image.width
      const height = image.naturalHeight || image.height
      if (!width || !height) {
        reject(new Error('No pudimos leer las dimensiones de la imagen'))
        return
      }
      resolve({ width, height })
    }
    image.onerror = () => {
      reject(new Error('No pudimos cargar la imagen para calcular las dimensiones'))
    }
    image.src = url
  })
}

function normalizeVariantMockups(source: VariantMockupsFromApi | undefined | null): VariantMockups {
  const normalized: VariantMockups = {}
  if (!source) {
    return normalized
  }
  Object.entries(source).forEach(([variantIdKey, placements]) => {
    const numericId = Number(variantIdKey)
    if (Number.isNaN(numericId)) {
      return
    }
    const placementEntries: Record<string, { url: string; raw?: any }> = {}
    Object.entries(placements || {}).forEach(([placement, value]) => {
      if (typeof value === 'string' && value) {
        placementEntries[placement] = { url: value }
      }
    })
    if (Object.keys(placementEntries).length) {
      normalized[numericId] = placementEntries
    }
  })
  return normalized
}

function formatPriceValue(value: number | null | undefined): string | null {
  if (typeof value !== 'number' || Number.isNaN(value)) {
    return null
  }
  return value.toFixed(2)
}

function formatPriceRange(min: number | null | undefined, max: number | null | undefined): string | null {
  const minValue = formatPriceValue(min)
  const maxValue = formatPriceValue(max)
  if (minValue && maxValue) {
    return minValue == maxValue ? minValue : `${minValue} - ${maxValue}`
  }
  return minValue || maxValue
}

function normalizeOptionalString(value: unknown): string | null {
  if (typeof value === 'string') {
    const trimmed = value.trim()
    return trimmed.length ? trimmed : null
  }
  if (typeof value === 'number' && Number.isFinite(value)) {
    return String(value)
  }
  return null
}

function normalizeOptionalNumber(value: unknown): number | null {
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

function normalizeAvailabilityEntries(source: any): { region: string; status: string }[] {
  if (!Array.isArray(source)) {
    return []
  }
  const entries: { region: string; status: string }[] = []
  source.forEach((entry) => {
    const region = normalizeOptionalString(entry?.region)
    const status = normalizeOptionalString(entry?.status)
    if (region && status) {
      entries.push({ region, status })
    }
  })
  return entries
}

function normalizeCatalogVariantSummary(source: any): CatalogVariantSummary | null {
  const id = normalizeOptionalNumber(source?.id)
  if (!id || id <= 0) {
    return null
  }
  const size = normalizeOptionalString(source?.size)
  const color = normalizeOptionalString(source?.color)
  const colorCode = normalizeOptionalString(source?.colorCode)
  const price = normalizeOptionalNumber(source?.price)
  const image = normalizeOptionalString(source?.image)

  const availability = normalizeAvailabilityEntries(source?.availability)
  const availableRegions = Array.isArray(source?.availableRegions)
    ? source.availableRegions
        .map((value: any) => normalizeOptionalString(value))
        .filter((value: any): value is string => Boolean(value))
    : []

  const inStock =
    typeof source?.inStock === 'boolean'
      ? source.inStock
      : availability.some((entry) => entry.status === 'in_stock' || entry.status === 'stocked_on_demand')

  return {
    id,
    size,
    color,
    colorCode,
    price,
    image,
    inStock,
    availability,
    availableRegions,
  }
}

function normalizeCatalogPlacementSummary(source: any): CatalogPlacementSummary | null {
  const id = normalizeOptionalString(source?.id) || normalizeOptionalString(source?.placement)
  const label = normalizeOptionalString(source?.label) || id
  if (!id || !label) {
    return null
  }
  const additionalPrice = normalizeOptionalNumber(source?.additionalPrice)
  return {
    id,
    label,
    additionalPrice,
  }
}

function normalizeCatalogItem(source: any): CatalogItem | null {
  const id = normalizeOptionalNumber(source?.id)
  if (!id || id <= 0) {
    return null
  }
  const name = normalizeOptionalString(source?.name) || `Producto ${id}`
  const type = normalizeOptionalString(source?.type)
  const brand = normalizeOptionalString(source?.brand)
  const image = normalizeOptionalString(source?.image)

  const placements = Array.isArray(source?.placements)
    ? source.placements
        .map((placement: any) => normalizeCatalogPlacementSummary(placement))
        .filter((placement: any): placement is CatalogPlacementSummary => Boolean(placement))
    : []

  const variants = Array.isArray(source?.variants)
    ? source.variants
        .map((variant: any) => normalizeCatalogVariantSummary(variant))
        .filter((variant: any): variant is CatalogVariantSummary => Boolean(variant))
    : []

  const priceMin = normalizeOptionalNumber(source?.priceMin)
  const priceMax = normalizeOptionalNumber(source?.priceMax)

  const colors = Array.isArray(source?.colors)
    ? source.colors
        .map((color: any) => {
          const nameValue = normalizeOptionalString(color?.name)
          const codeValue = normalizeOptionalString(color?.code)
          const safeName = nameValue || codeValue || 'Color'
          if (!safeName) {
            return null
          }
          return {
            name: safeName,
            code: codeValue,
          }
        })
        .filter((color: any): color is { name: string; code: string | null } => Boolean(color))
    : []

  const sizes = Array.isArray(source?.sizes)
    ? source.sizes
        .map((size: any) => normalizeOptionalString(size))
        .filter((size: any): size is string => Boolean(size))
    : []

  const availableRegions = Array.isArray(source?.availableRegions)
    ? source.availableRegions
        .map((region: any) => normalizeOptionalString(region))
        .filter((region: any): region is string => Boolean(region))
    : []

  return {
    id,
    name,
    type,
    brand,
    image,
    placements,
    variants,
    priceMin,
    priceMax,
    colors,
    sizes,
    availableRegions,
  }
}

function normalizeCatalogItems(raw: any): CatalogItem[] {
  if (!Array.isArray(raw)) {
    return []
  }
  return raw
    .map((item) => normalizeCatalogItem(item))
    .filter((item): item is CatalogItem => Boolean(item))
}

function normalizeCatalogTypeOptions(raw: any): CatalogTypeOption[] {
  if (!Array.isArray(raw)) {
    return []
  }
  return raw
    .map((entry) => {
      const value = normalizeOptionalString(entry?.value)
      if (!value) {
        return null
      }
      const count = normalizeOptionalNumber(entry?.count)
      return {
        value: value.toLowerCase(),
        count: typeof count === 'number' && Number.isFinite(count) ? count : 0,
      }
    })
    .filter((option): option is CatalogTypeOption => Boolean(option))
    .sort((a, b) => a.value.localeCompare(b.value))
}

function createPlaceholderCatalogItem({
  id,
  name,
  type,
  brand,
  image,
}: {
  id: number
  name?: string | null
  type?: string | null
  brand?: string | null
  image?: string | null
}): CatalogItem {
  const safeId = Number.isFinite(id) && id > 0 ? id : DEFAULT_PRODUCT_ID
  const safeName = normalizeOptionalString(name) || `Producto ${safeId}`
  const safeType = normalizeOptionalString(type)
  const safeBrand = normalizeOptionalString(brand)
  const safeImage = normalizeOptionalString(image)

  return {
    id: safeId,
    name: safeName,
    type: safeType,
    brand: safeBrand,
    image: safeImage,
    placements: [],
    variants: [],
    priceMin: null,
    priceMax: null,
    colors: [],
    sizes: [],
    availableRegions: [],
  }
}

function buildCatalogItemFromProductData(productData: ProductData | null): CatalogItem | null {
  if (!productData) {
    return null
  }

  const placements = normalizePlacements(productData.placements).map((placement) => ({
    id: placement.placement,
    label: placement.label || placement.placement,
    additionalPrice: null,
  }))

  const variants = productData.variants.map((variant) => ({
    id: variant.id,
    size: variant.size || null,
    color: variant.colorName || null,
    colorCode: variant.colorCode || null,
    price: null,
    image: variant.imageUrl || null,
    inStock: variant.availability ? variant.availability !== 'out_of_stock' : true,
    availability: variant.availability ? [{ region: 'default', status: variant.availability }] : [],
    availableRegions: [],
  }))

  const colors = productData.colors.map((color) => {
    const nameValue = normalizeOptionalString(color.name) || normalizeOptionalString(color.code) || 'Color'
    const codeValue = normalizeOptionalString(color.code)
    return {
      name: nameValue,
      code: codeValue,
    }
  })

  const sizes = productData.sizes
    .map((size) => normalizeOptionalString(size))
    .filter((size): size is string => Boolean(size))

  return {
    id: productData.productId,
    name: productData.name,
    type: productData.type,
    brand: productData.brand,
    image: productData.image,
    placements,
    variants,
    priceMin: null,
    priceMax: null,
    colors,
    sizes,
    availableRegions: [],
  }
}

interface CatalogSelectorProps {
  selectedId: number | null
  onSelect: (productId: number) => void
  fallbackItem?: CatalogItem | null
  className?: string
  autoCollapseOnSelect?: boolean
  confirmedProductId?: number | null
  onConfirmProduct?: (productId: number) => void
}

function CatalogSelector({ selectedId, onSelect, fallbackItem = null, className, autoCollapseOnSelect = true, confirmedProductId, onConfirmProduct }: CatalogSelectorProps) {
  const [items, setItems] = useState<CatalogItem[]>(() => (fallbackItem ? [fallbackItem] : []))
  const [searchTerm, setSearchTerm] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [country, setCountry] = useState<string | null>(null)
  const [fetchedAt, setFetchedAt] = useState<string | null>(null)
  
  // Estados para controlar el flujo de selección
  const [tentativeSelection, setTentativeSelection] = useState<number | null>(null)
  const [confirmedSelection, setConfirmedSelection] = useState<number | null>(selectedId)

  const abortRef = useRef<AbortController | null>(null)
  const fallbackRef = useRef<CatalogItem | null>(fallbackItem)
  const [collapsed, setCollapsed] = useState(() => (autoCollapseOnSelect && selectedId ? selectedId !== DEFAULT_PRODUCT_ID : false))

  useEffect(() => {
    fallbackRef.current = fallbackItem
    if (!fallbackItem) {
      return
    }
    setItems((prev) => {
      const exists = prev.some((item) => item.id === fallbackItem.id)
      if (exists) {
        return prev.map((item) => (item.id === fallbackItem.id ? { ...item, ...fallbackItem } : item))
      }
      return [fallbackItem, ...prev]
    })
  }, [fallbackItem])

  useEffect(() => {
    setConfirmedSelection(selectedId)
  }, [selectedId])

  useEffect(() => {
    if (!autoCollapseOnSelect) {
      return
    }
    if (!selectedId) {
      setCollapsed(false)
    }
  }, [autoCollapseOnSelect, selectedId])

  const fetchCatalog = useCallback(async () => {
    if (abortRef.current) {
      abortRef.current.abort()
    }

    const controller = new AbortController()
    abortRef.current = controller
    setLoading(true)
    setError(null)

    try {
      const timeout = setTimeout(() => controller.abort(), 12000)
      const response = await fetch('/api/printful/products?limit=200', { signal: controller.signal })
      clearTimeout(timeout)
      const data = await response.json()

      if (!response.ok || data?.success === false) {
        throw new Error(data?.error || 'No pudimos obtener el catálogo')
      }

      const normalizedItems = normalizeCatalogItems(Array.isArray(data?.items) ? data.items : data?.products)
      const fallbackValue = fallbackRef.current

      setItems(() => {
        const nextItems = normalizedItems.slice()
        if (fallbackValue) {
          const index = nextItems.findIndex((item) => item.id === fallbackValue.id)
          if (index >= 0) {
            nextItems[index] = { ...nextItems[index], ...fallbackValue }
          } else {
            nextItems.unshift(fallbackValue)
          }
        }
        return nextItems
      })

      const countryValue = normalizeOptionalString(data?.country)
      setCountry(countryValue ? countryValue.toUpperCase() : null)
      setFetchedAt(normalizeOptionalString(data?.fetchedAt))
    } catch (fetchError) {
      if (controller.signal.aborted) {
        return
      }
      const message =
        fetchError instanceof Error && fetchError.name !== 'AbortError'
          ? fetchError.message
          : 'No pudimos obtener el catálogo'
      setError(message)
      toast.error(message)
    } finally {
      if (!controller.signal.aborted) {
        setLoading(false)
      }
    }
  }, [])

  useEffect(() => {
    fetchCatalog()
    return () => {
      if (abortRef.current) {
        abortRef.current.abort()
      }
    }
  }, [fetchCatalog])

  // Lista de productos filtrados para el dropdown (solo por búsqueda)
  const filteredItems = useMemo(() => {
    let list = items
    const trimmedSearch = searchTerm.trim().toLowerCase()
    
    if (trimmedSearch) {
      list = list.filter(item => {
        const translatedName = getProductName(item.id).toLowerCase()
        const category = CATEGORY_INFO[getProductCategory(item.id)].name.toLowerCase()
        const haystack = [
          String(item.id),
          item.name,
          translatedName,
          category,
          item.brand,
          item.type
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase()
        return haystack.includes(trimmedSearch)
      })
    }
    
    return list
  }, [items, searchTerm])

  // Agrupar productos filtrados por categoría
  const productsByCategory = useMemo(() => {
    const grouped = {
      ropa: [] as typeof items,
      hogar: [] as typeof items,
      accesorios: [] as typeof items,
      otros: [] as typeof items
    }
    
    filteredItems.forEach(item => {
      const category = getProductCategory(item.id)
      grouped[category].push(item)
    })
    
    return grouped
  }, [filteredItems])

  const confirmedItem = useMemo(() => {
    // Para opciones de personalización, solo usar confirmedSelection
    const targetId = confirmedSelection || selectedId
    if (!targetId) {
      return null
    }
    return filteredItems.find((item) => item.id === targetId) || items.find((item) => item.id === targetId) || fallbackRef.current
  }, [filteredItems, items, confirmedSelection, selectedId])

  useEffect(() => {
    if (!collapsed) {
      return
    }
    if (!confirmedItem) {
      setCollapsed(false)
    }
  }, [collapsed, confirmedItem])

  const formattedFetchedAt = useMemo(() => {
    if (!fetchedAt) {
      return null
    }
    const timestamp = Date.parse(fetchedAt)
    if (Number.isNaN(timestamp)) {
      return fetchedAt
    }
    try {
      return new Date(timestamp).toLocaleString()
    } catch {
      return fetchedAt
    }
  }, [fetchedAt])


  const handleDropdownSelect = useCallback(
    (productId: string) => {
      const numericValue = Number(productId)
      if (!Number.isFinite(numericValue) || numericValue <= 0) {
        setTentativeSelection(null)
        return
      }
      setTentativeSelection(numericValue)
      
      // Renderizar inmediatamente al seleccionar
      if (autoCollapseOnSelect) {
        setCollapsed(true)
      }
      
      if (numericValue !== selectedId) {
        onSelect(numericValue)
      }
    },
    [autoCollapseOnSelect, onSelect, selectedId],
  )

  const handleConfirmSelection = useCallback(
    () => {
      if (!tentativeSelection) {
        toast.error('Selecciona un producto primero')
        return
      }
      
      // Confirmar la selección final
      setConfirmedSelection(tentativeSelection)
      setTentativeSelection(null)
      
      // Notificar al componente padre para abrir la pantalla completa de edición
      if (onConfirmProduct) {
        onConfirmProduct(tentativeSelection)
      }
    },
    [tentativeSelection, onConfirmProduct],
  )

  const handleSearchChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value)
  }, [])


  const containerClassName = ['rounded-2xl border border-gray-200 bg-white p-4', className].filter(Boolean).join(' ')
  const totalItems = items.length
  const displayCount = filteredItems.length

  const canToggleCatalog = Boolean(selectedId)
  const toggleLabel = collapsed ? 'Cambiar producto' : 'Ocultar catalogo'

  return (
    <div className={containerClassName}>
      <div className="flex items-start justify-between gap-2">
        <div>
          <label className="text-xs font-semibold text-gray-500">Producto</label>
          <p className="text-[11px] text-gray-500">
            {country ? `Region detectada: ${country}` : 'Region predeterminada: ES'}
            {formattedFetchedAt ? ` - Actualizado ${formattedFetchedAt}` : ''}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {canToggleCatalog && (
            <button
              type="button"
              onClick={() => setCollapsed((prev) => !prev)}
              className="inline-flex items-center gap-1 rounded-lg border border-gray-200 px-2 py-1 text-[11px] font-semibold text-gray-600 transition hover:border-gray-300 hover:text-gray-800 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {toggleLabel}
            </button>
          )}
          <button
            type="button"
            onClick={fetchCatalog}
            disabled={loading}
            className="inline-flex items-center gap-1 rounded-lg border border-gray-200 px-2 py-1 text-[11px] font-semibold text-gray-600 transition hover:border-gray-300 hover:text-gray-800 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <RefreshCw className={`h-3 w-3 ${loading ? 'animate-spin text-primary-500' : ''}`} />
            {loading ? 'Actualizando' : 'Actualizar'}
          </button>
        </div>
      </div>

      {!collapsed && (
        <div className="mt-3 space-y-3">
          {/* Filtro de búsqueda */}
          <div>
            <input
              value={searchTerm}
              onChange={handleSearchChange}
              placeholder="Buscar por nombre, marca, categoría o ID"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
            />
          </div>

          {/* Dropdown de productos organizado por categorías */}
          <div>
            <select
              value={tentativeSelection ? String(tentativeSelection) : ''}
              onChange={(e) => handleDropdownSelect(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
            >
              <option value="">
                {filteredItems.length > 0 
                  ? `Selecciona un producto (${filteredItems.length} disponibles)` 
                  : 'No hay productos disponibles'
                }
              </option>
              
              {Object.entries(productsByCategory).map(([category, categoryItems]) => {
                if (categoryItems.length === 0) return null
                const categoryInfo = CATEGORY_INFO[category as keyof typeof CATEGORY_INFO]
                
                return (
                  <optgroup key={category} label={`${categoryInfo.icon} ${categoryInfo.name} (${categoryItems.length})`}>
                    {categoryItems.map(item => {
                      const info = getProductInfo(item.id)
                      return (
                        <option key={item.id} value={item.id}>
                          {info?.emoji || ''} {getProductName(item.id)} · {item.brand || ''}
                        </option>
                      )
                    })}
                  </optgroup>
                )
              })}
            </select>
            <p className="mt-1 text-[11px] text-gray-500">
              Selecciona un producto de la lista organizada por categorías para continuar.
            </p>
          </div>

          {/* Botón de confirmación */}
          {tentativeSelection && !confirmedSelection && (
            <div className="text-center">
            <button
                type="button"
                onClick={handleConfirmSelection}
                className="inline-flex items-center rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
            >
                <Check className="mr-2 h-4 w-4" />
                Confirmar Selección
            </button>
            </div>
          )}

          {/* Botón para cambiar producto */}
          {confirmedSelection && (
            <div className="text-center">
              <button
                type="button"
                onClick={() => {
                  setConfirmedSelection(null)
                  setTentativeSelection(null)
                  setCollapsed(false)
                }}
                className="inline-flex items-center rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
              >
                <RefreshCw className="mr-2 h-4 w-4" />
                Cambiar Producto
              </button>
            </div>
          )}
        </div>
      )}

      {error && <p className="mt-2 text-xs text-orange-600">{error}</p>}

      {confirmedItem && (
        <div className="mt-3 rounded-lg border-2 border-primary-200 bg-white p-4">
          <div className="flex gap-4 items-start">
            {confirmedItem.image && (
              <img 
                src={confirmedItem.image} 
                alt={getProductName(confirmedItem.id)}
                className="w-20 h-20 rounded-lg object-cover border border-gray-200"
              />
            )}
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="text-2xl">{getProductInfo(confirmedItem.id)?.emoji}</span>
                <p className="font-bold text-gray-900 text-base">
                  {getProductName(confirmedItem.id)}
                </p>
              </div>
              <p className="text-sm text-gray-600 mt-1">
                {CATEGORY_INFO[getProductCategory(confirmedItem.id)].name}
                {confirmedItem.brand && ` · ${confirmedItem.brand}`}
              </p>
              <p className="text-xs text-gray-500 mt-1">ID: #{confirmedItem.id}</p>
              {collapsed && (
                <p className="mt-2 text-[11px] text-gray-500">Catálogo oculto. Pulsa el botón Cambiar producto para volver a ver el catálogo.</p>
              )}
            </div>
          </div>
        </div>
      )}

      {loading && items.length === 0 && (
        <div className="mt-4 flex items-center gap-2 text-xs text-gray-500">
              <Loader2 className="h-4 w-4 animate-spin text-primary-500" />
          Cargando catálogo...
            </div>
      )}

      {!loading && filteredItems.length === 0 && !collapsed && (
        <div className="mt-4 rounded-lg border border-dashed border-gray-200 bg-gray-50 p-4 text-center text-sm text-gray-500">
              No encontramos productos con los filtros actuales.
            </div>
      )}
    </div>
  )
}



export function PrintfulDesignEditor({ qrCode, qrContent, onSave, onClose, savedDesignData }: PrintfulDesignEditorProps) {
  const [selectedProductId, setSelectedProductId] = useState<number>(() => {
    const candidate = Number(savedDesignData?.printfulProduct?.productId || savedDesignData?.productId)
    if (Number.isFinite(candidate) && candidate > 0) {
      return candidate
    }
    return DEFAULT_PRODUCT_ID
  })
  const [confirmedProductId, setConfirmedProductId] = useState<number | null>(() => {
    const candidate = Number(savedDesignData?.printfulProduct?.productId || savedDesignData?.productId)
    const variantId = savedDesignData?.printfulProduct?.variantId || savedDesignData?.printful?.variantId
    const hasVariant = Number.isFinite(variantId) && Number(variantId) > 0
    const hasDesigns = !!(savedDesignData?.designsByPlacement &&
      Object.keys(savedDesignData.designsByPlacement).length > 0)

    if (Number.isFinite(candidate) && candidate > 0 && (hasVariant || hasDesigns)) {
      return candidate
    }
    return null // Producto nuevo o inválido, mostrar catálogo
  })
  const [loadingProduct, setLoadingProduct] = useState(true)
  const [productData, setProductData] = useState<ProductData | null>(null)
  const [designsByPlacement, setDesignsByPlacement] = useState<DesignsByPlacement>({})
  const [designMetadata, setDesignMetadata] = useState<DesignMetadata>({})
  const [variantMockups, setVariantMockups] = useState<VariantMockups>({})
  const [selectedVariantId, setSelectedVariantId] = useState<number | null>(null)
  const [selectedSize, setSelectedSize] = useState('')
  const [selectedColorCode, setSelectedColorCode] = useState('')
  const [activePlacement, setActivePlacement] = useState('front')
  const [uploading, setUploading] = useState(false)
  const [qrPlacement, setQrPlacement] = useState<string | null>(null) // Dónde está colocado el QR
  const [qrPlaced, setQrPlaced] = useState(false) // Si el QR ya fue colocado
  const [generatingMockup, setGeneratingMockup] = useState(false)
  const [lastError, setLastError] = useState<string | null>(null)
  const [statusMessage, setStatusMessage] = useState<string | null>(null)
  const pollTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const activeTaskRef = useRef<{ key: string; variantId: number } | null>(null)
  const lastInitializedProductIdRef = useRef<number | null>(null)

  const fallbackCatalogItem = useMemo(() => {
    const fromProductData = buildCatalogItemFromProductData(productData)
    if (fromProductData) {
      return fromProductData
    }

    const id = Number.isFinite(selectedProductId) && selectedProductId > 0 ? selectedProductId : DEFAULT_PRODUCT_ID
    const savedProductDetails =
      (savedDesignData?.printfulProduct as any) || (savedDesignData?.printful?.product as any) || null

    const name = normalizeOptionalString(savedProductDetails?.name) || `Producto ${id}`
    const type = normalizeOptionalString(savedProductDetails?.type)
    const brand = normalizeOptionalString(savedProductDetails?.brand)
    const image = normalizeOptionalString(savedProductDetails?.image)

    return createPlaceholderCatalogItem({
      id,
      name,
      type,
      brand,
      image,
    })
  }, [productData, savedDesignData, selectedProductId])

  const placementList = useMemo(() => {
    const normalized = normalizePlacements(productData?.placements)
    console.log('?? [PrintfulDesignEditor] placementList normalizado:', normalized)
    console.log('?? [PrintfulDesignEditor] Placements con isConflicting:', normalized.filter(p => p.isConflicting))
    return normalized
  }, [productData?.placements])



  const updateDesignMetadata = useCallback((placementKey: string, width: number, height: number) => {
    setDesignMetadata((prev) => {
      const current = prev[placementKey]
      if (current && current.width === width && current.height === height) {
        return prev
      }
      return { ...prev, [placementKey]: { width, height } }
    })
  }, [])

  const ensureDesignMetadata = useCallback((placementKey: string, imageUrl: string) => {
    if (!imageUrl || typeof window === 'undefined') {
      return
    }
    loadImageDimensions(imageUrl)
      .then(({ width, height }) => {
        updateDesignMetadata(placementKey, width, height)
      })
      .catch((error) => {
        console.warn(`[printful] no pudimos calcular las dimensiones para ${placementKey}`, error)
        setDesignMetadata((prev) => {
          const next = { ...prev }
          delete next[placementKey]
          return next
        })
      })
  }, [updateDesignMetadata])

  const selectedVariant = useMemo(() => {
    if (!productData || !selectedVariantId) return null
    return productData.variants.find((variant) => variant.id === selectedVariantId) || null
  }, [productData, selectedVariantId])

  const confirmedItem = useMemo(() => {
    // Para opciones de personalización, solo usar confirmedProductId
    const targetId = confirmedProductId || selectedProductId
    if (!targetId) {
      return null
    }
    return productData
  }, [confirmedProductId, selectedProductId, productData])

  const selectedItem = useMemo(() => {
    // Para renderizar imagen, usar el producto seleccionado actual
    if (!selectedProductId) {
      return null
    }
    return productData ? {
      id: productData.productId,
      name: productData.name,
      brand: productData.brand || '',
      type: productData.type || '',
      image: productData.image || '',
      availableRegions: [],
      sizes: productData.sizes || []
    } : null
  }, [selectedProductId, productData])

  const currentVariantMockups = useMemo(() => {
    if (!selectedVariantId) return {}
    return variantMockups[selectedVariantId] || {}
  }, [variantMockups, selectedVariantId])

  const currentMockupUrl = currentVariantMockups[activePlacement]?.url || null

  const hasAnyDesign = useMemo(() => Object.values(designsByPlacement).some(Boolean), [designsByPlacement])

  const loadProduct = async (productId: number) => {
    setLoadingProduct(true)
    setLastError(null)
    try {
      const response = await fetch(`/api/printful/products/${productId}`)
      const data = await response.json()
      if (!response.ok || data.error) {
        throw new Error(data.error || 'No pudimos obtener el producto')
      }


      const placements = normalizePlacements(Array.isArray(data.placements) ? data.placements : null)

      const normalizedVariants: ProductVariant[] = Array.isArray(data.variants)
        ? data.variants
            .map((variant: any) => ({
              id: Number(variant.id),
              size: String(variant.size || '').toUpperCase(),
              colorName: variant.colorName || variant.color || '',
              colorCode: (variant.colorCode || variant.color || '').toLowerCase(),
              colorHex: variant.colorHex || null,
              availability: variant.availability || null,
              imageUrl: variant.imageUrl || variant.image || null,
            }))
            .filter((variant: any) => !Number.isNaN(variant.id))
        : []

      const normalizedColors: ProductColor[] = Array.isArray(data.colors)
        ? data.colors.map((color: any) => ({
            name: color.name || color.code || '',
            code: (color.code || color.name || '').toLowerCase(),
            hex: color.hex || null,
            variantIds: Array.isArray(color.variantIds)
              ? color.variantIds.map((id: any) => Number(id)).filter((id: number) => !Number.isNaN(id))
              : [],
          }))
        : []

      const sizes: string[] = Array.isArray(data.sizes)
        ? data.sizes.map((size: any) => String(size).toUpperCase())
        : Array.from(new Set(normalizedVariants.map((variant) => variant.size).filter(Boolean)))

      setProductData({
        productId: Number(data.productId || data.templateId || productId),
        templateId: Number(data.templateId || data.productId || productId),
        name: data.name || `Producto ${productId}`,
        brand: data.brand || null,
        model: data.model || null,
        type: data.type || null,
        image: data.image || null,
        defaultVariantId: data.defaultVariantId || (normalizedVariants[0]?.id ?? null),
        sizes,
        variants: normalizedVariants,
        placements,
        colors: normalizedColors,
        source: 'printful',
        message: data.message || null,
      })

      if (data.message) {
        toast(data.message)
      }
    } catch (error) {
      console.error('Error fetching product', error)
      const message = error instanceof Error ? error.message : 'No pudimos cargar los datos del producto. Intenta de nuevo.'
      setLastError(message)
      setProductData(null)
      setStatusMessage(null)
      toast.error(message)
    } finally {
      setLoadingProduct(false)
    }
  }
  useEffect(
    () => () => {
      if (pollTimeoutRef.current) {
        clearTimeout(pollTimeoutRef.current)
      }
    },
    [],
  )

  useEffect(() => {
    // Cargar el producto cuando se selecciona (para mostrar áreas de impresión)
    if (!selectedProductId) {
      return
    }
    loadProduct(selectedProductId)
  }, [selectedProductId])

  useEffect(() => {
    if (!productData) {
      return
    }

    if (lastInitializedProductIdRef.current === productData.productId) {
      return
    }

    const baseDesigns = placementList.reduce((acc, placement) => {
      acc[placement.placement] = ''
      return acc
    }, {} as DesignsByPlacement)

    const savedPrintful = savedDesignData?.printful
    const savedPlacements =
      savedPrintful?.placements || savedDesignData?.designsByPlacement || savedDesignData?.designsBySide || {}
    const savedProductIdCandidate = Number(
      savedPrintful?.productId ??
        savedDesignData?.productId ??
        savedDesignData?.printfulProduct?.productId ??
        Number.NaN,
    )
    const matchesSavedProduct =
      Number.isFinite(savedProductIdCandidate) && savedProductIdCandidate === productData.productId

    const nextDesigns = { ...baseDesigns }
    let qrPlacedFromSaved = false
    let qrPlacementFromSaved: string | null = null

    if (matchesSavedProduct) {
      Object.entries(savedPlacements as Record<string, any>).forEach(([placement, value]) => {
        if (nextDesigns[placement] === undefined) {
          return
        }
        if (typeof value === 'string' && value) {
          nextDesigns[placement] = value
          // Detectar si es un QR (por el nombre del archivo o URL)
          if (value.includes('-qr.png') || value.includes('qr')) {
            qrPlacedFromSaved = true
            qrPlacementFromSaved = placement
          }
          return
        }
        if (value?.imageUrl) {
          nextDesigns[placement] = value.imageUrl
          // Detectar si es un QR
          if (value.imageUrl.includes('-qr.png') || value.imageUrl.includes('qr')) {
            qrPlacedFromSaved = true
            qrPlacementFromSaved = placement
          }
        }
      })
    }

    let nextVariantMockups: VariantMockups = {}
    if (savedDesignData?.variantMockups) {
      nextVariantMockups = normalizeVariantMockups(savedDesignData.variantMockups as VariantMockupsFromApi)
    }
    if (matchesSavedProduct) {
      const savedVariantMockups =
        savedPrintful?.allMockups || savedPrintful?.variantMockups || savedDesignData?.variantMockups
      if (savedVariantMockups) {
        nextVariantMockups = normalizeVariantMockups(savedVariantMockups as VariantMockupsFromApi)
      }
    }

    let nextVariantId: number | null = null
    const savedVariantCandidate = Number(
      savedPrintful?.variantId ?? savedDesignData?.printfulProduct?.variantId ?? Number.NaN,
    )
    if (Number.isFinite(savedVariantCandidate)) {
      const candidate = Number(savedVariantCandidate)
      if (productData.variants.some((variant) => variant.id === candidate)) {
        nextVariantId = candidate
      }
    }

    if (!nextVariantId) {
      nextVariantId = productData.defaultVariantId || productData.variants[0]?.id || null
    }

    const foundVariant = nextVariantId
      ? productData.variants.find((variant) => variant.id === nextVariantId)
      : undefined

    let nextSize = ''
    let nextColorCode = ''
    
    // Priorizar las tallas guardadas en savedDesignData
    if (matchesSavedProduct && savedPrintful?.size) {
      nextSize = savedPrintful.size
    }
    if (matchesSavedProduct && savedPrintful?.colorCode) {
      nextColorCode = savedPrintful.colorCode
    }
    
    // Si no hay tallas guardadas, usar las del variant encontrado
    if (!nextSize && foundVariant) {
      nextSize = foundVariant.size
    }
    if (!nextColorCode && foundVariant) {
      nextColorCode = foundVariant.colorCode
    }
    
    // Fallback a la primera variante
    if (!nextSize && productData.variants[0]) {
      nextVariantId = productData.variants[0].id
      nextSize = productData.variants[0].size
    }
    if (!nextColorCode && productData.variants[0]) {
      nextColorCode = productData.variants[0].colorCode
    }
    
    // �ltimo fallback
    if (!nextSize) {
      nextSize = productData.sizes[0] ?? ''
    }

    const defaultPlacement = placementList.find((placement) => !placement.isConflicting)?.placement
      || placementList[0]?.placement
      || 'front'
    let nextActivePlacement = defaultPlacement
    if (
      matchesSavedProduct &&
      savedPrintful?.activePlacement &&
      nextDesigns[savedPrintful.activePlacement] !== undefined
    ) {
      nextActivePlacement = savedPrintful.activePlacement
    }

    const nextStatus =
      matchesSavedProduct && savedPrintful?.lastMessage
        ? savedPrintful.lastMessage
        : productData.message || null

    const savedMetadata = matchesSavedProduct
      ? normalizeDesignMetadata(
          savedPrintful?.designMetadata ||
            savedDesignData?.designMetadata ||
            savedDesignData?.designMetadataByPlacement,
        )
      : {}

    setDesignsByPlacement(nextDesigns)
    setDesignMetadata(savedMetadata)
    setVariantMockups(nextVariantMockups)
    setSelectedVariantId(nextVariantId)
    setSelectedSize(nextSize)
    setSelectedColorCode(nextColorCode)
    setActivePlacement(nextActivePlacement)
    setStatusMessage(nextStatus)
    
    // Actualizar estados del QR
    setQrPlaced(qrPlacedFromSaved)
    setQrPlacement(qrPlacementFromSaved)

    if (typeof window !== 'undefined') {
      Object.entries(nextDesigns).forEach(([placementKey, url]) => {
        if (!url) {
          return
        }
        if (savedMetadata[placementKey]) {
          return
        }
        ensureDesignMetadata(placementKey, url)
      })
    }

    lastInitializedProductIdRef.current = productData.productId
  }, [ensureDesignMetadata, placementList, productData, savedDesignData])

  const availableSizes = useMemo(() => productData?.sizes || [], [productData])

  const colorOptions = useMemo(() => {
    if (!productData) return []
    return productData.colors.map((color) => {
      const usable = productData.variants.some((variant) => {
        if (variant.colorCode !== color.code) return false
        if (!selectedSize) return true
        return variant.size.toLowerCase() === selectedSize.toLowerCase()
      })
      return { ...color, disabled: !usable }
    })
  }, [productData, selectedSize])

  const handleSizeChange = (size: string) => {
    if (!productData) return
    setSelectedSize(size)
    const nextVariant = productData.variants.find(
      (variant) => variant.size.toLowerCase() === size.toLowerCase() && variant.colorCode === selectedColorCode
    )
    if (nextVariant) {
      setSelectedVariantId(nextVariant.id)
      return
    }
    const fallbackVariant = productData.variants.find((variant) => variant.size.toLowerCase() === size.toLowerCase())
    if (fallbackVariant) {
      setSelectedVariantId(fallbackVariant.id)
      setSelectedColorCode(fallbackVariant.colorCode)
    }
  }

  const handleColorChange = (colorCode: string) => {
    if (!productData) return
    setSelectedColorCode(colorCode)
    const nextVariant = productData.variants.find(
      (variant) => variant.colorCode === colorCode && (!selectedSize || variant.size.toLowerCase() === selectedSize.toLowerCase())
    )
    if (nextVariant) {
      setSelectedVariantId(nextVariant.id)
      setSelectedSize(nextVariant.size)
      return
    }
    const fallbackVariant = productData.variants.find((variant) => variant.colorCode === colorCode)
    if (fallbackVariant) {
      setSelectedVariantId(fallbackVariant.id)
      setSelectedSize(fallbackVariant.size)
    }
  }

  const handleRemoveDesign = (placement: string) => {
    setDesignsByPlacement((prev) => ({ ...prev, [placement]: '' }))
    setDesignMetadata((prev) => {
      if (!prev[placement]) return prev
      const next = { ...prev }
      delete next[placement]
      return next
    })
    if (selectedVariantId) {
      setVariantMockups((prev) => {
        if (!prev[selectedVariantId]) return prev
        const next = { ...prev, [selectedVariantId]: { ...prev[selectedVariantId] } }
        delete next[selectedVariantId][placement]
        return next
      })
    }
    
    // Si se quita el QR, resetear el estado del QR
    if (qrPlacement === placement) {
      setQrPlacement(null)
      setQrPlaced(false)
    }
  }

  const handleProductChange = (value: number) => {
    if (!Number.isFinite(value) || value <= 0 || value === selectedProductId) {
      return
    }

    if (pollTimeoutRef.current) {
      clearTimeout(pollTimeoutRef.current)
      pollTimeoutRef.current = null
    }
    activeTaskRef.current = null
    setGeneratingMockup(false)

    setDesignsByPlacement({})
    setDesignMetadata({})
    setVariantMockups({})
    setSelectedVariantId(null)
    setSelectedSize('')
    setSelectedColorCode('')
    setActivePlacement('front')
    setStatusMessage(null)
    setLastError(null)
    setProductData(null)
    setLoadingProduct(true)
    lastInitializedProductIdRef.current = null
    setSelectedProductId(value)
  }

  const handleQrPlacement = async (placement: string) => {
    if (!productData) return
    
    setUploading(true)
    try {
      // DEBUG: Verificar qué está recibiendo el componente
      console.log('=== QR PLACEMENT DEBUG ===')
      console.log('qrCode prop recibido:', qrCode)
      console.log('qrCode type:', typeof qrCode)
      console.log('qrCode length:', qrCode?.length)
      
      // Generar imagen QR desde el código usando función estándar
      const { generateStandardQR } = await import('@/lib/qr-generator')
      const qrDataUrl = await generateStandardQR(qrContent)
      
      // Convertir data URL a Blob y luego a File
      const qrResponse = await fetch(qrDataUrl)
      const blob = await qrResponse.blob()
      const qrFile = new File([blob], `qr-${qrCode}.png`, { type: 'image/png' })
      
      // Subir el QR como archivo
      const formData = new FormData()
      formData.append('file', qrFile)
      formData.append('code', `${qrCode}-${placement}`)
      formData.append('placement', placement)

      const response = await fetch('/api/design/upload-qr', {
        method: 'POST',
        body: formData,
      })

      const data = await response.json()
      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Error al colocar QR')
      }

      // Establecer dimensiones del QR (asumiendo QR cuadrado)
      const qrSize = 300 // Tamaño fijo para QR
      updateDesignMetadata(placement, qrSize, qrSize)
      
      // Marcar el QR como colocado en esta área
      setDesignsByPlacement((prev) => ({ ...prev, [placement]: data.url }))
      setQrPlacement(placement)
      setQrPlaced(true)
      
      // Limpiar mockups existentes para regenerar con QR
      if (selectedVariantId) {
        setVariantMockups((current) => {
          if (!current[selectedVariantId]) return current
          const next = { ...current, [selectedVariantId]: { ...current[selectedVariantId] } }
          delete next[selectedVariantId][placement]
          return next
        })
      }
      
      toast.success('QR colocado correctamente')
    } catch (error) {
      console.error('[qr-placement] error:', error)
      toast.error('No pudimos colocar el QR. Intenta de nuevo.')
    } finally {
      setUploading(false)
    }
  }

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file || !productData) return
    event.target.value = ''

    if (file.size > 10 * 1024 * 1024) {
      toast.error('La imagen es muy grande (meeex 10MB)')
      return
    }

    if (!file.type.startsWith('image/')) {
      toast.error('Solo aceptamos imeeegenes PNG o JPG')
      return
    }

    setUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('code', `${qrCode}-${activePlacement}`)

      const response = await fetch('/api/design/upload', {
        method: 'POST',
        body: formData,
      })

      const data = await response.json()
      if (!response.ok || !data.success || !data.url) {
        throw new Error(data.error || 'No pudimos subir la imagen')
      }

      let dimensions: { width: number; height: number } | null = null
      try {
        dimensions = await loadImageDimensions(data.url)
        updateDesignMetadata(activePlacement, dimensions.width, dimensions.height)
      } catch (dimensionError) {
        console.warn('[printful] no pudimos medir las dimensiones antes de guardar', dimensionError)
        ensureDesignMetadata(activePlacement, data.url)
      }

      setDesignsByPlacement((prev) => {
        const updated = { ...prev, [activePlacement]: data.url }
        console.log('?? Imagen subida:', activePlacement, data.url)
        console.log('?? designsByPlacement actualizado:', updated)
        return updated
      })
      if (!dimensions) {
        ensureDesignMetadata(activePlacement, data.url)
      }
      if (selectedVariantId) {
        setVariantMockups((prev) => {
          if (!prev[selectedVariantId]) return prev
          const next = { ...prev, [selectedVariantId]: { ...prev[selectedVariantId] } }
          delete next[selectedVariantId][activePlacement]
          return next
        })
      }
      toast.success('Imagen subida correctamente')
    } catch (error) {
      console.error('Error uploading design image', error)
      toast.error('No pudimos subir la imagen. Intenta de nuevo.')
    } finally {
      setUploading(false)
    }
  }

  const buildFilesPayload = () => {
    if (!productData) return []
    return placementList
      .map((placement) => {
        const imageUrl = designsByPlacement[placement.placement]
        if (!imageUrl) return null

        const areaWidth = Math.max(1, ensureNumber(placement.areaWidth, ensureNumber(placement.width, 3600)))
        const areaHeight = Math.max(1, ensureNumber(placement.areaHeight, ensureNumber(placement.height, 4800)))
        const baseTop = ensureNumber(placement.position?.top, 0)
        const baseLeft = ensureNumber(placement.position?.left, 0)

        const metadata = designMetadata[placement.placement]
        const originalWidth = metadata?.width ? Math.max(1, Math.round(metadata.width)) : areaWidth
        const originalHeight = metadata?.height ? Math.max(1, Math.round(metadata.height)) : areaHeight

        const scale = Math.min(areaWidth / originalWidth, areaHeight / originalHeight) || 1
        const targetWidth = Math.max(1, Math.round(originalWidth * scale))
        const targetHeight = Math.max(1, Math.round(originalHeight * scale))

        const offsetLeft = baseLeft + Math.max(0, Math.floor((areaWidth - targetWidth) / 2))
        const offsetTop = baseTop + Math.max(0, Math.floor((areaHeight - targetHeight) / 2))

        return {
          placement: placement.placement,
          imageUrl,
          printfileId: placement.printfileId ?? undefined,
          position: {
            top: offsetTop,
            left: offsetLeft,
            width: targetWidth,
            height: targetHeight,
            areaWidth,
            areaHeight,
          },
        }
      })
      .filter((entry): entry is {
        placement: string
        imageUrl: string
        printfileId: number | undefined
        position: { top: number; left: number; width: number; height: number; areaWidth: number; areaHeight: number }
      } => Boolean(entry))
  }
  const pollMockupStatus = async (requestId: string, variantId: number, attempt: number) => {
    if (attempt > MAX_POLL_ATTEMPTS) {
      setGeneratingMockup(false)
      activeTaskRef.current = null
      toast.error('El proceso tardeee demasiado. Intenta de nuevo en unos minutos.')
      return
    }

    try {
      const response = await fetch(`/api/printful/mockup?requestId=${encodeURIComponent(requestId)}`)
      const data = await response.json()
      if (!response.ok || !data.success) {
        throw new Error(data.error || 'No pudimos consultar el estado del mockup')
      }

      if (data.status === 'completed') {
        const normalized = Array.isArray(data.normalizedMockups) ? data.normalizedMockups : []
        const rawMockups = Array.isArray(data.mockups) ? data.mockups : []
        setVariantMockups((prev) => {
          const next = { ...prev }
          const placementsForVariant = { ...(next[variantId] || {}) }
          normalized.forEach((item: any) => {
            if (!item?.placement || !item?.url) {
              return
            }

            const placementKey = normalizePlacementCode(item.placement)
            if (!placementKey) {
              return
            }

            const matchesVariant = Number.isNaN(item.variantId) || item.variantId === variantId
            if (!matchesVariant) {
              return
            }

            const rawEntry = (
              rawMockups.find((mock: any) => {
                const placementMatch =
                  normalizePlacementCode(mock?.placement || mock?.print_area || mock?.printPlacement) === placementKey
                if (!placementMatch) {
                  return false
                }
                if (Number.isNaN(item.variantId)) {
                  return true
                }
                if (Array.isArray(mock.variant_ids)) {
                  return mock.variant_ids.some((id: any) => Number(id) === variantId)
                }
                const numeric = Number(mock.variant_id ?? mock.variantId)
                return !Number.isNaN(numeric) && numeric === variantId
              })
            ) ||
              rawMockups.find(
                (mock: any) =>
                  normalizePlacementCode(mock?.placement || mock?.print_area || mock?.printPlacement) === placementKey,
              )

            placementsForVariant[placementKey] = { url: item.url, raw: rawEntry }
          })
          next[variantId] = placementsForVariant
          
          // GUARDAR EN CACHÉ el mockup recién generado
          const currentHash = hashDesign(designsByPlacement)
          const mockupsForCache: Record<string, string> = {}
          Object.entries(placementsForVariant).forEach(([placement, data]) => {
            if (data?.url) {
              mockupsForCache[placement] = data.url
            }
          })
          saveMockupToCache(variantId, currentHash, mockupsForCache)
          console.log('✅ Mockup saved to cache for variant', variantId)
          
          return next
        })
        setGeneratingMockup(false)
        activeTaskRef.current = null
        setStatusMessage(data.message || 'Mockup generado con éxito')
        toast.success('Mockup generado con éxito', { id: 'mockup-generation' })
        return
      }

      if (data.status === 'failed') {
        setGeneratingMockup(false)
        activeTaskRef.current = null
        setStatusMessage(data.message || 'No se pudo generar el mockup')
        toast.error('No se pudo generar el mockup. Revisa los archivos y vuelve a intentarlo.')
        return
      }

      pollTimeoutRef.current = setTimeout(() => pollMockupStatus(requestId, variantId, attempt + 1), POLL_INTERVAL_MS)
    } catch (error) {
      console.error('Error polling Printful mockup', error)
      setGeneratingMockup(false)
      activeTaskRef.current = null
      toast.error('Error al consultar el estado del mockup')
    }
  }

  const handleSave = async () => {
    if (!productData) return
    
    // NUEVA VALIDACIÓN: QR obligatorio
    if (!qrPlaced) {
      toast.error('❌ Debes colocar el QR en al menos una área del producto')
      return
    }
    
    // Verificar que hay al menos un diseño (puede ser solo QR)
    const hasDesigns = Object.values(designsByPlacement).some(Boolean)
    if (!hasDesigns) {
      toast.error('No hay diseños para guardar')
      return
    }

    // Verificar que hay una variante seleccionada
    if (!selectedVariantId) {
      toast.error('Debes seleccionar una talla y color')
      return
    }

    // PRIMERO: Generar el mockup si no existe o no está actualizado
    const designHash = hashDesign(designsByPlacement)
    const cachedMockup = getCachedMockup(selectedVariantId, designHash)
    
    let finalMockups = variantMockups
    
    // Si no hay mockup en caché o está desactualizado, generar uno nuevo
    if (!cachedMockup || Object.keys(cachedMockup).length === 0) {
      toast.loading('Generando mockup oficial de Printful...', { id: 'mockup-save' })
      
      try {
        // Generar mockup y esperar a que termine
        const mockups = await generateMockupAndWait()
        if (mockups) {
          finalMockups = mockups
          toast.success('¡Mockup generado con éxito!', { id: 'mockup-save' })
        } else {
          toast.dismiss('mockup-save')
          toast('No se pudo generar el mockup, pero el diseño se guardará', { icon: '⚠️' })
        }
      } catch (error) {
        console.error('Error generando mockup:', error)
        toast.dismiss('mockup-save')
        toast('Error al generar mockup, pero el diseño se guardará', { icon: '⚠️' })
      }
    } else {
      // Usar mockup de caché
      finalMockups = {
        ...variantMockups,
        [selectedVariantId]: Object.fromEntries(
          Object.entries(cachedMockup).map(([placement, url]) => [placement, { url }])
        )
      }
      console.log('📦 Usando mockup de caché')
    }

    // SEGUNDO: Guardar el diseño con el mockup incluido
    const payload = {
      editorType: 'printful',
      qrCode,
      savedAt: new Date().toISOString(),
      designsByPlacement,
      designMetadata,
      variantMockups: finalMockups,
      selectedVariantId,
      productId: productData.productId,
      slug: String(selectedProductId),
      productName: productData.name,
      printfulProduct: {
        productId: productData.productId,
        templateId: productData.templateId,
        name: productData.name,
        variantId: selectedVariantId,
      },
      printful: {
        productId: productData.productId,
        templateId: productData.templateId,
        productName: productData.name,
        source: productData.source,
        variantId: selectedVariantId,
        size: selectedVariant?.size || selectedSize || null,
        color: selectedVariant?.colorName || null,
        colorCode: selectedVariant?.colorCode || selectedColorCode || null,
        placements: Object.fromEntries(
          Object.entries(designsByPlacement).map(([placement, url]) => [placement, { imageUrl: url || null }])
        ),
        designMetadata,
        variantMockups: finalMockups,
        activePlacement,
        lastMessage: statusMessage,
      },
    }

    console.log('💾 [PrintfulDesignEditor] Guardando diseño con mockups:', finalMockups)
    console.log('💾 [PrintfulDesignEditor] Payload completo:', JSON.stringify(payload, null, 2))
    
    // Guardar el diseño
    await onSave(payload)
    
    toast.success('✅ Diseno guardado con éxito')
    setStatusMessage('Diseno guardado correctamente')
  }
  
  // Nueva función que genera mockup y espera a que termine (retorna Promise)
  const generateMockupAndWait = async (): Promise<VariantMockups | null> => {
    if (!productData || !selectedVariantId) {
      return null
    }
    
    // Construir payload para generar mockup
    const files = buildFilesPayload()
    if (files.length === 0) {
      return null
    }
    
    try {
      // Iniciar tarea de mockup
      const response = await fetch('/api/printful/mockup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: productData.productId,
          variantIds: [selectedVariantId],
          files,
        }),
      })
      
      const data = await response.json()
      
      if (!response.ok || !data.success) {
        throw new Error(data.error || 'No pudimos iniciar la generación del mockup')
      }
      
      const requestId = data.requestId
      console.log('🎨 Mockup task iniciado:', requestId)
      
      // Polling con Promise
      const maxAttempts = 30 // 30 intentos = 1 minuto
      const pollInterval = 2000 // 2 segundos
      
      for (let attempt = 0; attempt < maxAttempts; attempt++) {
        await new Promise(resolve => setTimeout(resolve, pollInterval))
        
        const statusResponse = await fetch(`/api/printful/mockup?requestId=${encodeURIComponent(requestId)}`)
        const statusData = await statusResponse.json()
        
        if (!statusResponse.ok || !statusData.success) {
          continue
        }
        
        if (statusData.status === 'completed') {
          const normalized = Array.isArray(statusData.normalizedMockups) ? statusData.normalizedMockups : []
          const rawMockups = Array.isArray(statusData.mockups) ? statusData.mockups : []
          
          const placementsForVariant: Record<string, { url: string; raw?: any }> = {}
          
          normalized.forEach((item: any) => {
            if (!item?.placement || !item?.url) {
              return
            }

            const placementKey = normalizePlacementCode(item.placement)
            if (!placementKey) {
              return
            }

            const matchesVariant = Number.isNaN(item.variantId) || item.variantId === selectedVariantId
            if (!matchesVariant) {
              return
            }

            const rawEntry = rawMockups.find((mock: any) => {
              const placementMatch =
                normalizePlacementCode(mock?.placement || mock?.print_area || mock?.printPlacement) === placementKey
              if (!placementMatch) {
                return false
              }
              if (Number.isNaN(item.variantId)) {
                return true
              }
              if (Array.isArray(mock.variant_ids)) {
                return mock.variant_ids.some((id: any) => Number(id) === selectedVariantId)
              }
              const numeric = Number(mock.variant_id ?? mock.variantId)
              return !Number.isNaN(numeric) && numeric === selectedVariantId
            })

            placementsForVariant[placementKey] = { url: item.url, raw: rawEntry }
          })
          
          // Guardar en caché
          const currentHash = hashDesign(designsByPlacement)
          const mockupsForCache: Record<string, string> = {}
          Object.entries(placementsForVariant).forEach(([placement, data]) => {
            if (data?.url) {
              mockupsForCache[placement] = data.url
            }
          })
          saveMockupToCache(selectedVariantId, currentHash, mockupsForCache)
          console.log('✅ Mockup generado y guardado en caché')
          
          // Actualizar el estado
          const updatedMockups = {
            ...variantMockups,
            [selectedVariantId]: placementsForVariant
          }
          setVariantMockups(updatedMockups)
          
          return updatedMockups
        }
        
        if (statusData.status === 'failed') {
          console.error('❌ Mockup generation failed')
          return null
        }
      }
      
      // Timeout
      console.error('⏱️ Mockup generation timeout')
      return null
      
    } catch (error) {
      console.error('Error generating mockup:', error)
      return null
    }
  }

  const handleGenerateMockup = async () => {
    if (!productData || !selectedVariantId) {
      toast.error('Selecciona una talla y color para generar el mockup')
      return
    }
    
    // Verificar si ya existe en caché
    const designHash = hashDesign(designsByPlacement)
    const cachedMockup = getCachedMockup(selectedVariantId, designHash)
    
    if (cachedMockup && Object.keys(cachedMockup).length > 0) {
      console.log('📦 Mockup encontrado en caché')
      setVariantMockups((prev) => ({
        ...prev,
        [selectedVariantId]: Object.fromEntries(
          Object.entries(cachedMockup).map(([placement, url]) => [placement, { url }])
        )
      }))
      setStatusMessage('Mockup cargado desde caché')
      toast.success('¡Mockup listo! (desde caché)')
      return
    }
    
    // Construir payload para generar mockup
    const files = buildFilesPayload()
    if (files.length === 0) {
      toast.error('No hay diseños para generar mockup')
      return
    }
    
    const mockupTaskKey = `mockup_${selectedVariantId}_${Date.now()}`
    activeTaskRef.current = { key: mockupTaskKey, variantId: selectedVariantId }
    setGeneratingMockup(true)
    setStatusMessage('Generando mockup...')
    toast.loading('Generando mockup oficial de Printful...', { id: 'mockup-generation' })
    
    try {
      const response = await fetch('/api/printful/mockup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: productData.productId,
          variantIds: [selectedVariantId],
          files,
        }),
      })
      
      const data = await response.json()
      
      if (!response.ok || !data.success) {
        throw new Error(data.error || 'No pudimos iniciar la generación del mockup')
      }
      
      const requestId = data.requestId
      console.log('🎨 Mockup task iniciado:', requestId)
      
      // Iniciar polling
      pollMockupStatus(requestId, selectedVariantId, 1)
      
    } catch (error) {
      console.error('Error generating mockup:', error)
      setGeneratingMockup(false)
      activeTaskRef.current = null
      toast.error('No pudimos generar el mockup. El diseño está guardado.', { id: 'mockup-generation' })
      setStatusMessage('Diseno guardado (mockup no disponible)')
    }
  }

  return (
    <Modal
      isOpen={true}
      onClose={() => {
        if (generatingMockup) {
          toast.error('Espera a que termine la generación del mockup')
          return
        }
        onClose()
      }}
      title={productData?.name || 'Diseñador de Producto'}
      description={`QR: ${qrCode}`}
      size="7xl"
      fullHeight={true}
      closeOnBackdrop={false}
      closeOnEscape={false}
    >
      <div className="space-y-6">
        {/* Header compacto - menos prominente */}
        <div className="flex items-center justify-between rounded-lg bg-gray-50 p-3">
          <div>
            <h3 className="text-sm font-semibold text-gray-900">{productData?.name || 'Producto'}</h3>
            <p className="text-xs text-gray-500">QR: {qrCode}</p>
          </div>
          <div className="text-right">
            {statusMessage && <p className="text-xs text-blue-600">{statusMessage}</p>}
            {lastError && <p className="text-xs text-red-500">{lastError}</p>}
          </div>
        </div>

        {/* �REAS DE IMPRESI�N - LO M�S PROMINENTE */}
        {/* CATALOG SELECTOR - Cuando no hay producto confirmado */}
        {!confirmedProductId && (
          <div className="space-y-4">
            <div className="text-center">
              <h2 className="text-xl font-bold text-gray-900 mb-2">Selecciona un producto</h2>
              <p className="text-sm text-gray-600">Elige el producto que quieres personalizar</p>
            </div>
            <CatalogSelector
              selectedId={selectedProductId}
              onSelect={setSelectedProductId}
              fallbackItem={fallbackCatalogItem}
              className="w-full"
              autoCollapseOnSelect={false}
              confirmedProductId={confirmedProductId}
              onConfirmProduct={(productId) => {
                // Al confirmar el producto, automáticamente abrir la pantalla completa de edición
                setConfirmedProductId(productId)
                setSelectedProductId(productId)
              }}
            />
          </div>
        )}

        {/* ÁREAS DE IMPRESIÓN - Solo cuando hay producto confirmado */}
        {confirmedProductId && selectedItem && (
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-xl font-bold text-gray-900 mb-2">Selecciona d�nde colocar tu dise�o</h2>
              <p className="text-sm text-gray-600">Haz clic en el �rea donde quieres colocar tu imagen o QR</p>
            </div>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              {placementList.map((placement) => {
                const isActive = activePlacement === placement.placement
                const hasMockup = Boolean(currentVariantMockups[placement.placement])
                const hasDesign = Boolean(designsByPlacement[placement.placement])
                const isConflicting = placement.isConflicting || false
                
                return (
                  <div key={placement.placement} className="relative group">
                    <button
                      onClick={() => !isConflicting && setActivePlacement(placement.placement)}
                      disabled={isConflicting}
                      className={`min-h-[44px] rounded-full border px-4 py-2 text-xs font-semibold transition touch-manipulation relative ${
                        isConflicting 
                          ? 'border-gray-300 bg-gray-100 text-gray-400 cursor-not-allowed opacity-60'
                          : isActive 
                            ? 'border-primary-500 bg-primary-50 text-primary-600' 
                            : 'border-gray-200 text-gray-700 hover:border-gray-300'
                      }`}
                    >
                      {placement.label}
                      {isConflicting && (
                        <span className="ml-1 text-xs text-red-500">??</span>
                      )}
                      {hasMockup && !isConflicting && <Check className="ml-2 inline h-3 w-3 text-green-500" />}
                      {!hasMockup && hasDesign && !isConflicting && (
                        <span className="ml-2 inline-block h-2 w-2 rounded-full bg-amber-400" />
                      )}
                    </button>
                    {/* Tooltip Helper */}
                    <div className="invisible group-hover:visible opacity-0 group-hover:opacity-100 transition-opacity absolute z-50 bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 text-xs text-white bg-gray-900 rounded-lg shadow-lg whitespace-nowrap pointer-events-none">
                      {isConflicting ? placement.conflictMessage : placement.description || placement.label}
                      <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-px border-4 border-transparent border-t-gray-900"></div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {confirmedItem && (
          <div className="space-y-4">
            <div className="rounded-2xl border border-gray-200 bg-white p-4">
              <label className="block text-xs font-semibold text-gray-500">Talla</label>
              <select
                value={selectedSize}
                onChange={(event) => handleSizeChange(event.target.value)}
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
              >
                <option value="">Selecciona una talla</option>
                {availableSizes.map((size) => (
                  <option key={size} value={size}>
                    {size}
                  </option>
                ))}
              </select>

              <label className="mt-4 block text-xs font-semibold text-gray-500">Color</label>
              <select
                value={selectedColorCode}
                onChange={(event) => handleColorChange(event.target.value)}
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
              >
                <option value="">Selecciona un color</option>
                {colorOptions.map((color) => (
                  <option key={color.code} value={color.code} disabled={color.disabled}>
                    {color.name}
                    {color.disabled ? ' (no disponible en esta talla)' : ''}
                  </option>
                ))}
              </select>

              {selectedVariant && (
                <div className="mt-4 rounded-lg bg-gray-50 p-3 text-xs text-gray-600">
                  <p>
                    Variante: <span className="font-semibold text-gray-900">{selectedVariant.id}</span>
                  </p>
                  <p>
                    Seleccieeen: <span className="font-semibold text-gray-900">{selectedVariant.size}</span> /{' '}
                    <span className="font-semibold text-gray-900">{selectedVariant.colorName}</span>
                  </p>
                </div>
              )}
            </div>

            <div className="rounded-2xl border border-gray-200 bg-white p-4">
              <p className="text-sm font-semibold text-gray-900">
                Diseeeeo para {placementList.find((item) => item.placement === activePlacement)?.label || activePlacement}
              </p>
              {designsByPlacement[activePlacement] ? (
                <div className="mt-3 space-y-2 rounded-lg bg-green-50 p-3 text-xs text-green-700">
                  <p className="font-semibold">
                    {qrPlacement === activePlacement ? 'QR colocado' : 'Diseeeeo cargado'}
                  </p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleRemoveDesign(activePlacement)}
                      className="inline-flex items-center gap-2 rounded-full border border-red-200 px-3 py-1 text-xs font-semibold text-red-600"
                    >
                      Quitar
                    </button>
                  </div>
                  <p className="text-xs text-gray-500">
                    El mockup se generar� autom�ticamente al guardar el dise�o.
                  </p>
                </div>
              ) : (
                <div className="mt-3 space-y-3">
                  {/* Botón para colocar QR */}
                  {!qrPlaced && (
                    <button
                      onClick={() => handleQrPlacement(activePlacement)}
                      disabled={uploading}
                      className="w-full rounded-lg border-2 border-dashed border-blue-300 bg-blue-50 p-4 text-center text-sm font-semibold text-blue-700 transition hover:bg-blue-100 disabled:opacity-50"
                    >
                      {uploading ? (
                        <>
                          <Loader2 className="mx-auto h-6 w-6 animate-spin" />
                          Colocando QR...
                        </>
                      ) : (
                        <>
                          📱 Colocar QR aquí
                        </>
                      )}
                    </button>
                  )}
                  
                  {/* Opción para subir imagen (solo si QR ya está colocado) */}
                  {qrPlaced && (
                    <label className="flex cursor-pointer flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-gray-300 bg-gray-50 p-6 text-center text-sm text-gray-600">
                      <input type="file" accept="image/png,image/jpeg" className="hidden" onChange={handleImageUpload} disabled={uploading} />
                      {uploading ? (
                        <>
                          <Loader2 className="h-6 w-6 animate-spin text-primary-500" />
                          Subiendo imagen...
                        </>
                      ) : (
                        <>
                          <Upload className="h-6 w-6 text-primary-400" />
                          Click para subir imagen adicional
                        </>
                      )}
                    </label>
                  )}
                  
                </div>
              )}
            </div>

            <div className="rounded-2xl border border-gray-200 bg-white p-4 text-sm text-gray-600">
              <p>
                Dise�os cargados:{' '}
                <span className="font-semibold text-gray-900">{Object.values(designsByPlacement).filter(Boolean).length}</span>{' '}/ {placementList.length}
              </p>
              <p>
                Mockups disponibles:{' '}
                <span className="font-semibold text-gray-900">{Object.keys(currentVariantMockups).length}</span>
              </p>
            </div>
          </div>
          )}
      </div>

      {/* Footer con botones sticky */}
      <ModalFooter className="sticky bottom-0 bg-white border-t border-gray-200">
        <div className="flex flex-col sm:flex-row gap-3 w-full">
          <button
            onClick={onClose}
            className="w-full sm:w-auto min-h-[44px] rounded-full border border-gray-200 px-4 py-2 font-semibold text-gray-700 transition hover:border-gray-300 touch-manipulation"
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            disabled={generatingMockup || uploading}
            className="w-full sm:flex-1 min-h-[44px] rounded-full bg-primary-600 px-4 py-2 font-semibold text-white transition hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-50 touch-manipulation flex items-center justify-center gap-2"
          >
            {'Guardar diseno y generar mockup'}
          </button>
        </div>
      </ModalFooter>
    </Modal>
  )
}
























'use client'

import { useEffect, useMemo, useState } from 'react'
import { Loader2 } from 'lucide-react'
import { Modal, ModalFooter } from './ui/Modal'

export interface ProductSelectionResult {
  productId: number
  templateId: number
  defaultVariantId?: number
  defaultSize?: string
  defaultColor?: string
  defaultColorCode?: string
  name: string
}

interface ProductSelectionModalProps {
  isOpen: boolean
  onClose: () => void
  onSelect: (result: ProductSelectionResult) => void
}

type ProductCategory = 'ropa' | 'accesorios' | 'hogar' | 'otros'

interface CatalogVariant {
  id: number
  size: string | null
  color: string | null
  colorCode: string | null
  price: number | null
  matchedRegion: string | null
}

interface CatalogProduct {
  id: number
  templateId?: number | null
  name: string
  type: string | null
  brand: string | null
  image: string | null
  placements: Array<{ id: string; label: string }>
  variants: CatalogVariant[]
  priceMin: number | null
  priceMax: number | null
}

interface CatalogResponse {
  success?: boolean
  total?: number
  items?: CatalogProduct[]
  products?: CatalogProduct[]
  paging?: { limit: number; offset: number }
}

interface ProductOption {
  id: number
  templateId: number
  name: string
  brand: string | null
  type: string | null
  image: string | null
  category: ProductCategory
  priceMin: number | null
  priceMax: number | null
  variants: CatalogVariant[]
  variantCount: number
  placements: string[]
  searchText: string
}

const CATEGORY_CONFIG: Record<ProductCategory, { label: string; description: string; marker: string }> = {
  ropa: { label: 'Ropa', description: 'Camisetas, sudaderas y prendas', marker: '[R]' },
  accesorios: { label: 'Accesorios', description: 'Gorras, bolsas, fundas y mas', marker: '[A]' },
  hogar: { label: 'Hogar y deco', description: 'Posters, tazas, textiles y decoracion', marker: '[H]' },
  otros: { label: 'Otros', description: 'Productos especiales y personalizados', marker: '[*]' },
}

const CATEGORY_ORDER: ProductCategory[] = ['ropa', 'accesorios', 'hogar', 'otros']

const REGION_LABELS: Record<string, string> = {
  US: 'EEUU',
  EU: 'Europa',
  EU_ES: 'Espana',
  EU_LV: 'Letonia',
  CA: 'Canada',
  UK: 'Reino Unido',
  AU: 'Australia',
  JP: 'Japon',
  MX: 'Mexico',
}

const PRICE_SEPARATOR = ' | '

function resolveCategory(product: CatalogProduct): ProductCategory {
  const haystack = [product.type, product.name, product.brand].filter(Boolean).join(' ').toLowerCase()

  const apparelKeywords = /(shirt|tee|hoodie|sweatshirt|tank|legging|dress|skirt|jacket|coat|pants|sock|short|swim|bra|sports|apparel|cut-sew|dtfilm|knitwear|bodysuit|onesie|jogger|yoga|vest|crewneck)/
  if (apparelKeywords.test(haystack)) {
    return 'ropa'
  }

  const accessoriesKeywords = /(hat|cap|beanie|snapback|bucket|visor|bag|tote|backpack|duffel|phone|case|bandana|scrunchie|wallet|keychain|mask|apron|belt|fanny|sleeve|gloves|earrings|necklace|flip flop)/
  if (accessoriesKeywords.test(haystack)) {
    return 'accesorios'
  }

  const homeKeywords = /(poster|canvas|pillow|blanket|towel|mug|cup|drink|coaster|mat|flag|candle|sticker|notebook|journal|calendar|puzzle|art|wall|kitchen|deco|taza|libreta|tapete|alfombra|banner|subli)/
  if (homeKeywords.test(haystack)) {
    return 'hogar'
  }

  return 'otros'
}

function formatPrice(value: number | null): string | null {
  if (value === null || Number.isNaN(value)) {
    return null
  }
  if (USD_FORMATTER) {
    return USD_FORMATTER.format(value)
  }
  return `USD ${value.toFixed(2)}`
}

function formatPriceRange(min: number | null, max: number | null): string {
  const formattedMin = formatPrice(min)
  const formattedMax = formatPrice(max)

  if (formattedMin && formattedMax) {
    if (Math.abs(Number(min) - Number(max)) < 0.01) {
      return formattedMin
    }
    return `${formattedMin} - ${formattedMax}`
  }
  if (formattedMin) {
    return `Desde ${formattedMin}`
  }
  if (formattedMax) {
    return `Hasta ${formattedMax}`
  }
  return 'Precio no disponible'
}

function normalizeVariants(raw: CatalogProduct['variants']): CatalogVariant[] {
  return raw.map((variant) => ({
    id: variant.id,
    size: variant.size,
    color: variant.color,
    colorCode: variant.colorCode || (variant as any).color_code || null,
    price: typeof variant.price === 'number'
      ? variant.price
      : Number.isFinite(Number.parseFloat(String(variant.price)))
        ? Number.parseFloat(String(variant.price))
        : null,
    matchedRegion: variant.matchedRegion || null,
  }))
}

function buildOption(product: CatalogProduct): ProductOption {
  const category = resolveCategory(product)
  const variants = normalizeVariants(product.variants)
  const placements = product.placements?.map((placement) => placement.label || placement.id) || []

  const searchChunks = [
    product.name,
    product.brand,
    product.type,
    category,
    placements.join(' '),
    variants.map((variant) => `${variant.color || ''} ${variant.size || ''}`).join(' '),
  ]

  const templateId = Number(product.templateId || product.id)

  return {
    id: Number(product.id),
    templateId: templateId > 0 ? templateId : Number(product.id),
    name: product.name,
    brand: product.brand,
    type: product.type,
    image: product.image,
    category,
    priceMin: product.priceMin,
    priceMax: product.priceMax,
    variants,
    variantCount: variants.length,
    placements,
    searchText: searchChunks.filter(Boolean).join(' ').toLowerCase(),
  }
}

function getVariantLabel(variant: CatalogVariant): string {
  const parts: string[] = []
  if (variant.color) parts.push(variant.color)
  if (variant.size) parts.push(variant.size)
  if (!parts.length) parts.push('Variante estandar')

  if (variant.matchedRegion) {
    const label = REGION_LABELS[variant.matchedRegion] || variant.matchedRegion
    parts.push(`Region ${label}`)
  }

  return parts.join(PRICE_SEPARATOR)
}

async function fetchCatalog(signal: AbortSignal): Promise<ProductOption[]> {
  const collected: ProductOption[] = []
  let offset = 0
  const limit = 200
  let total = Infinity

  while (offset < total) {
    const response = await fetch(`/api/printful/products?limit=${limit}&offset=${offset}`, { signal })
    if (!response.ok) {
      throw new Error('No se pudo cargar el catalogo')
    }

    const payload = (await response.json()) as CatalogResponse
    const items = payload.items || payload.products || []

    items.forEach((item) => {
      collected.push(buildOption(item))
    })

    const pageCount = items.length
    if (typeof payload.total === 'number') {
      total = payload.total
    }
    offset += pageCount

    if (pageCount < limit) {
      break
    }
  }

  return collected
}

export function ProductSelectionModal({ isOpen, onClose, onSelect }: ProductSelectionModalProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [options, setOptions] = useState<ProductOption[]>([])
  const [hasLoaded, setHasLoaded] = useState(false)
  const [search, setSearch] = useState('')
  const [activeOptionId, setActiveOptionId] = useState<number | null>(null)
  const [selectedVariantId, setSelectedVariantId] = useState<number | null>(null)

  useEffect(() => {
    if (!isOpen || hasLoaded) {
      return
    }

    const controller = new AbortController()
    setLoading(true)
    setError(null)

    fetchCatalog(controller.signal)
      .then((items) => {
        setOptions(items)
        setHasLoaded(true)
      })
      .catch((err) => {
        if (err.name !== 'AbortError') {
          setError('No se pudo cargar el catalogo completo. Intentalo de nuevo en unos segundos.')
        }
      })
      .finally(() => {
        setLoading(false)
      })

    return () => {
      controller.abort()
    }
  }, [isOpen, hasLoaded])

  useEffect(() => {
    if (!isOpen) {
      setActiveOptionId(null)
      setSelectedVariantId(null)
      setSearch('')
    }
  }, [isOpen])

  const activeOption = useMemo(() => {
    if (activeOptionId === null) {
      return null
    }
    return options.find((option) => option.id === activeOptionId) || null
  }, [activeOptionId, options])

  useEffect(() => {
    if (!activeOption) {
      setSelectedVariantId(null)
      return
    }
    const firstVariantId = activeOption.variants[0]?.id ?? null
    setSelectedVariantId((prev) => {
      if (prev && activeOption.variants.some((variant) => variant.id === prev)) {
        return prev
      }
      return firstVariantId
    })
  }, [activeOption])

  const filteredOptions = useMemo(() => {
    if (!search.trim()) {
      return options
    }
    const term = search.trim().toLowerCase()
    return options.filter((option) => option.searchText.includes(term))
  }, [options, search])

  const optionsByCategory = useMemo(() => {
    const grouped = new Map<ProductCategory, ProductOption[]>()

    filteredOptions.forEach((option) => {
      if (!grouped.has(option.category)) {
        grouped.set(option.category, [])
      }
      grouped.get(option.category)!.push(option)
    })

    return CATEGORY_ORDER
      .map((category) => ({
        category,
        items: grouped.get(category) || [],
      }))
      .filter(({ items }) => items.length > 0)
      .map(({ category, items }) => ({
        category,
        info: CATEGORY_CONFIG[category],
        items: items.sort((a, b) => a.name.localeCompare(b.name)),
      }))
  }, [filteredOptions])

  const handleChooseProduct = (optionId: number) => {
    setActiveOptionId(optionId)
  

  const handleDirectSelect = (option: ProductOption) => {
    const firstVariant = option.variants[0]
    setActiveOptionId(option.id)
    setSelectedVariantId(firstVariant?.id ?? null)

    if (firstVariant) {
      handleConfirmSelection(option, firstVariant.id)
    } else {
      toast.error('Este producto no tiene variantes disponibles en este momento')
    }
  }
}

  const handleConfirmSelection = (optionOverride?: ProductOption, variantOverrideId?: number) => {
    const optionToUse = optionOverride ?? activeOption
    const variantIdToUse = variantOverrideId ?? selectedVariantId

    if (!optionToUse || variantIdToUse === null || variantIdToUse === undefined) {
      toast.error('Selecciona una variante disponible')
      return
    }

    const variant = optionToUse.variants.find((item) => item.id === variantIdToUse)
      || optionToUse.variants[0]

    if (!variant) {
      toast.error('Este producto no tiene variantes disponibles ahora mismo')
      return
    }

    onSelect({
      productId: Number(optionToUse.id),
      templateId: optionToUse.templateId,
      defaultVariantId: variant.id,
      defaultSize: variant.size || undefined,
      defaultColor: variant.color || undefined,
      defaultColorCode: variant.colorCode || undefined,
      name: optionToUse.name,
    })
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Selecciona un producto"
      description="Elige que tipo de producto quieres anadir antes de abrir el editor de Printful"
      size="5xl"
      closeOnBackdrop={false}
      closeOnEscape={false}
    >
      <div className="flex h-full flex-col">
        <div className="px-6 pt-6">
          <label className="block text-xs font-semibold uppercase tracking-wide text-gray-500">
            Buscar en catalogo
          </label>
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Camiseta, sudadera, taza, poster..."
            className="mt-1 w-full rounded-lg border border-gray-300 px-4 py-2 text-sm focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-200"
            aria-label="Buscar producto"
          />
        </div>

        <div className="flex-1 overflow-y-auto px-6 pb-6">
          {loading && (
            <div className="flex items-center justify-center py-16">
              <div className="flex items-center gap-3 text-sm text-gray-600">
                <Loader2 className="h-5 w-5 animate-spin text-orange-600" />
                Cargando catalogo completo...
              </div>
            </div>
          )}

          {!loading && error && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          {!loading && !error && optionsByCategory.length === 0 && (
            <div className="py-16 text-center text-sm text-gray-500">
              No hay productos que coincidan con la busqueda.
            </div>
          )}

          {!loading && !error && optionsByCategory.length > 0 && (
            <div className="space-y-10">
              {optionsByCategory.map(({ category, info, items }) => (
                <section key={category}>
                  <header className="mb-4 flex items-center justify-between border-b border-gray-200 pb-2">
                    <h3 className="flex items-center gap-2 text-lg font-semibold text-gray-900">
                      <span className="text-xs font-mono text-gray-500">{info.marker}</span>
                      {info.label}
                      <span className="text-sm font-normal text-gray-500">({items.length})</span>
                    </h3>
                    <p className="text-xs text-gray-500">{info.description}</p>
                  </header>
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    {items.map((option) => {
                      const isActive = activeOption?.id === option.id
                      return (
                        <button
                          key={option.id}
                          type="button"
                          onClick={() => handleChooseProduct(option.id)}
                          onDoubleClick={() => handleDirectSelect(option)}
                          className={`flex w-full flex-col items-stretch gap-3 rounded-xl border p-4 text-left transition ${
                            isActive ? 'border-orange-400 bg-orange-50 shadow-md' : 'border-gray-200 bg-white hover:border-orange-300 hover:shadow'
                          }`}
                        >
                          <div className="flex items-start gap-3">
                            <div className="h-16 w-16 overflow-hidden rounded-lg bg-gray-100">
                              {option.image ? (
                                <img
                                  src={option.image}
                                  alt={option.name}
                                  className="h-full w-full object-cover"
                                />
                              ) : (
                                <div className="flex h-full w-full items-center justify-center text-xs text-gray-400">N/A</div>
                              )}
                            </div>
                            <div className="flex-1">
                              <h4 className="text-sm font-semibold text-gray-900">{option.name}</h4>
                              <div className="mt-1 text-xs text-gray-500 space-x-1">
                                {option.brand && <span>{option.brand}</span>}
                                {option.type && <span className="text-gray-400">· {option.type.toLowerCase()}</span>}
                              </div>
                              <div className="mt-1 text-xs text-gray-500">
                                {option.variantCount} variantes | {option.placements.join(', ') || 'Sin placements definidos'}
                              </div>
                            </div>
                          </div>
                        </button>
                      )
                    })}
                  </div>
                </section>
              ))}
            </div>
          )}
        </div>
      </div>

      <ModalFooter className="border-t border-gray-200 bg-white">
        <div className="flex w-full flex-col gap-4">
          {activeOption && (
            <div className="flex flex-col gap-2 rounded-lg border border-gray-200 bg-gray-50 p-4">
              <div>
                <div className="text-sm font-semibold text-gray-900">{activeOption.name}</div>
                <div className="text-xs text-gray-500 space-x-1">
                  {activeOption.brand && <span>{activeOption.brand}</span>}
                  {activeOption.type && <span className="text-gray-400">· {activeOption.type.toLowerCase()}</span>}
                </div>
              </div>
              <div className="flex flex-col gap-2 md:flex-row md:items-center">
                <label className="text-xs font-semibold uppercase tracking-wide text-gray-500 md:w-40">
                  Variante disponible
                </label>
                <select
                  value={selectedVariantId ?? ''}
                  onChange={(event) => setSelectedVariantId(Number(event.target.value))}
                  className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-200"
                >
                  {activeOption.variants.map((variant) => (
                    <option key={variant.id} value={variant.id}>
                      {getVariantLabel(variant)}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}

          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <button
              type="button"
              onClick={onClose}
              className="w-full rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50 md:w-auto"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={() => handleConfirmSelection()}
              disabled={!activeOption || selectedVariantId === null}
              className="w-full rounded-lg bg-orange-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-orange-700 disabled:cursor-not-allowed disabled:bg-orange-300 md:w-auto"
            >
              Usar este producto
            </button>
          </div>
        </div>
      </ModalFooter>
    </Modal>
  )
}

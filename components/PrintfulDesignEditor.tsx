'use client'

/* eslint-disable @next/next/no-img-element */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Loader2, RefreshCw, Upload, X, Check, Image as ImageIcon } from 'lucide-react'
import { toast } from 'react-hot-toast'

interface PrintfulDesignEditorProps {
  qrCode: string
  onSave: (designData: any) => void
  onClose: () => void
  savedDesignData?: any
}

interface ProductPlacement {
  placement: string
  label: string
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

interface CatalogProduct {
  id: number
  name: string
  type: string | null
  brand: string | null
  model: string | null
  image: string | null
}

type DesignsByPlacement = Record<string, string>

type VariantMockups = Record<number, Record<string, { url: string; raw?: any }>>

type VariantMockupsFromApi = Record<string, Record<string, string>>

const DEFAULT_PRODUCT_ID = 71

type DesignMetadata = Record<string, { width: number; height: number }>

const POLL_INTERVAL_MS = 2000
const MAX_POLL_ATTEMPTS = 20

const FALLBACK_PLACEMENTS: ProductPlacement[] = [
  {
    placement: 'front',
    label: 'Frente',
    printfileId: null,
    position: { top: 0, left: 0, width: 3600, height: 4800 },
    width: 3600,
    height: 4800,
    areaWidth: 3600,
    areaHeight: 4800,
  },
  {
    placement: 'back',
    label: 'Espalda',
    printfileId: null,
    position: { top: 0, left: 0, width: 3600, height: 4800 },
    width: 3600,
    height: 4800,
    areaWidth: 3600,
    areaHeight: 4800,
  },
  {
    placement: 'sleeve_right',
    label: 'Manga derecha',
    printfileId: null,
    position: { top: 0, left: 0, width: 1800, height: 1800 },
    width: 1800,
    height: 1800,
    areaWidth: 1800,
    areaHeight: 1800,
  },
  {
    placement: 'sleeve_left',
    label: 'Manga izquierda',
    printfileId: null,
    position: { top: 0, left: 0, width: 1800, height: 1800 },
    width: 1800,
    height: 1800,
    areaWidth: 1800,
    areaHeight: 1800,
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

function formatCatalogOptionLabel(product: CatalogProduct): string {
  const extra = [product.brand, product.model || product.type]
    .filter((value) => typeof value === 'string' && value.trim().length)
    .join(' ')
  const base = `#${product.id} - ${product.name}`
  return extra ? `${base} | ${extra}` : base
}

export function PrintfulDesignEditor({ qrCode, onSave, onClose, savedDesignData }: PrintfulDesignEditorProps) {
  const [selectedProductId, setSelectedProductId] = useState<number>(() => {
    const candidate = Number(savedDesignData?.printfulProduct?.productId || savedDesignData?.productId)
    if (Number.isFinite(candidate) && candidate > 0) {
      return candidate
    }
    return DEFAULT_PRODUCT_ID
  })
  const [manualProductCode, setManualProductCode] = useState(() => String(selectedProductId))
  const [catalogProducts, setCatalogProducts] = useState<CatalogProduct[]>([])
  const [loadingCatalog, setLoadingCatalog] = useState(true)
  const [catalogError, setCatalogError] = useState<string | null>(null)
  const [catalogSearchTerm, setCatalogSearchTerm] = useState('')
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
  const [generatingMockup, setGeneratingMockup] = useState(false)
  const [lastError, setLastError] = useState<string | null>(null)
  const [statusMessage, setStatusMessage] = useState<string | null>(null)
  const pollTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const activeTaskRef = useRef<{ key: string; variantId: number } | null>(null)
  const lastInitializedProductIdRef = useRef<number | null>(null)
  const catalogFetchedRef = useRef(false)

  const placementList = useMemo(() => normalizePlacements(productData?.placements), [productData?.placements])

  const filteredCatalogProducts = useMemo(() => {
    if (!catalogSearchTerm.trim()) {
      return catalogProducts
    }
    const term = catalogSearchTerm.trim().toLowerCase()
    return catalogProducts.filter((product) => {
      const haystack = [
        product.name,
        product.brand,
        product.model,
        product.type,
        product.id ? String(product.id) : '',
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
      return haystack.includes(term)
    })
  }, [catalogProducts, catalogSearchTerm])

  const trimmedCatalogSearch = catalogSearchTerm.trim()
  const showNoCatalogResultsHint = Boolean(trimmedCatalogSearch) && filteredCatalogProducts.length === 0
  const catalogOptions = showNoCatalogResultsHint ? catalogProducts : filteredCatalogProducts

  const fallbackCatalogProduct = useMemo(() => ({
    id: selectedProductId || DEFAULT_PRODUCT_ID,
    name: productData?.name || `Producto ${selectedProductId || DEFAULT_PRODUCT_ID}`,
    type: productData?.type || null,
    brand: productData?.brand || null,
    model: productData?.model || null,
    image: productData?.image || null,
  }), [productData, selectedProductId])

  const selectedVariant = useMemo(() => {
    if (!productData || !selectedVariantId) return null
    return productData.variants.find((variant) => variant.id === selectedVariantId) || null
  }, [productData, selectedVariantId])

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
        throw new Error(data.error || 'No pudimos obtener el producto de Printful')
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
            .filter((variant) => !Number.isNaN(variant.id))
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
        : [...new Set(normalizedVariants.map((variant) => variant.size).filter(Boolean))]

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
      console.error('Error fetching Printful product', error)
      const message = error instanceof Error ? error.message : 'No pudimos cargar los datos de Printful. Intenta de nuevo.'
      setLastError(message)
      setProductData(null)
      setStatusMessage(null)
      toast.error(message)
    } finally {
      setLoadingProduct(false)
    }
  }

  useEffect(() => {
    setManualProductCode(String(selectedProductId))
  }, [selectedProductId])

  useEffect(() => {
    if (catalogFetchedRef.current) {
      return
    }

    let isMounted = true

    const fallbackTimer = setTimeout(() => {
      if (!isMounted) {
        return
      }
      setLoadingCatalog(false)
      setCatalogProducts((prev) => (prev.length ? prev : [fallbackCatalogProduct]))
    }, 8000)

    const fetchCatalog = async () => {
      catalogFetchedRef.current = true
      setLoadingCatalog(true)
      setCatalogError(null)
      try {
        const response = await fetch('/api/printful/products?limit=100')
        const data = await response.json()
        if (!response.ok || !Array.isArray(data.products)) {
          throw new Error(data.error || 'No pudimos obtener el catalogo de Printful')
        }
        if (!isMounted) {
          return
        }
        const incoming = Array.isArray(data.products) ? data.products : []
        const normalized = incoming
          .map((product: any) => {
            const id = Number(product.id)
            if (!Number.isFinite(id) || id <= 0) {
              return null
            }
            const name =
              typeof product.name === 'string' && product.name.trim().length
                ? product.name
                : `Producto ${id}`
            return {
              id,
              name,
              type:
                typeof product.type === 'string' && product.type.trim().length ? product.type : null,
              brand:
                typeof product.brand === 'string' && product.brand.trim().length ? product.brand : null,
              model:
                typeof product.model === 'string' && product.model.trim().length ? product.model : null,
              image:
                typeof product.image === 'string' && product.image.trim().length ? product.image : null,
            }
          })
          .filter((product): product is CatalogProduct => Boolean(product))
        setCatalogProducts(normalized.length ? normalized : [fallbackCatalogProduct])
      } catch (error) {
        console.error('Error fetching Printful catalog', error)
        if (!isMounted) {
          return
        }
        setCatalogProducts([fallbackCatalogProduct])
        setCatalogError(error instanceof Error ? error.message : 'No pudimos obtener el catalogo de Printful')
      } finally {
        if (isMounted) {
          setLoadingCatalog(false)
        }
        clearTimeout(fallbackTimer)
      }
    }

    fetchCatalog()

    return () => {
      isMounted = false
      clearTimeout(fallbackTimer)
    }
  }, [fallbackCatalogProduct])

  useEffect(() => {
    if (!productData) {
      return
    }
    setCatalogProducts((prev) => {
      if (prev.some((product) => product.id === productData.productId)) {
        return prev
      }
      const nextProduct: CatalogProduct = {
        id: productData.productId,
        name: productData.name,
        type: productData.type,
        brand: productData.brand,
        model: productData.model,
        image: productData.image,
      }
      return [nextProduct, ...prev]
    })
  }, [productData])

  useEffect(
    () => () => {
      if (pollTimeoutRef.current) {
        clearTimeout(pollTimeoutRef.current)
      }
    },
    [],
  )

  useEffect(() => {
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

    if (matchesSavedProduct) {
      Object.entries(savedPlacements as Record<string, any>).forEach(([placement, value]) => {
        if (nextDesigns[placement] === undefined) {
          return
        }
        if (typeof value === 'string' && value) {
          nextDesigns[placement] = value
          return
        }
        if (value?.imageUrl) {
          nextDesigns[placement] = value.imageUrl
        }
      })
    }

    let nextVariantMockups: VariantMockups = {}
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
    if (matchesSavedProduct && Number.isFinite(savedVariantCandidate)) {
      nextVariantId = savedVariantCandidate
    }

    if (!nextVariantId) {
      nextVariantId = productData.defaultVariantId || productData.variants[0]?.id || null
    }

    const foundVariant = nextVariantId
      ? productData.variants.find((variant) => variant.id === nextVariantId)
      : undefined

    let nextSize = ''
    let nextColorCode = ''
    if (foundVariant) {
      nextSize = foundVariant.size
      nextColorCode = foundVariant.colorCode
    } else if (productData.variants[0]) {
      nextVariantId = productData.variants[0].id
      nextSize = productData.variants[0].size
      nextColorCode = productData.variants[0].colorCode
    } else {
      nextSize = productData.sizes[0] ?? ''
      nextColorCode = ''
    }

    let nextActivePlacement = 'front'
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
    setManualProductCode(String(value))

    setSelectedProductId(value)
  }

  const handleCatalogSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setCatalogSearchTerm(event.target.value)
  }

  const ensureDesignMetadata = useCallback((placementKey: string, imageUrl: string) => {
    if (!imageUrl || typeof window === 'undefined') {
      return
    }
    loadImageDimensions(imageUrl)
      .then(({ width, height }) => {
        setDesignMetadata((prev) => {
          const current = prev[placementKey]
          if (current && current.width === width && current.height === height) {
            return prev
          }
          return { ...prev, [placementKey]: { width, height } }
        })
      })
      .catch((error) => {
        console.warn(`[printful] no pudimos calcular las dimensiones para ${placementKey}`, error)
        setDesignMetadata((prev) => {
          const next = { ...prev }
          delete next[placementKey]
          return next
        })
      })
  }, [])

  const handleCatalogProductChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const { value } = event.target
    if (!value) {
      return
    }
    const numericValue = Number(value)
    if (!Number.isFinite(numericValue) || numericValue <= 0) {
      return
    }
    handleProductChange(numericValue)
  }

  const handleManualProductInput = (event: React.ChangeEvent<HTMLInputElement>) => {
    setManualProductCode(event.target.value)
  }

  const handleManualProductSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const value = Number(manualProductCode.trim())
    if (!Number.isFinite(value) || value <= 0) {
      toast.error('Introduce un ID de producto valido')
      return
    }
    handleProductChange(value)
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

      setDesignsByPlacement((prev) => ({ ...prev, [activePlacement]: data.url }))
      ensureDesignMetadata(activePlacement, data.url)
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

        const baseTop = ensureNumber(placement.position?.top, 0)
        const baseLeft = ensureNumber(placement.position?.left, 0)
        const baseWidth = ensureNumber(placement.position?.width, ensureNumber(placement.width, 3600))
        const baseHeight = ensureNumber(placement.position?.height, ensureNumber(placement.height, 4800))
        const areaWidth = Math.max(1, ensureNumber(placement.areaWidth, baseWidth))
        const areaHeight = Math.max(1, ensureNumber(placement.areaHeight, baseHeight))
        const boundsWidth = Math.max(1, baseWidth)
        const boundsHeight = Math.max(1, baseHeight)

        const metadata = designMetadata[placement.placement]
        const originalWidth = metadata?.width ? Math.max(1, Math.round(metadata.width)) : boundsWidth
        const originalHeight = metadata?.height ? Math.max(1, Math.round(metadata.height)) : boundsHeight

        let targetWidth = originalWidth
        let targetHeight = originalHeight

        if (originalWidth > boundsWidth || originalHeight > boundsHeight) {
          const scale = Math.min(boundsWidth / originalWidth, boundsHeight / originalHeight)
          targetWidth = Math.max(1, Math.round(originalWidth * scale))
          targetHeight = Math.max(1, Math.round(originalHeight * scale))
        }

        const offsetLeft = baseLeft + Math.max(0, Math.floor((boundsWidth - targetWidth) / 2))
        const offsetTop = baseTop + Math.max(0, Math.floor((boundsHeight - targetHeight) / 2))

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
        printfileId?: number
        position: { top: number; left: number; width: number; height: number; areaWidth: number; areaHeight: number }
      } => Boolean(entry))
  }
  const pollMockupStatus = async (requestId: string, variantId: number, attempt: number) => {
    if (attempt > MAX_POLL_ATTEMPTS) {
      setGeneratingMockup(false)
      activeTaskRef.current = null
      toast.error('Printful tardeee demasiado. Intenta de nuevo en unos minutos.')
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
          return next
        })
        setGeneratingMockup(false)
        activeTaskRef.current = null
        setStatusMessage(data.message || 'Mockup generado con eeexito en Printful')
        toast.success('Mockup generado con eeexito en Printful')
        return
      }

      if (data.status === 'failed') {
        setGeneratingMockup(false)
        activeTaskRef.current = null
        setStatusMessage(data.message || 'Printful no pudo generar el mockup')
        toast.error('Printful no pudo generar el mockup. Revisa los archivos y vuelve a intentarlo.')
        return
      }

      pollTimeoutRef.current = setTimeout(() => pollMockupStatus(requestId, variantId, attempt + 1), POLL_INTERVAL_MS)
    } catch (error) {
      console.error('Error polling Printful mockup', error)
      setGeneratingMockup(false)
      activeTaskRef.current = null
      toast.error('Error al consultar el estado del mockup en Printful')
    }
  }

  const requestMockup = async () => {
    if (!productData || !selectedVariantId) return
    const files = buildFilesPayload()
    if (!files.length) {
      toast.error('Sube al menos un diseno antes de generar el mockup')
      return
    }

    setGeneratingMockup(true)
    setStatusMessage(null)

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
      if (!response.ok || !data.success || !data.requestId) {
        throw new Error(data.error || 'Printful no acepto la tarea de mockup')
      }

      activeTaskRef.current = { key: data.requestId, variantId: selectedVariantId }
      pollMockupStatus(data.requestId, selectedVariantId, 0)
    } catch (error) {
      console.error('Error generating mockup in Printful', error)
      setGeneratingMockup(false)
      activeTaskRef.current = null
      toast.error(error instanceof Error ? error.message : 'No pudimos pedir el mockup a Printful')
    }
  }
  const handleSave = () => {
    if (!productData) return
    if (!hasAnyDesign) {
      toast.error('Agrega al menos un diseeeeo antes de guardar')
      return
    }

    const payload = {
      editorType: 'printful',
      qrCode,
      savedAt: new Date().toISOString(),
      designsByPlacement,
      designMetadata,
      variantMockups,
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
        variantMockups,
        activePlacement,
        lastMessage: statusMessage,
      },
    }

    onSave(payload)
    toast.success('Diseeeeo guardado con Printful')
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4 py-8">
      <div className="relative w-full max-w-5xl rounded-3xl bg-white shadow-2xl">
        <button
          onClick={() => {
            if (generatingMockup) {
              toast.error('Espera a que termine la generacieeen del mockup')
              return
            }
            onClose()
          }}
          className="absolute right-4 top-4 inline-flex h-10 w-10 items-center justify-center rounded-full border border-gray-200 text-gray-500 transition hover:border-gray-300 hover:text-gray-700"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="grid gap-6 p-6 md:grid-cols-[1.2fr_1fr]">
          <div className="space-y-4">
            <div className="rounded-2xl border border-gray-200 bg-white p-4">
              <label className="block text-xs font-semibold text-gray-500">Producto Printful</label>
              <div className="mt-2 space-y-2">
                {loadingCatalog ? (
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <Loader2 className="h-4 w-4 animate-spin text-primary-500" />
                    <span>Cargando catalogo...</span>
                  </div>
                ) : (
                  <>
                    <input
                      value={catalogSearchTerm}
                      onChange={handleCatalogSearchChange}
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                      placeholder="Buscar por nombre, marca o ID"
                    />
                    <select
                      value={selectedProductId ? String(selectedProductId) : ''}
                      onChange={handleCatalogProductChange}
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                    >
                      <option value="">Selecciona un producto</option>
                      {catalogOptions.map((product) => (
                        <option key={product.id} value={product.id}>
                          {formatCatalogOptionLabel(product)}
                        </option>
                      ))}
                    </select>
                    {showNoCatalogResultsHint && (
                      <p className="text-xs text-gray-500">
                        No encontramos productos con ese filtro. Mostramos el catalogo completo.
                      </p>
                    )}
                    {catalogError && <p className="text-xs text-red-500">{catalogError}</p>}
                  </>
                )}
              </div>
              <form onSubmit={handleManualProductSubmit} className="mt-2 flex gap-2">
                <input
                  value={manualProductCode}
                  onChange={handleManualProductInput}
                  className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm"
                  placeholder="ID de producto (ej. 71)"
                />
                <button
                  type="submit"
                  className="rounded-lg border border-primary-200 px-3 py-2 text-xs font-semibold text-primary-600 transition hover:border-primary-300 hover:text-primary-700"
                >
                  Cargar
                </button>
              </form>
              <p className="mt-1 text-[11px] text-gray-500">Si conoces el ID exacto, introducelo arriba y pulsa cargar.</p>
              {productData && (
                <div className="mt-3 rounded-lg bg-gray-50 p-3 text-xs text-gray-600">
                  <p className="font-semibold text-gray-900">{productData.name}</p>
                  <p>
                    {productData.brand ? `${productData.brand} ` : ''}
                    {productData.model || productData.type || ''}
                  </p>
                </div>
              )}
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">{productData?.name || 'Producto Printful'}</h2>
              <p className="text-sm text-gray-600">
                QR <span className="font-semibold text-gray-900">{qrCode}</span>
              </p>
              {statusMessage && <p className="text-xs text-gray-500">{statusMessage}</p>}
              {lastError && <p className="text-xs text-red-500">{lastError}</p>}
            </div>

            <div className="flex flex-wrap gap-2">
              {placementList.map((placement) => {
                const isActive = activePlacement === placement.placement
                const hasMockup = Boolean(currentVariantMockups[placement.placement])
                const hasDesign = Boolean(designsByPlacement[placement.placement])
                return (
                  <button
                    key={placement.placement}
                    onClick={() => setActivePlacement(placement.placement)}
                    className={`rounded-full border px-3 py-1 text-xs font-semibold transition ${
                      isActive ? 'border-primary-500 bg-primary-50 text-primary-600' : 'border-gray-200 text-gray-700'
                    }`}
                  >
                    {placement.label}
                    {hasMockup && <Check className="ml-2 inline h-3 w-3 text-green-500" />}
                    {!hasMockup && hasDesign && (
                      <span className="ml-2 inline-block h-2 w-2 rounded-full bg-amber-400" />
                    )}
                  </button>
                )
              })}
            </div>

            <div className="flex min-h-[260px] items-center justify-center rounded-2xl border border-gray-200 bg-gray-50">
              {loadingProduct ? (
                <div className="flex flex-col items-center gap-3 text-sm text-gray-500">
                  <Loader2 className="h-7 w-7 animate-spin text-primary-500" />
                  <span>Conectando con Printful...</span>
                </div>
              ) : lastError ? (
                <div className="space-y-3 text-center text-sm text-red-500">
                  <p>{lastError}</p>
                  <button
                    className="rounded-full border border-red-200 px-4 py-1 text-xs font-semibold text-red-600"
                    onClick={() => window.location.reload()}
                  >
                    Reintentar
                  </button>
                </div>
              ) : currentMockupUrl ? (
                <img
                  src={currentMockupUrl}
                  alt={`Mockup ${activePlacement}`}
                  className="max-h-[240px] w-auto rounded-xl border border-gray-200 bg-white object-contain shadow-sm"
                />
              ) : designsByPlacement[activePlacement] ? (
                <div className="text-center text-sm text-gray-600">
                  <p>
                    Diseeeeo listo para{' '}
                    {placementList.find((item) => item.placement === activePlacement)?.label || activePlacement}.
                  </p>
                  <button
                    onClick={requestMockup}
                    className="mt-4 inline-flex items-center gap-2 rounded-full bg-primary-600 px-4 py-2 text-xs font-semibold text-white"
                    disabled={generatingMockup}
                  >
                    {generatingMockup ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                    {generatingMockup ? 'Generando...' : 'Generar mockup'}
                  </button>
                </div>
              ) : (
                <div className="text-center text-sm text-gray-500">
                  <ImageIcon className="mx-auto h-10 w-10 text-gray-300" />
                  <p className="mt-2">Sube un diseeeeo para ver el mockup oficial de Printful.</p>
                </div>
              )}
            </div>
          </div>

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
                    Variante Printful: <span className="font-semibold text-gray-900">{selectedVariant.id}</span>
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
                  <p className="font-semibold">Diseeeeo cargado</p>
                  <div className="flex gap-2">
                    <button
                      onClick={requestMockup}
                      className="inline-flex items-center gap-2 rounded-full border border-green-300 px-3 py-1 text-xs font-semibold text-green-700"
                      disabled={generatingMockup}
                    >
                      <RefreshCw className="h-3 w-3" /> Generar mockup
                    </button>
                    <button
                      onClick={() => handleRemoveDesign(activePlacement)}
                      className="inline-flex items-center gap-2 rounded-full border border-red-200 px-3 py-1 text-xs font-semibold text-red-600"
                    >
                      Quitar
                    </button>
                  </div>
                </div>
              ) : (
                <label className="mt-3 flex cursor-pointer flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-gray-300 bg-gray-50 p-6 text-center text-sm text-gray-600">
                  <input type="file" accept="image/png,image/jpeg" className="hidden" onChange={handleImageUpload} disabled={uploading} />
                  {uploading ? (
                    <>
                      <Loader2 className="h-6 w-6 animate-spin text-primary-500" />
                      Subiendo diseeeeo...
                    </>
                  ) : (
                    <>
                      <Upload className="h-6 w-6 text-primary-400" />
                      Click para subir imagen
                    </>
                  )}
                </label>
              )}
            </div>

            <div className="rounded-2xl border border-gray-200 bg-white p-4 text-sm text-gray-600">
              <p>
                Diseeeeos cargados:{' '}
                <span className="font-semibold text-gray-900">{Object.values(designsByPlacement).filter(Boolean).length}</span>{' '}/ {placementList.length}
              </p>
              <p>
                Mockups disponibles:{' '}
                <span className="font-semibold text-gray-900">{Object.keys(currentVariantMockups).length}</span>
              </p>
            </div>

            <div className="flex flex-col gap-3 rounded-2xl border border-gray-200 bg-white p-4 text-sm">
              <button
                onClick={handleSave}
                disabled={!hasAnyDesign || generatingMockup || uploading}
                className="rounded-full bg-primary-600 px-4 py-2 font-semibold text-white transition hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Guardar diseeeeo con Printful
              </button>
              <button
                onClick={onClose}
                className="rounded-full border border-gray-200 px-4 py-2 font-semibold text-gray-700 transition hover:border-gray-300"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}





















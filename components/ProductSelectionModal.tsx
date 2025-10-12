'use client'

import { useMemo, useState } from 'react'
import { Modal, ModalFooter } from './ui/Modal'
import { getAllPackages } from '@/lib/packages'
import { getProductInfo, CATEGORY_INFO } from '@/lib/product-names'

const CATEGORY_ORDER: Array<'ropa' | 'accesorios' | 'hogar' | 'otros'> = ['ropa', 'accesorios', 'hogar', 'otros']

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

interface ProductOption {
  key: string
  productId: number
  templateId: number
  defaultVariantId?: number
  defaultSize?: string
  defaultColor?: string
  defaultColorCode?: string
  name: string
  description?: string
  emoji?: string
  category: 'ropa' | 'accesorios' | 'hogar' | 'otros'
  packageTitles: string[]
}

export function ProductSelectionModal({ isOpen, onClose, onSelect }: ProductSelectionModalProps) {
  const [search, setSearch] = useState('')

  const productOptions = useMemo<ProductOption[]>(() => {
    const packages = getAllPackages()
    const map = new Map<string, ProductOption & { packageSet: Set<string> }>()

    packages.forEach((pkg) => {
      pkg.products.forEach((product) => {
        const key = [
          product.productId,
          product.defaultVariantId || 0,
          product.defaultColorCode || 'none',
          product.defaultSize || 'generic'
        ].join(':')

        const info = getProductInfo(product.productId)
        const baseOption = map.get(key)

        if (baseOption) {
          baseOption.packageSet.add(pkg.title)
          return
        }

        map.set(key, {
          key,
          productId: product.productId,
          templateId: product.productId,
          defaultVariantId: product.defaultVariantId || undefined,
          defaultSize: product.defaultSize,
          defaultColor: product.defaultColor,
          defaultColorCode: product.defaultColorCode,
          name: info?.name || product.name,
          description: info?.description || pkg.description,
          emoji: info?.emoji,
          category: info?.category || 'otros',
          packageTitles: [],
          packageSet: new Set([pkg.title])
        })
      })
    })

    return Array.from(map.values()).map((option) => ({
      key: option.key,
      productId: option.productId,
      templateId: option.templateId,
      defaultVariantId: option.defaultVariantId,
      defaultSize: option.defaultSize,
      defaultColor: option.defaultColor,
      defaultColorCode: option.defaultColorCode,
      name: option.name,
      description: option.description,
      emoji: option.emoji,
      category: option.category,
      packageTitles: Array.from(option.packageSet).sort()
    }))
  }, [])

  const filteredOptions = useMemo(() => {
    if (!search.trim()) return productOptions
    const term = search.trim().toLowerCase()
    return productOptions.filter((option) => {
      const haystack = [
        option.name,
        option.description || '',
        ...option.packageTitles
      ].join(' ').toLowerCase()
      return haystack.includes(term)
    })
  }, [productOptions, search])

  const optionsByCategory = useMemo(() => {
    const grouped: Record<string, ProductOption[]> = {}
    filteredOptions.forEach((option) => {
      if (!grouped[option.category]) {
        grouped[option.category] = []
      }
      grouped[option.category].push(option)
    })

    return Object.entries(grouped)
      .map(([categoryId, items]) => ({
        id: categoryId as ProductOption['category'],
        info: CATEGORY_INFO[categoryId as keyof typeof CATEGORY_INFO],
        items: items.sort((a, b) => a.name.localeCompare(b.name))
      }))
      .sort((a, b) => CATEGORY_ORDER.indexOf(a.id) - CATEGORY_ORDER.indexOf(b.id))
  }, [filteredOptions])

  const handleSelect = (option: ProductOption) => {
    onSelect({
      productId: option.productId,
      templateId: option.templateId,
      defaultVariantId: option.defaultVariantId,
      defaultSize: option.defaultSize,
      defaultColor: option.defaultColor,
      defaultColorCode: option.defaultColorCode,
      name: option.name
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
      <div className="flex flex-col h-full">
        <div className="px-6 pt-6">
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Busca por nombre o paquete"
            className="w-full rounded-lg border border-gray-300 px-4 py-2 text-sm focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-200"
            aria-label="Buscar producto"
          />
        </div>

        <div className="flex-1 overflow-y-auto px-6 pb-6 pt-4 space-y-8">
          {optionsByCategory.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-sm text-gray-500">No encontramos productos con ese termino. Prueba con otro nombre.</p>
            </div>
          ) : (
            optionsByCategory.map((category) => (
              <section key={category.id}>
                <header className="flex items-center justify-between mb-4 border-b border-gray-200 pb-2">
                  <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                    <span className="text-2xl">{category.info.icon}</span>
                    {category.info.name}
                    <span className="text-sm font-normal text-gray-500">({category.items.length})</span>
                  </h3>
                  <p className="text-xs text-gray-500">{category.info.description}</p>
                </header>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {category.items.map((option) => (
                    <button
                      key={option.key}
                      type="button"
                      onClick={() => handleSelect(option)}
                      className="w-full rounded-xl border border-gray-200 bg-white p-4 text-left transition hover:border-orange-300 hover:shadow"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="flex items-center gap-2 text-base font-semibold text-gray-900">
                            {option.emoji && <span className="text-lg">{option.emoji}</span>}
                            <span>{option.name}</span>
                          </div>
                          {option.description && (
                            <p className="mt-1 text-sm text-gray-600">{option.description}</p>
                          )}
                        </div>
                        <span className="rounded-full bg-orange-100 px-3 py-1 text-xs font-medium text-orange-700">Seleccionar</span>
                      </div>
                      <ul className="mt-3 text-xs text-gray-500 space-y-1">
                        {option.defaultSize && <li>Talla sugerida: {option.defaultSize}</li>}
                        {option.defaultColor && <li>Color sugerido: {option.defaultColor}</li>}
                        {option.packageTitles.length > 0 && (
                          <li>Incluido en: {option.packageTitles.join(', ')}</li>
                        )}
                      </ul>
                    </button>
                  ))}
                </div>
              </section>
            ))
          )}
        </div>
      </div>

      <ModalFooter className="border-t border-gray-200 bg-white">
        <button
          type="button"
          onClick={onClose}
          className="w-full rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
        >
          Cancelar
        </button>
      </ModalFooter>
    </Modal>
  )
}

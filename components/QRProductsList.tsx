'use client'

import { QRDesignData, migrateLegacyDesign } from '@/types/qr-product'
import { Package } from 'lucide-react'

interface QRProductsListProps {
  designData: any
  compact?: boolean
}

export function QRProductsList({ designData, compact = false }: QRProductsListProps) {
  if (!designData) {
    return (
      <div className="text-xs text-gray-500 italic">
        Sin productos configurados
      </div>
    )
  }

  // Migrar a formato v2.0 si es necesario
  const migratedDesign = migrateLegacyDesign(designData)
  const products = migratedDesign.products || []

  if (products.length === 0) {
    return (
      <div className="text-xs text-gray-500 italic">
        Sin productos configurados
      </div>
    )
  }

  if (compact) {
    return (
      <div className="flex items-center gap-1 text-xs text-gray-700">
        <Package className="h-3 w-3" />
        <span className="font-medium">{products.length}</span>
        <span>producto{products.length !== 1 ? 's' : ''}</span>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 text-xs font-semibold text-gray-700 mb-2">
        <Package className="h-4 w-4" />
        Productos ({products.length})
      </div>
      <div className="space-y-1.5">
        {products.map((product, index) => (
          <div
            key={product.id}
            className="flex items-start gap-2 p-2 bg-gray-50 rounded border border-gray-200"
          >
            <div className="flex-shrink-0 w-5 h-5 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center text-xs font-bold">
              {index + 1}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-xs font-medium text-gray-900 truncate">
                {product.productName}
              </div>
              <div className="flex items-center gap-2 mt-0.5">
                {product.size && (
                  <span className="text-xs text-gray-600 bg-white px-1.5 py-0.5 rounded border border-gray-200">
                    {product.size}
                  </span>
                )}
                {product.color && (
                  <span className="flex items-center gap-1 text-xs text-gray-600">
                    {product.colorCode && (
                      <span
                        className="w-3 h-3 rounded-full border border-gray-300"
                        style={{ backgroundColor: product.colorCode }}
                      />
                    )}
                    {product.color}
                  </span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}


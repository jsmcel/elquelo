'use client'

import { QRDesignData, migrateLegacyDesign } from '@/types/qr-product'
import { Package, Plus, Trash2 } from 'lucide-react'

interface QRProductsListProps {
  designData: any
  compact?: boolean
  onAddProduct?: () => void
  onOpenTrash?: () => void
  onDeleteProduct?: (productId: string) => void
}

export function QRProductsList({ 
  designData, 
  compact = false, 
  onAddProduct,
  onOpenTrash,
  onDeleteProduct 
}: QRProductsListProps) {
  if (!designData) {
    return (
      <div className="text-xs text-gray-500 italic">
        Sin productos configurados
      </div>
    )
  }

  // Migrar a formato v2.0 si es necesario
  const migratedDesign = migrateLegacyDesign(designData)
  const allProducts = migratedDesign.products || []
  
  // Filtrar productos activos (no eliminados)
  const products = allProducts.filter(p => !p.deletedAt)
  const trashedCount = allProducts.filter(p => p.deletedAt).length

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
      <div className="flex items-center justify-between gap-2 mb-2">
        <div className="flex items-center gap-2 text-xs font-semibold text-gray-700">
          <Package className="h-4 w-4" />
          Productos ({products.length})
        </div>
        <div className="flex items-center gap-2">
          {onAddProduct && (
            <button
              onClick={(e) => {
                e.stopPropagation()
                onAddProduct()
              }}
              className="inline-flex items-center gap-1 px-2 py-1 text-xs font-semibold text-primary-600 bg-primary-50 rounded-lg hover:bg-primary-100 transition-colors"
              title="Añadir producto"
            >
              <Plus className="h-3 w-3" />
              Añadir
            </button>
          )}
          {onOpenTrash && trashedCount > 0 && (
            <button
              onClick={(e) => {
                e.stopPropagation()
                onOpenTrash()
              }}
              className="inline-flex items-center gap-1 px-2 py-1 text-xs font-semibold text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors relative"
              title="Ver papelera"
            >
              <Trash2 className="h-3 w-3" />
              <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
                {trashedCount}
              </span>
            </button>
          )}
        </div>
      </div>
      
      {products.length === 0 && (
        <div className="text-xs text-gray-500 italic py-2">
          Sin productos configurados
        </div>
      )}
      {products.length > 0 && (
        <div className="space-y-1.5">
          {products.map((product, index) => (
            <div
              key={product.id}
              className="flex items-start gap-2 p-2 bg-gray-50 rounded border border-gray-200 group"
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
              {onDeleteProduct && (
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    if (confirm(`¿Eliminar ${product.productName}?`)) {
                      onDeleteProduct(product.id)
                    }
                  }}
                  className="opacity-0 group-hover:opacity-100 transition-opacity p-1 text-red-600 hover:bg-red-50 rounded"
                  title="Eliminar producto"
                >
                  <Trash2 className="h-3 w-3" />
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}


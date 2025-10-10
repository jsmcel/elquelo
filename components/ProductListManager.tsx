'use client'

import { useState } from 'react'
import { QRProduct } from '@/types/qr-product'
import { Trash2, Edit2, Package, Plus } from 'lucide-react'

interface ProductListManagerProps {
  products: QRProduct[]
  selectedProductId: string | null
  onSelectProduct: (productId: string) => void
  onAddProduct: () => void
  onDeleteProduct: (productId: string) => void
}

export function ProductListManager({
  products,
  selectedProductId,
  onSelectProduct,
  onAddProduct,
  onDeleteProduct
}: ProductListManagerProps) {
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
          <Package className="h-4 w-4" />
          Productos en este QR ({products.length})
        </h3>
        <button
          onClick={onAddProduct}
          className="flex items-center gap-1 px-3 py-1 text-xs font-medium text-white bg-primary-600 rounded-md hover:bg-primary-700 transition-colors"
        >
          <Plus className="h-3 w-3" />
          Agregar Producto
        </button>
      </div>

      <div className="space-y-2">
        {products.length === 0 ? (
          <div className="text-center py-8 text-gray-500 text-sm">
            <Package className="h-12 w-12 mx-auto mb-2 text-gray-300" />
            <p>No hay productos agregados</p>
            <p className="text-xs mt-1">Haz clic en "Agregar Producto" para comenzar</p>
          </div>
        ) : (
          products.map((product) => (
            <div
              key={product.id}
              onClick={() => onSelectProduct(product.id)}
              className={`relative p-3 border rounded-lg cursor-pointer transition-all ${
                selectedProductId === product.id
                  ? 'border-primary-500 bg-primary-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-medium text-gray-900 truncate">
                    {product.productName}
                  </h4>
                  <div className="flex items-center gap-2 mt-1 text-xs text-gray-600">
                    {product.size && (
                      <span className="px-2 py-0.5 bg-gray-100 rounded">
                        {product.size}
                      </span>
                    )}
                    {product.color && (
                      <span className="flex items-center gap-1">
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
                  <div className="text-xs text-gray-500 mt-1">
                    ID: {product.variantId}
                  </div>
                </div>
                
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    if (confirm('¿Eliminar este producto del QR?')) {
                      onDeleteProduct(product.id)
                    }
                  }}
                  className="ml-2 p-1.5 text-red-600 hover:bg-red-50 rounded transition-colors"
                  title="Eliminar producto"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>

              {selectedProductId === product.id && (
                <div className="absolute -left-1 top-1/2 -translate-y-1/2 w-1 h-8 bg-primary-600 rounded-r" />
              )}
            </div>
          ))
        )}
      </div>

      {products.length > 0 && (
        <div className="mt-3 pt-3 border-t border-gray-200">
          <p className="text-xs text-gray-500">
            💡 Cada producto puede tener su propio diseño y configuración
          </p>
        </div>
      )}
    </div>
  )
}


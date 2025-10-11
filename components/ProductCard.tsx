'use client'

import { QRProduct } from '@/types/qr-product'
import { Edit2, Trash2, Check, AlertTriangle, Loader2, Package } from 'lucide-react'

interface ProductCardProps {
  product: QRProduct
  onEdit: () => void
  onDelete: () => void
  isDeleting?: boolean
}

export function ProductCard({ product, onEdit, onDelete, isDeleting = false }: ProductCardProps) {
  // Determinar estado del producto
  const hasDesign = Object.keys(product.designsByPlacement || {}).some(key => product.designsByPlacement[key])
  const hasMockup = Object.keys(product.variantMockups || {}).length > 0
  const isComplete = hasDesign && product.variantId && product.variantId !== 0
  
  // Obtener el primer mockup disponible para preview
  const mockupUrl = hasMockup 
    ? Object.values(product.variantMockups)[0]
    : null

  // Estado visual
  const getStatusColor = () => {
    if (isComplete) return 'border-green-200 bg-green-50'
    if (hasDesign) return 'border-yellow-200 bg-yellow-50'
    return 'border-gray-200 bg-white'
  }

  const getStatusIcon = () => {
    if (isComplete) return <Check className="h-4 w-4 text-green-600" />
    if (hasDesign) return <AlertTriangle className="h-4 w-4 text-yellow-600" />
    return null
  }

  const getStatusText = () => {
    if (isComplete) return 'Completo'
    if (hasDesign) return 'Sin configurar'
    return 'Sin diseño'
  }

  return (
    <div 
      className={`rounded-lg border-2 overflow-hidden transition-all hover:shadow-md ${getStatusColor()}`}
      role="article"
      aria-label={`Producto: ${product.productName}`}
    >
      {/* Preview Area */}
      <div className="aspect-square bg-gray-100 relative overflow-hidden">
        {mockupUrl ? (
          <img
            src={mockupUrl}
            alt={`Preview de ${product.productName}`}
            className="w-full h-full object-contain"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Package className="h-16 w-16 text-gray-300" />
          </div>
        )}
        
        {/* Status Badge */}
        <div className="absolute top-2 right-2">
          <div className={`px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${
            isComplete ? 'bg-green-100 text-green-700' :
            hasDesign ? 'bg-yellow-100 text-yellow-700' :
            'bg-gray-100 text-gray-700'
          }`}>
            {getStatusIcon()}
            {getStatusText()}
          </div>
        </div>
      </div>

      {/* Info Area */}
      <div className="p-4">
        <h3 className="font-semibold text-gray-900 mb-2 truncate" title={product.productName}>
          {product.productName}
        </h3>
        
        {/* Talla y Color */}
        <div className="flex items-center gap-2 mb-3 flex-wrap">
          {product.size && (
            <span className="px-2 py-1 bg-white border border-gray-200 rounded text-xs font-medium text-gray-700">
              🏷️ {product.size}
            </span>
          )}
          {product.color && product.colorCode && (
            <span className="flex items-center gap-1 px-2 py-1 bg-white border border-gray-200 rounded text-xs font-medium text-gray-700">
              <span
                className="w-3 h-3 rounded-full border border-gray-300"
                style={{ backgroundColor: product.colorCode }}
                aria-label={`Color: ${product.color}`}
              />
              {product.color}
            </span>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <button
            onClick={onEdit}
            className="flex-1 px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 flex items-center justify-center gap-2 min-h-[44px]"
            aria-label={`Editar diseño de ${product.productName}`}
          >
            <Edit2 className="h-4 w-4" />
            Editar
          </button>
          
          <button
            onClick={onDelete}
            disabled={isDeleting}
            className="px-4 py-2 bg-white hover:bg-red-50 text-red-600 border border-red-200 hover:border-red-300 rounded-lg font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed min-h-[44px]"
            aria-label={`Eliminar ${product.productName}`}
          >
            {isDeleting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Trash2 className="h-4 w-4" />
            )}
          </button>
        </div>
      </div>
    </div>
  )
}

export function AddProductCard({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="rounded-lg border-2 border-dashed border-gray-300 hover:border-orange-400 hover:bg-orange-50 transition-all overflow-hidden aspect-square flex flex-col items-center justify-center gap-3 min-h-[320px] focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2"
      aria-label="Añadir nuevo producto"
    >
      <div className="w-16 h-16 rounded-full bg-orange-100 flex items-center justify-center">
        <Package className="h-8 w-8 text-orange-600" />
      </div>
      <div className="text-center px-4">
        <p className="font-semibold text-gray-900 mb-1">Añadir Producto</p>
        <p className="text-sm text-gray-500">
          Añade camisetas, tazas, gorras y más
        </p>
      </div>
    </button>
  )
}


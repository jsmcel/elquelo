'use client'

import { Modal } from './ui/Modal'
import { Breadcrumb } from './ui/Breadcrumb'
import { PrintfulDesignEditor } from './PrintfulDesignEditor'
import { QRProduct, QRDesignData } from '@/types/qr-product'
import { ArrowLeft } from 'lucide-react'

interface SingleProductEditorProps {
  qrCode: string
  qrContent: string
  product: QRProduct
  onSave: (designData: any) => void
  onBack: () => void
  onCancel: () => void
}

export function SingleProductEditor({
  qrCode,
  qrContent,
  product,
  onSave,
  onBack,
  onCancel
}: SingleProductEditorProps) {
  
  const breadcrumbItems = [
    { label: `QR ${qrCode}`, onClick: onBack },
    { label: 'Productos', onClick: onBack },
    { label: `Editando: ${product.productName}` }
  ]

  return (
    <Modal
      isOpen={true}
      onClose={onCancel}
      title="" // Sin título, usamos breadcrumb
      size="7xl"
      fullHeight={true}
    >
      {/* Header con Breadcrumb y Botón Volver */}
      <div className="border-b border-gray-200 bg-white px-6 py-4 sticky top-0 z-10">
        <div className="flex items-center justify-between mb-3">
          <Breadcrumb items={breadcrumbItems} />
          
          <button
            onClick={onBack}
            className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2"
            aria-label="Volver a productos"
          >
            <ArrowLeft className="h-4 w-4" />
            <span className="hidden sm:inline">Volver a Productos</span>
          </button>
        </div>
        
        {/* Información del producto */}
        <div className="flex items-center gap-3 text-sm text-gray-600">
          <span className="font-medium text-gray-900">{product.productName}</span>
          {product.size && (
            <>
              <span className="text-gray-300">•</span>
              <span>{product.size}</span>
            </>
          )}
          {product.color && (
            <>
              <span className="text-gray-300">•</span>
              <div className="flex items-center gap-1">
                {product.colorCode && (
                  <span
                    className="w-3 h-3 rounded-full border border-gray-300"
                    style={{ backgroundColor: product.colorCode }}
                  />
                )}
                <span>{product.color}</span>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Editor (sin header propio, ya lo tenemos arriba) */}
      <div className="flex-1 overflow-hidden">
        <PrintfulDesignEditor
          qrCode={qrCode}
          qrContent={qrContent}
          onSave={onSave}
          onClose={onCancel}
          savedDesignData={{
            printfulProduct: {
              productId: product.productId,
              templateId: product.templateId,
              variantId: product.variantId || 0,
              name: product.productName
            },
            printful: {
              variantId: product.variantId || 0,
              size: product.size,
              color: product.color,
              colorCode: product.colorCode,
              placements: Object.fromEntries(
                Object.entries(product.designsByPlacement || {}).map(([placement, url]) => 
                  [placement, { imageUrl: url || null }]
                )
              ),
              designMetadata: product.designMetadata,
              variantMockups: product.variantMockups
            },
            designsByPlacement: product.designsByPlacement || {},
            designMetadata: product.designMetadata || {},
            variantMockups: product.variantMockups || {}
          }}
        />
      </div>
    </Modal>
  )
}


'use client'

import { PlusCircle, Edit2, Trash2 } from 'lucide-react'
import { migrateLegacyDesign } from '@/types/qr-product'
import { Modal, ModalFooter } from './ui/Modal'
import { useState } from 'react'
import { toast } from 'react-hot-toast'

interface ViewMultiProductDesignModalProps {
  qrCode: string
  designData: any
  onClose: () => void
  onEdit?: (qrCode: string) => void
}

export function ViewMultiProductDesignModal({ qrCode, designData, onClose, onEdit }: ViewMultiProductDesignModalProps) {
  // Migrar a formato v2.0 si es necesario
  const [currentDesignData, setCurrentDesignData] = useState(designData)
  const migratedDesign = migrateLegacyDesign(currentDesignData)
  const products = migratedDesign.products || []
  const [deletingProductId, setDeletingProductId] = useState<string | null>(null)

  const handleEditDesigns = () => {
    if (onEdit) {
      onEdit(qrCode)
      onClose()
    } else {
      toast.error('No se puede editar desde aquí')
    }
  }

  const handleDeleteProduct = async (productId: string) => {
    if (products.length === 1) {
      toast.error('No puedes eliminar el único producto. Edita el diseño para agregar otro primero.')
      setDeletingProductId(null)
      return
    }

    try {
      // Filtrar el producto a eliminar
      const updatedProducts = products.filter(p => p.id !== productId)
      const updatedDesignData = {
        ...migratedDesign,
        products: updatedProducts,
        lastUpdated: new Date().toISOString()
      }

      // Guardar en la base de datos
      const response = await fetch('/api/design/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          qrCode,
          designData: updatedDesignData
        })
      })

      if (!response.ok) {
        throw new Error('Error al eliminar producto')
      }

      toast.success('Producto eliminado correctamente')
      setCurrentDesignData(updatedDesignData)
      setDeletingProductId(null)
    } catch (error) {
      console.error('Error deleting product:', error)
      toast.error('Error al eliminar el producto')
      setDeletingProductId(null)
    }
  }

  return (
    <Modal
      isOpen={true}
      onClose={onClose}
      title={`Diseños - QR ${qrCode}`}
      description={`${products.length} producto${products.length !== 1 ? 's' : ''} configurado${products.length !== 1 ? 's' : ''}`}
      size="6xl"
    >
      <div className="space-y-4 sm:space-y-6">
        {products.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <p>No hay productos configurados</p>
          </div>
        ) : (
          <div className="space-y-4 sm:space-y-6">
            {products.map((product, index) => (
              <div
                key={product.id}
                className="border border-gray-200 rounded-xl overflow-hidden bg-gray-50"
              >
                {/* Product Header */}
                <div className="bg-white p-4 border-b border-gray-200">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary-600 text-white flex items-center justify-center font-bold">
                      {index + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-base sm:text-lg font-semibold text-gray-900 truncate">
                        {product.productName}
                      </h4>
                      <div className="flex flex-wrap items-center gap-2 sm:gap-3 mt-1">
                        {product.size && (
                          <span className="text-xs sm:text-sm text-gray-600 bg-gray-100 px-2 py-0.5 rounded">
                            {product.size}
                          </span>
                        )}
                        {product.color && (
                          <span className="flex items-center gap-1.5 text-xs sm:text-sm text-gray-600">
                            {product.colorCode && (
                              <span
                                className="w-4 h-4 rounded-full border border-gray-300 flex-shrink-0"
                                style={{ backgroundColor: product.colorCode }}
                              />
                            )}
                            {product.color}
                          </span>
                        )}
                        <span className="text-xs text-gray-500">
                          Variant ID: {product.variantId}
                        </span>
                      </div>
                    </div>
                    
                    {/* Botones de acción */}
                    <div className="flex items-center gap-2 w-full sm:w-auto">
                      <button
                        onClick={handleEditDesigns}
                        className="flex-1 sm:flex-initial min-h-[44px] min-w-[44px] flex items-center justify-center p-2 text-primary-600 hover:bg-primary-50 rounded-lg transition-colors touch-manipulation"
                        title="Editar este producto"
                      >
                        <Edit2 className="h-5 w-5" />
                      </button>
                      <button
                        onClick={() => setDeletingProductId(product.id)}
                        className="flex-1 sm:flex-initial min-h-[44px] min-w-[44px] flex items-center justify-center p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors touch-manipulation"
                        title="Eliminar producto"
                      >
                        <Trash2 className="h-5 w-5" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Product Content */}
                <div className="p-4">
                  {/* Mockups */}
                  {product.variantMockups && Object.keys(product.variantMockups).length > 0 ? (
                    <div>
                      <h5 className="text-sm font-semibold text-gray-900 mb-3">Mockups Generados</h5>
                      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                          {Object.entries(product.variantMockups).map(([variantId, placements]: [string, any]) =>
                            Object.entries(placements || {}).map(([placement, mockup]: [string, any]) => (
                              <div
                                key={`${variantId}-${placement}`}
                                className="space-y-2 rounded-lg border border-gray-200 bg-white p-3 shadow-sm"
                              >
                                <img
                                  src={mockup.url}
                                  alt={`Mockup ${placement}`}
                                  className="w-full rounded-lg object-cover"
                                />
                                <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                                  {placement}
                                </p>
                              </div>
                            ))
                          )}
                        </div>
                      </div>
                  ) : (
                    /* Designs by Placement */
                    <div>
                      <h5 className="text-sm font-semibold text-gray-900 mb-3">Diseños por Área</h5>
                      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                          {Object.entries(product.designsByPlacement || {})
                            .filter(([_, url]) => url && url.trim() !== '')
                            .map(([placement, url]) => (
                              <div
                                key={placement}
                                className="space-y-2 rounded-lg border border-gray-200 bg-white p-3 shadow-sm"
                              >
                                <img
                                  src={url as string}
                                  alt={`Diseño ${placement}`}
                                  className="w-full rounded-lg object-cover"
                                  onError={(e) => {
                                    ;(e.target as HTMLImageElement).style.display = 'none'
                                  }}
                                />
                                <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                                  {placement}
                                </p>
                              </div>
                            ))}
                        </div>
                      </div>
                    )}

                  {/* Metadata */}
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-4 text-xs text-gray-600">
                      <div>
                        <span className="font-semibold">Creado:</span>{' '}
                        {new Date(product.createdAt).toLocaleString('es-ES')}
                      </div>
                      <div>
                        <span className="font-semibold">Actualizado:</span>{' '}
                        {new Date(product.updatedAt).toLocaleString('es-ES')}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Footer Buttons */}
        <ModalFooter className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={onClose}
            className="w-full sm:w-auto min-h-[44px] px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium rounded-lg transition-colors touch-manipulation"
          >
            Cerrar
          </button>
          {onEdit && (
            <button
              onClick={handleEditDesigns}
              className="w-full sm:flex-1 min-h-[44px] px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-lg transition-colors flex items-center justify-center gap-2 touch-manipulation"
            >
              <PlusCircle className="h-4 w-4" />
              Añadir Producto
            </button>
          )}
        </ModalFooter>
      </div>

      {/* Modal de confirmación de eliminación */}
      <Modal
        isOpen={!!deletingProductId}
        onClose={() => setDeletingProductId(null)}
        title="Confirmar eliminación"
        description="¿Estás seguro de que quieres eliminar este producto? Esta acción no se puede deshacer."
        size="md"
      >
        <ModalFooter className="flex flex-col-reverse sm:flex-row gap-3 sm:justify-end">
          <button
            onClick={() => setDeletingProductId(null)}
            className="w-full sm:w-auto min-h-[44px] rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 touch-manipulation"
          >
            Cancelar
          </button>
          <button
            onClick={() => deletingProductId && handleDeleteProduct(deletingProductId)}
            className="w-full sm:w-auto min-h-[44px] rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 touch-manipulation"
          >
            Eliminar
          </button>
        </ModalFooter>
      </Modal>
    </Modal>
  )
}


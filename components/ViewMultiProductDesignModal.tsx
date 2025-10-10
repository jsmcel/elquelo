'use client'

import { X, PlusCircle, Edit2, Trash2 } from 'lucide-react'
import { migrateLegacyDesign } from '@/types/qr-product'
import { QRProductsList } from './QRProductsList'
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div>
            <h3 className="text-xl font-bold text-gray-900">
              Diseños - QR {qrCode}
            </h3>
            <p className="text-sm text-gray-600 mt-1">
              {products.length} producto{products.length !== 1 ? 's' : ''} configurado{products.length !== 1 ? 's' : ''}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-auto flex-1">
          {products.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <p>No hay productos configurados</p>
            </div>
          ) : (
            <div className="space-y-6">
              {products.map((product, index) => (
                <div
                  key={product.id}
                  className="border border-gray-200 rounded-xl overflow-hidden bg-gray-50"
                >
                  {/* Product Header */}
                  <div className="bg-white p-4 border-b border-gray-200">
                    <div className="flex items-center gap-3">
                      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary-600 text-white flex items-center justify-center font-bold">
                        {index + 1}
                      </div>
                      <div className="flex-1">
                        <h4 className="text-lg font-semibold text-gray-900">
                          {product.productName}
                        </h4>
                        <div className="flex items-center gap-3 mt-1">
                          {product.size && (
                            <span className="text-sm text-gray-600 bg-gray-100 px-2 py-0.5 rounded">
                              {product.size}
                            </span>
                          )}
                          {product.color && (
                            <span className="flex items-center gap-1.5 text-sm text-gray-600">
                              {product.colorCode && (
                                <span
                                  className="w-4 h-4 rounded-full border border-gray-300"
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
                      <div className="flex items-center gap-2">
                        <button
                          onClick={handleEditDesigns}
                          className="p-2 text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                          title="Editar este producto"
                        >
                          <Edit2 className="h-5 w-5" />
                        </button>
                        <button
                          onClick={() => setDeletingProductId(product.id)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
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
                        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
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
                        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
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
                      <div className="grid grid-cols-2 gap-4 text-xs text-gray-600">
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
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 p-4 bg-gray-50 flex gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium rounded-lg transition-colors"
          >
            Cerrar
          </button>
          {onEdit && (
            <button
              onClick={handleEditDesigns}
              className="flex-1 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              <PlusCircle className="h-4 w-4" />
              Añadir Producto
            </button>
          )}
        </div>

        {/* Modal de confirmación de eliminación */}
        {deletingProductId && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40">
            <div className="rounded-lg bg-white p-6 shadow-xl max-w-md mx-4">
              <h3 className="mb-3 text-lg font-bold text-gray-900">Confirmar eliminación</h3>
              <p className="mb-4 text-sm text-gray-600">
                ¿Estás seguro de que quieres eliminar este producto? Esta acción no se puede deshacer.
              </p>
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setDeletingProductId(null)}
                  className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  onClick={() => handleDeleteProduct(deletingProductId)}
                  className="rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
                >
                  Eliminar
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}


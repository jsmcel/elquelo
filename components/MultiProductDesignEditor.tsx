'use client'

import { useState, useEffect } from 'react'
import { PrintfulDesignEditor } from './PrintfulDesignEditor'
import { ProductListManager } from './ProductListManager'
import { QRProduct, QRDesignData, migrateLegacyDesign } from '@/types/qr-product'
import { toast } from 'react-hot-toast'
import { X, Edit2, Image as ImageIcon } from 'lucide-react'
import { Modal, ModalFooter } from './ui/Modal'

interface MultiProductDesignEditorProps {
  qrCode: string
  qrContent: string
  onSave: (designData: QRDesignData) => void
  onClose: () => void
  savedDesignData?: any
}

export function MultiProductDesignEditor({
  qrCode,
  qrContent,
  onSave,
  onClose,
  savedDesignData
}: MultiProductDesignEditorProps) {
  // Migrar diseño legacy si es necesario
  const initialDesign = savedDesignData 
    ? migrateLegacyDesign(savedDesignData)
    : { version: '2.0' as const, products: [], qrCode, lastUpdated: new Date().toISOString() }

  const [products, setProducts] = useState<QRProduct[]>(initialDesign.products)
  const [selectedProductId, setSelectedProductId] = useState<string | null>(
    initialDesign.products[0]?.id || null
  )
  const [editingProduct, setEditingProduct] = useState<QRProduct | null>(null)
  const [showEditor, setShowEditor] = useState(false)
  const [saving, setSaving] = useState(false)

  // Obtener el producto seleccionado actualmente
  const selectedProduct = products.find(p => p.id === selectedProductId) || null

  const handleAddProduct = () => {
    // Crear nuevo producto vacío
    const newProduct: Partial<QRProduct> = {
      id: crypto.randomUUID ? crypto.randomUUID() : `product-${Date.now()}`,
      productId: 71, // Default product
      templateId: 71,
      variantId: 0, // Se configurará en el editor
      productName: 'Nuevo Producto',
      size: null,
      color: null,
      colorCode: null,
      designsByPlacement: {},
      designMetadata: {},
      variantMockups: {},
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }

    // Abre el editor para configurar el nuevo producto
    setEditingProduct(newProduct as QRProduct)
    setShowEditor(true)
  }

  const handleDeleteProduct = (productId: string) => {
    setProducts(prev => prev.filter(p => p.id !== productId))
    if (selectedProductId === productId) {
      setSelectedProductId(products[0]?.id || null)
    }
    toast.success('Producto eliminado')
  }

  const handleSelectProduct = (productId: string) => {
    // Solo seleccionar para mostrar vista previa
    setSelectedProductId(productId)
    setShowEditor(false)
    setEditingProduct(null)
  }

  const handleEditProduct = (productId: string) => {
    // Abrir editor para editar el producto
    const product = products.find(p => p.id === productId)
    if (product) {
      setSelectedProductId(productId)
      setEditingProduct(product)
      setShowEditor(true)
    }
  }

  const handleSaveProductDesign = (designData: any) => {
    console.log('🔄 [MultiProductDesignEditor] Recibido designData:', designData?.designsByPlacement)
    console.log('🔄 [MultiProductDesignEditor] EditingProduct:', editingProduct?.designsByPlacement)
    console.log('🔄 [MultiProductDesignEditor] Full designData:', JSON.stringify(designData, null, 2))

    // Convertir el diseño al formato QRProduct
    const updatedProduct: QRProduct = {
      id: editingProduct?.id || crypto.randomUUID(),
      productId: designData?.productId || designData?.printfulProduct?.productId || 71,
      templateId: designData?.templateId || designData?.printfulProduct?.templateId || 71,
      variantId: designData?.printfulProduct?.variantId || designData?.printful?.variantId || 0,
      productName: designData?.productName || designData?.printfulProduct?.name || 'Producto',
      size: designData?.printful?.size || designData?.printfulProduct?.size || editingProduct?.size || null,
      color: designData?.printful?.color || designData?.printfulProduct?.color || editingProduct?.color || null,
      colorCode: designData?.printful?.colorCode || designData?.printfulProduct?.colorCode || editingProduct?.colorCode || null,
      // CRÍTICO: Priorizar designData sobre editingProduct para preservar imágenes nuevas
      designsByPlacement: {
        ...(editingProduct?.designsByPlacement || {}),
        ...(designData?.designsByPlacement || {}),
        ...(designData?.printful?.placements ? 
          Object.fromEntries(
            Object.entries(designData.printful.placements).map(([k, v]: [string, any]) => [k, v?.imageUrl || v])
          ) : {}
        ),
      },
      designMetadata: {
        ...(editingProduct?.designMetadata || {}),
        ...(designData?.designMetadata || {}),
        ...(designData?.printful?.designMetadata || {}),
      },
      variantMockups: designData?.variantMockups || designData?.printful?.variantMockups || editingProduct?.variantMockups || {},
      createdAt: editingProduct?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
    
    console.log('✅ [MultiProductDesignEditor] Resultado final designsByPlacement:', updatedProduct.designsByPlacement)
    console.log('✅ [MultiProductDesignEditor] Full updatedProduct:', JSON.stringify(updatedProduct, null, 2))

    // Validar que tiene variantId
    if (!updatedProduct.variantId || updatedProduct.variantId === 0) {
      toast.error('Debes seleccionar una talla y color antes de guardar')
      return
    }

    // Actualizar o agregar el producto
    setProducts(prev => {
      const existingIndex = prev.findIndex(p => p.id === updatedProduct.id)
      if (existingIndex >= 0) {
        // Actualizar existente
        const updated = [...prev]
        updated[existingIndex] = updatedProduct
        return updated
      } else {
        // Agregar nuevo
        return [...prev, updatedProduct]
      }
    })

    setSelectedProductId(updatedProduct.id)
    setShowEditor(false)
    setEditingProduct(null)
    toast.success('Producto guardado')
  }

  const handleSaveAll = async () => {
    console.log('💾 [MultiProductDesignEditor] handleSaveAll iniciado')
    console.log('💾 [MultiProductDesignEditor] Products:', JSON.stringify(products, null, 2))
    
    if (products.length === 0) {
      toast.error('Debes agregar al menos un producto')
      return
    }

    // Validar que todos los productos tienen variantId
    const invalidProducts = products.filter(p => !p.variantId || p.variantId === 0)
    if (invalidProducts.length > 0) {
      toast.error('Algunos productos no tienen configuración completa')
      return
    }

    setSaving(true)
    try {
    const finalDesign: QRDesignData = {
      version: '2.0',
      products,
      qrCode,
      lastUpdated: new Date().toISOString()
    }

      await onSave(finalDesign)
      toast.success('Diseño guardado correctamente')
    } catch (error) {
      console.error('Error saving design:', error)
      toast.error('Error al guardar el diseño')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal
      isOpen={true}
      onClose={onClose}
      title="Diseñador Multi-Producto"
      description={`QR: ${qrCode}`}
      size="7xl"
      fullHeight={true}
    >
        {/* Content */}
      <div className="flex-1 flex flex-col lg:flex-row gap-4 overflow-hidden">
          {/* Sidebar - Lista de productos */}
        <div className="w-full lg:w-80 flex-shrink-0 overflow-y-auto">
            <ProductListManager
              products={products}
              selectedProductId={selectedProductId}
              onSelectProduct={handleSelectProduct}
              onAddProduct={handleAddProduct}
              onDeleteProduct={handleDeleteProduct}
            onEditProduct={handleEditProduct}
            />
          </div>

          {/* Editor Area */}
        <div className="flex-1 bg-gray-50 rounded-lg border border-gray-200 flex items-center justify-center min-h-[400px] lg:min-h-0">
            {showEditor && editingProduct ? (
              <div className="w-full h-full relative">
                <PrintfulDesignEditor
                  qrCode={qrCode}
                  qrContent={qrContent}
                  onSave={handleSaveProductDesign}
                  onClose={() => {
                    setShowEditor(false)
                    setEditingProduct(null)
                  }}
                  savedDesignData={{
                          printfulProduct: {
                            productId: editingProduct.productId,
                            templateId: editingProduct.templateId,
                      variantId: editingProduct.variantId || 0,
                            name: editingProduct.productName
                          },
                          printful: {
                      variantId: editingProduct.variantId || 0,
                            size: editingProduct.size,
                            color: editingProduct.color,
                            colorCode: editingProduct.colorCode,
                            // CRÍTICO: Convertir designsByPlacement al formato correcto
                            placements: Object.fromEntries(
                              Object.entries(editingProduct.designsByPlacement || {}).map(([placement, url]) => 
                                [placement, { imageUrl: url || null }]
                              )
                            ),
                            designMetadata: editingProduct.designMetadata,
                            variantMockups: editingProduct.variantMockups
                          },
                          designsByPlacement: editingProduct.designsByPlacement || {},
                          designMetadata: editingProduct.designMetadata || {},
                          variantMockups: editingProduct.variantMockups || {}
                  }}
                />
              </div>
            ) : selectedProduct ? (
              <div className="w-full h-full p-8 overflow-y-auto">
                <div className="max-w-3xl mx-auto">
                  <div className="mb-6">
                    <h3 className="text-2xl font-bold text-gray-900">{selectedProduct.productName}</h3>
                    <div className="flex items-center gap-3 mt-2">
                      {selectedProduct.size && (
                        <span className="px-3 py-1 bg-gray-100 rounded-lg text-sm font-medium text-gray-700">
                          {selectedProduct.size}
                        </span>
                      )}
                      {selectedProduct.color && (
                        <span className="flex items-center gap-2 px-3 py-1 bg-gray-100 rounded-lg text-sm font-medium text-gray-700">
                          {selectedProduct.colorCode && (
                            <span
                              className="w-4 h-4 rounded-full border border-gray-300"
                              style={{ backgroundColor: selectedProduct.colorCode }}
                            />
                          )}
                          {selectedProduct.color}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Mockups */}
                  {selectedProduct.variantMockups && Object.keys(selectedProduct.variantMockups).length > 0 ? (
                    <div className="space-y-6">
                      <h4 className="text-lg font-semibold text-gray-900">Mockups</h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        {Object.entries(selectedProduct.variantMockups).map(([variantId, mockupsByPlacement]: [string, any]) => (
                          Object.entries(mockupsByPlacement).map(([placement, mockup]: [string, any]) => (
                            <div key={`${variantId}-${placement}`} className="space-y-2">
                              <p className="text-sm font-medium text-gray-700 capitalize">{placement}</p>
                              <div className="aspect-square rounded-lg overflow-hidden bg-gray-100 border-2 border-gray-200">
                                <img
                                  src={mockup.url}
                                  alt={`${placement} mockup`}
                                  className="w-full h-full object-contain"
                                />
                              </div>
                            </div>
                          ))
                        ))}
                      </div>
                    </div>
                  ) : selectedProduct.designsByPlacement && Object.keys(selectedProduct.designsByPlacement).length > 0 ? (
                    <div className="space-y-6">
                      <h4 className="text-lg font-semibold text-gray-900">Diseños</h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        {Object.entries(selectedProduct.designsByPlacement).map(([placement, imageUrl]: [string, any]) => (
                          <div key={placement} className="space-y-2">
                            <p className="text-sm font-medium text-gray-700 capitalize">{placement}</p>
                            <div className="aspect-square rounded-lg overflow-hidden bg-gray-100 border-2 border-gray-200">
                              <img
                                src={imageUrl}
                                alt={`${placement} design`}
                                className="w-full h-full object-contain"
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-12 text-gray-500">
                      <ImageIcon className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                      <p className="text-lg mb-2">Sin diseño todavía</p>
                      <p className="text-sm">Haz clic en el producto para editarlo</p>
                    </div>
                  )}

                  {/* Botón de editar */}
                  <div className="mt-8 flex justify-center">
                    <button
                      onClick={() => handleEditProduct(selectedProduct.id)}
                      className="px-6 py-3 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 transition-colors flex items-center gap-2"
                    >
                      <Edit2 className="h-5 w-5" />
                      Editar Diseño
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center text-gray-500">
                <p className="text-lg mb-2">👈 Selecciona o agrega un producto</p>
                <p className="text-sm">Cada producto puede tener su propio diseño</p>
              </div>
            )}
          </div>
      </div>

      {/* Footer con botón sticky */}
      <ModalFooter className="sticky bottom-0 bg-white border-t border-gray-200">
        <button
          onClick={handleSaveAll}
          disabled={products.length === 0 || saving}
          className="w-full min-h-[44px] px-6 py-2 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2 touch-manipulation"
        >
          {saving ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              Guardando...
            </>
          ) : (
            'Guardar Todo'
          )}
            </button>
      </ModalFooter>
    </Modal>
  )
}


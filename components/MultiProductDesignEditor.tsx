'use client'

import { useState, useEffect } from 'react'
import { PrintfulDesignEditor } from './PrintfulDesignEditor'
import { ProductListManager } from './ProductListManager'
import { QRProduct, QRDesignData, migrateLegacyDesign } from '@/types/qr-product'
import { toast } from 'react-hot-toast'
import { X } from 'lucide-react'

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
    const product = products.find(p => p.id === productId)
    if (product) {
      setSelectedProductId(productId)
      setEditingProduct(product)
      setShowEditor(true)
    }
  }

  const handleSaveProductDesign = (designData: any) => {
    console.log('Guardando diseño de producto:', designData)

    // Convertir el diseño al formato QRProduct
    const updatedProduct: QRProduct = {
      id: editingProduct?.id || crypto.randomUUID(),
      productId: designData?.productId || designData?.printfulProduct?.productId || 71,
      templateId: designData?.templateId || designData?.printfulProduct?.templateId || 71,
      variantId: designData?.printfulProduct?.variantId || designData?.printful?.variantId || 0,
      productName: designData?.productName || designData?.printfulProduct?.name || 'Producto',
      size: designData?.printful?.size || designData?.printfulProduct?.size || null,
      color: designData?.printful?.color || designData?.printfulProduct?.color || null,
      colorCode: designData?.printful?.colorCode || designData?.printfulProduct?.colorCode || null,
      designsByPlacement: designData?.designsByPlacement || designData?.printful?.placements || {},
      designMetadata: designData?.designMetadata || designData?.printful?.designMetadata || {},
      variantMockups: designData?.variantMockups || designData?.printful?.variantMockups || {},
      createdAt: editingProduct?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }

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

  const handleSaveAll = () => {
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

    const finalDesign: QRDesignData = {
      version: '2.0',
      products,
      qrCode,
      lastUpdated: new Date().toISOString()
    }

    onSave(finalDesign)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="relative w-full max-w-7xl h-[90vh] rounded-3xl bg-white shadow-2xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              Diseñador Multi-Producto
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              QR: <span className="font-mono font-semibold">{qrCode}</span>
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 flex gap-4 p-6 overflow-hidden">
          {/* Sidebar - Lista de productos */}
          <div className="w-80 flex-shrink-0 overflow-y-auto">
            <ProductListManager
              products={products}
              selectedProductId={selectedProductId}
              onSelectProduct={handleSelectProduct}
              onAddProduct={handleAddProduct}
              onDeleteProduct={handleDeleteProduct}
            />
          </div>

          {/* Editor Area */}
          <div className="flex-1 bg-gray-50 rounded-lg border border-gray-200 flex items-center justify-center">
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
                  savedDesignData={
                    editingProduct.variantId
                      ? {
                          printfulProduct: {
                            productId: editingProduct.productId,
                            templateId: editingProduct.templateId,
                            variantId: editingProduct.variantId,
                            name: editingProduct.productName
                          },
                          printful: {
                            variantId: editingProduct.variantId,
                            size: editingProduct.size,
                            color: editingProduct.color,
                            colorCode: editingProduct.colorCode,
                            placements: editingProduct.designsByPlacement,
                            designMetadata: editingProduct.designMetadata,
                            variantMockups: editingProduct.variantMockups
                          },
                          designsByPlacement: editingProduct.designsByPlacement,
                          designMetadata: editingProduct.designMetadata,
                          variantMockups: editingProduct.variantMockups
                        }
                      : undefined
                  }
                />
              </div>
            ) : (
              <div className="text-center text-gray-500">
                <p className="text-lg mb-2">👈 Selecciona o agrega un producto</p>
                <p className="text-sm">Cada producto puede tener su propio diseño</p>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-gray-200 bg-gray-50">
          <div className="text-sm text-gray-600">
            {products.length} producto{products.length !== 1 ? 's' : ''} configurado{products.length !== 1 ? 's' : ''}
          </div>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="px-6 py-2 text-gray-700 hover:bg-gray-100 rounded-lg font-medium transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={handleSaveAll}
              disabled={products.length === 0}
              className="px-6 py-2 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Guardar Todo
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}


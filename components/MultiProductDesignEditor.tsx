'use client'

import { useState, useMemo } from 'react'
import { ProductCard, AddProductCard } from './ProductCard'
import { QRProduct, QRDesignData, migrateLegacyDesign } from '@/types/qr-product'
import { toast } from 'react-hot-toast'
import { Loader2 } from 'lucide-react'
import { Modal, ModalFooter } from './ui/Modal'

interface MultiProductDesignEditorProps {
  qrCode: string
  qrContent: string
  onSave: (designData: QRDesignData) => void
  onClose: () => void
  onEditProduct: (productId: string) => void // Nueva prop para abrir editor individual
  savedDesignData?: any
}

export function MultiProductDesignEditor({
  qrCode,
  qrContent,
  onSave,
  onClose,
  onEditProduct,
  savedDesignData
}: MultiProductDesignEditorProps) {
  // Migrar diseño legacy si es necesario
  const initialDesign = savedDesignData 
    ? migrateLegacyDesign(savedDesignData)
    : { version: '2.0' as const, products: [], qrCode, lastUpdated: new Date().toISOString() }

  const [products, setProducts] = useState<QRProduct[]>(initialDesign.products)
  const [saving, setSaving] = useState(false)
  const [deletingProductId, setDeletingProductId] = useState<string | null>(null)
  const [tempNewProductId, setTempNewProductId] = useState<string | null>(null) // Producto temporal en creación

  const handleAddProduct = () => {
    // Crear ID temporal para el nuevo producto
    const newProductId = crypto.randomUUID ? crypto.randomUUID() : `product-${Date.now()}`
    setTempNewProductId(newProductId)
    
    // Abrir editor individual (pasando el ID del producto que se está creando)
    onEditProduct(newProductId)
  }

  const handleDeleteProduct = (productId: string) => {
    if (products.length === 1) {
      toast.error('Debe haber al menos un producto')
      return
    }
    
    setDeletingProductId(productId)
    // Simular delay para feedback visual
    setTimeout(() => {
      setProducts(prev => prev.filter(p => p.id !== productId))
      setDeletingProductId(null)
      toast.success('Producto eliminado')
    }, 300)
  }

  // Función expuesta para actualizar un producto desde el exterior (QRGenerator)
  // Ya no manejamos la edición aquí, solo mostramos y guardamos


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

  // Agrupar productos por categoría (tipo de producto)
  const categorizedProducts = useMemo(() => {
    const categories: Record<string, { name: string; icon: string; products: QRProduct[] }> = {
      ropa: { name: 'Ropa', icon: '👕', products: [] },
      accesorios: { name: 'Accesorios', icon: '🎒', products: [] },
      hogar: { name: 'Hogar y Oficina', icon: '🏠', products: [] },
      otros: { name: 'Otros', icon: '🎁', products: [] }
    }

    products.forEach(product => {
      // Categorizar por productId
      if ([71, 145, 242].includes(product.productId)) {
        // Camisetas, sudaderas, crop tops
        categories.ropa.products.push(product)
      } else if ([92, 382, 257, 259].includes(product.productId)) {
        // Gorras, botellas, tote bags
        categories.accesorios.products.push(product)
      } else if ([19, 474, 1].includes(product.productId)) {
        // Tazas, libretas, posters
        categories.hogar.products.push(product)
      } else {
        categories.otros.products.push(product)
      }
    })

    // Filtrar categorías vacías
    return Object.entries(categories)
      .filter(([_, cat]) => cat.products.length > 0)
      .map(([key, cat]) => ({ key, ...cat }))
  }, [products])

  return (
    <Modal
      isOpen={true}
      onClose={onClose}
      title="Productos del QR"
      description={`Código: ${qrCode}`}
      size="6xl"
    >
      {/* Content - Grid de productos por categorías */}
      <div className="flex-1 overflow-y-auto p-6">
        {products.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-20 h-20 bg-orange-100 rounded-full mx-auto mb-4 flex items-center justify-center">
              <Loader2 className="h-10 w-10 text-orange-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Sin productos todavía</h3>
            <p className="text-gray-600 mb-6">Añade tu primer producto para comenzar a diseñar</p>
            <button
              onClick={handleAddProduct}
              className="px-6 py-3 bg-orange-600 hover:bg-orange-700 text-white rounded-lg font-medium transition-colors inline-flex items-center gap-2"
            >
              Añadir Producto
            </button>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Renderizar cada categoría */}
            {categorizedProducts.map((category) => (
              <div key={category.key}>
                {/* Header de categoría */}
                <div className="mb-4 pb-2 border-b border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                    <span className="text-2xl">{category.icon}</span>
                    {category.name}
                    <span className="text-sm font-normal text-gray-500">
                      ({category.products.length})
                    </span>
                  </h3>
                </div>

                {/* Grid de productos de esta categoría */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {category.products.map((product) => (
                    <ProductCard
                      key={product.id}
                      product={product}
                      onEdit={() => onEditProduct(product.id)}
                      onDelete={() => handleDeleteProduct(product.id)}
                      isDeleting={deletingProductId === product.id}
                    />
                  ))}
                </div>
              </div>
            ))}
            
            {/* Sección para añadir productos */}
            <div>
              <div className="mb-4 pb-2 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <span className="text-2xl">➕</span>
                  Añadir Nuevo
                </h3>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                <AddProductCard onClick={handleAddProduct} />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Footer con botones */}
      <ModalFooter className="sticky bottom-0 bg-white border-t border-gray-200 flex gap-3">
        <button
          onClick={onClose}
          className="flex-1 px-6 py-3 bg-white border-2 border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors min-h-[44px]"
        >
          Cerrar
        </button>
        <button
          onClick={handleSaveAll}
          disabled={products.length === 0 || saving}
          className="flex-1 px-6 py-3 bg-orange-600 text-white rounded-lg font-medium hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2 min-h-[44px]"
        >
          {saving ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
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


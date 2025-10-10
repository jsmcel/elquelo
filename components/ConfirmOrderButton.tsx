'use client'

import { useState, useEffect } from 'react'
import { useUser } from '@/app/providers'
import { toast } from 'react-hot-toast'
import { ShoppingCart, Loader2, Check } from 'lucide-react'
import { QRDesignData as QRDesignDataType, migrateLegacyDesign } from '@/types/qr-product'

interface ConfirmOrderButtonProps {
  qrCodes: string[]
  className?: string
  refreshKey?: number // Para forzar recarga de precios
}

interface ProductItem {
  qrCode: string
  productId: string // UUID del producto en el QR
  variantId: number
  productName: string
  price: number
}

export function ConfirmOrderButton({ qrCodes, className = '', refreshKey = 0 }: ConfirmOrderButtonProps) {
  const { user } = useUser()
  const [confirming, setConfirming] = useState(false)
  const [loadingPrices, setLoadingPrices] = useState(true)
  const [productItems, setProductItems] = useState<ProductItem[]>([])
  const [totalPrice, setTotalPrice] = useState(0)
  const [totalProducts, setTotalProducts] = useState(0)

  // Cargar diseños y precios al montar
  useEffect(() => {
    async function loadDesignsAndPrices() {
      if (!user || qrCodes.length === 0) {
        setLoadingPrices(false)
        return
      }

      try {
        // Cargar diseños de todos los QRs
        const designPromises = qrCodes.map(async (code) => {
          try {
            const response = await fetch(`/api/design/${code}`)
            if (response.ok) {
              const data = await response.json()
              return {
                code,
                designData: data.designData
              }
            }
          } catch (error) {
            console.error(`Error loading design for ${code}:`, error)
          }
          return { code, designData: null }
        })

        const designs = await Promise.all(designPromises)
        
        // Convertir y extraer todos los productos de todos los QRs
        const allProducts: { qrCode: string; productId: string; variantId: number; productName: string }[] = []
        
        designs.forEach(({ code, designData }) => {
          if (!designData) return

          // Migrar a nuevo formato si es necesario
          const migratedDesign = migrateLegacyDesign(designData)
          
          // Extraer productos (solo los activos, no los de la papelera)
          if (migratedDesign.products && migratedDesign.products.length > 0) {
            migratedDesign.products.forEach(product => {
              if (product.variantId && !product.deletedAt) {
                allProducts.push({
                  qrCode: code,
                  productId: product.id,
                  variantId: product.variantId,
                  productName: product.productName
                })
              }
            })
          }
        })

        // Si no hay productos activos, no mostrar el componente
        if (allProducts.length === 0) {
          setProductItems([])
          setTotalProducts(0)
          setTotalPrice(0)
          setLoadingPrices(false)
          return
        }

        // Extraer todos los variantIds únicos
        const uniqueVariantIds = new Set(allProducts.map(p => p.variantId))
        const variantIds = Array.from(uniqueVariantIds)

        // Obtener precios de las variantes
        const priceResponse = await fetch('/api/printful/variants/price', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ variantIds })
        })

        if (!priceResponse.ok) {
          throw new Error('Error obteniendo precios')
        }

        const { prices } = await priceResponse.json()

        // Crear lista de productos con sus precios
        const productsWithPrices: ProductItem[] = allProducts.map(product => {
          let price = 29 // Fallback
          if (prices[product.variantId]) {
            price = prices[product.variantId].finalPrice
          }

          return {
            qrCode: product.qrCode,
            productId: product.productId,
            variantId: product.variantId,
            productName: product.productName,
            price
          }
        })

        setProductItems(productsWithPrices)
        setTotalProducts(productsWithPrices.length)
        const total = productsWithPrices.reduce((sum, item) => sum + item.price, 0)
        setTotalPrice(Math.round(total * 100) / 100)
      } catch (error) {
        console.error('Error loading prices:', error)
        // Usar precios por defecto en caso de error
        const defaultItems: ProductItem[] = qrCodes.map(code => ({
          qrCode: code,
          productId: `default-${code}`,
          variantId: 0,
          productName: 'Producto personalizado',
          price: 29
        }))
        setProductItems(defaultItems)
        setTotalProducts(qrCodes.length)
        setTotalPrice(qrCodes.length * 29)
      } finally {
        setLoadingPrices(false)
      }
    }

    loadDesignsAndPrices()
  }, [user, qrCodes, refreshKey])

  const handleConfirmOrder = async () => {
    if (!user) {
      toast.error('Debes iniciar sesión para continuar')
      return
    }

    if (productItems.length === 0) {
      toast.error('No hay productos para confirmar')
      return
    }

    setConfirming(true)

    try {
      // Prepare checkout items con precios reales
      const checkoutItems = productItems.map((item, index) => ({
        name: item.productName,
        description: `${item.productName} - QR ${item.qrCode}`,
        price: item.price,
        quantity: 1,
        qr_code: item.qrCode,
        variant_id: item.variantId,
        product_id: item.productId
      }))

      // Create checkout session
      const checkoutResponse = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: checkoutItems,
          productType: 'evento',
        }),
      })

      if (!checkoutResponse.ok) {
        throw new Error('Error creando sesión de pago')
      }

      const { sessionId } = await checkoutResponse.json()

      // Redirect to Stripe checkout
      window.location.href = `/checkout?session_id=${sessionId}`
    } catch (error) {
      console.error('Error en checkout:', error)
      toast.error('Error procesando el pedido. Inténtalo de nuevo.')
    } finally {
      setConfirming(false)
    }
  }

  if (qrCodes.length === 0 || totalProducts === 0) {
    return null
  }

  return (
    <div className={`bg-gradient-to-br from-primary-50 to-primary-100 rounded-2xl border-2 border-primary-200 p-6 ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-xl font-bold text-primary-900">🚀 ¡Listo para Confirmar!</h3>
          <p className="text-sm text-primary-700">
            {totalProducts} producto{totalProducts !== 1 ? 's' : ''} en {qrCodes.length} QR{qrCodes.length !== 1 ? 's' : ''}
          </p>
        </div>
        <div className="text-right">
          {loadingPrices ? (
            <>
              <div className="text-2xl font-bold text-primary-600">
                <Loader2 className="h-6 w-6 animate-spin inline" />
              </div>
              <div className="text-xs text-primary-500 font-medium">Calculando...</div>
            </>
          ) : (
            <>
              <div className="text-3xl font-bold text-primary-600">
                €{totalPrice.toFixed(2)}
              </div>
              <div className="text-sm text-primary-500 font-medium">Total</div>
            </>
          )}
        </div>
      </div>

      <div className="space-y-3">
        <div className="bg-white/80 backdrop-blur-sm p-4 rounded-xl border border-primary-200/50">
          <h4 className="text-sm font-semibold text-primary-900 mb-3">✨ Incluye:</h4>
          <ul className="text-sm text-primary-800 space-y-2">
            <li className="flex items-center">
              <Check className="h-4 w-4 text-green-600 mr-3 flex-shrink-0" />
              {totalProducts} producto{totalProducts !== 1 ? 's' : ''} premium personalizados
            </li>
            <li className="flex items-center">
              <Check className="h-4 w-4 text-green-600 mr-3 flex-shrink-0" />
              QR dinámico personalizado
            </li>
            <li className="flex items-center">
              <Check className="h-4 w-4 text-green-600 mr-3 flex-shrink-0" />
              Panel de control completo
            </li>
            <li className="flex items-center">
              <Check className="h-4 w-4 text-green-600 mr-3 flex-shrink-0" />
              Entrega en 5-7 días laborables
            </li>
          </ul>
        </div>

        <button
          onClick={handleConfirmOrder}
          disabled={confirming || loadingPrices}
          className="w-full flex items-center justify-center gap-3 rounded-xl bg-gradient-to-r from-primary-600 to-primary-700 px-6 py-4 text-base font-bold text-white hover:from-primary-700 hover:to-primary-800 disabled:cursor-not-allowed disabled:opacity-50 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
        >
          {confirming ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin" />
              Procesando Pedido...
            </>
          ) : (
            <>
              <ShoppingCart className="h-5 w-5" />
              💳 Confirmar Pedido y Pagar
            </>
          )}
        </button>

        <p className="text-xs text-primary-600 text-center font-medium">
          🔒 Pago seguro con Stripe • Procesaremos tu pedido y te enviaremos los productos en 5-7 días laborables
        </p>
      </div>
    </div>
  )
}


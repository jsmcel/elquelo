'use client'

import { useState, useEffect } from 'react'
import { useUser } from '@/app/providers'
import { toast } from 'react-hot-toast'
import { Shirt, Loader2, Check } from 'lucide-react'

interface CamisetaPackageButtonProps {
  qrCodes: string[]
  onPackageApplied?: () => void
  className?: string
  isConfigurator?: boolean // Para el configurador donde no hay QRs reales
  participants?: Array<{ name: string; size: string }> // Participantes del configurador
}

export function CamisetaPackageButton({
  qrCodes,
  onPackageApplied,
  className = '',
  isConfigurator = false,
  participants = []
}: CamisetaPackageButtonProps) {
  const { user } = useUser()
  const [applying, setApplying] = useState(false)
  const [camisetaPrice, setCamisetaPrice] = useState<number | null>(null)
  const [loadingPrice, setLoadingPrice] = useState(true)

  // Cargar precio real del variant 4013 (M White por defecto)
  useEffect(() => {
    async function loadCamisetaPrice() {
      try {
        const response = await fetch('/api/printful/variants/price', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ variantIds: [4013] })
        })

        if (response.ok) {
          const { prices } = await response.json()
          if (prices[4013]) {
            setCamisetaPrice(prices[4013].finalPrice)
          } else {
            setCamisetaPrice(null)
          }
        } else {
          setCamisetaPrice(null)
        }
      } catch (error) {
        console.error('Error cargando precio de camiseta:', error)
        setCamisetaPrice(null)
      } finally {
        setLoadingPrice(false)
      }
    }

    loadCamisetaPrice()
  }, [])

      const handleApplyPackage = async () => {
        if (!user) {
          toast.error('Debes iniciar sesión para continuar')
          return
        }

        if (displayCount === 0) {
          toast.error('No hay participantes para aplicar el paquete')
          return
        }

        // En el configurador, solo mostrar mensaje
        if (isConfigurator) {
          const tallasUsadas = participants.map(p => p.size).filter(Boolean)
          const tallasTexto = tallasUsadas.length > 0 
            ? ` con tallas: ${tallasUsadas.join(', ')}`
            : ' (talla M por defecto)'
          
          toast.success(`¡Paquete configurado! Se añadirán camisetas para ${displayCount} participante${displayCount !== 1 ? 's' : ''}${tallasTexto} después de crear el grupo.`)
          onPackageApplied?.()
          return
        }

    setApplying(true)

    try {
      console.log('🎯 Aplicando paquete a QRs:', qrCodes)
      
      // Para cada QR, añadir una camiseta con variant 71
      const promises = qrCodes.map(async (qrCode) => {
        try {
          console.log(`📱 Procesando QR: ${qrCode}`)
          
          // Obtener el diseño actual del QR
          const response = await fetch(`/api/design/${qrCode}`)
          if (!response.ok) {
            throw new Error(`Error cargando diseño para ${qrCode}`)
          }

          const { designData } = await response.json()
          console.log(`📋 Diseño actual para ${qrCode}:`, designData)
          
          // Migrar a nuevo formato si es necesario
          const migratedDesign = migrateLegacyDesign(designData)
          console.log(`🔄 Diseño migrado para ${qrCode}:`, migratedDesign)
          
          // Crear nueva camiseta
          const newCamiseta = {
            id: `camiseta-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            productId: 71, // Unisex Staple T-Shirt
            templateId: 71,
            variantId: 4013, // M White por defecto
            productName: 'Camiseta Unisex',
            size: 'M', // Se personalizará después
            color: 'White', // Se personalizará después
            colorCode: '#FFFFFF',
            designsByPlacement: {
              front: '', // Se añadirá el QR aquí
            },
            designMetadata: {},
            variantMockups: {},
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            deletedAt: null
          }

          // Añadir la camiseta al diseño
          const updatedDesign = {
            ...migratedDesign,
            products: [...(migratedDesign.products || []), newCamiseta as any]
          }
          console.log(`👕 Diseño actualizado para ${qrCode}:`, updatedDesign)

          // Guardar el diseño actualizado
          const saveResponse = await fetch('/api/design/save', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              code: qrCode,
              designData: updatedDesign
            }),
          })

          if (!saveResponse.ok) {
            const errorData = await saveResponse.json()
            console.error(`❌ Error guardando diseño para ${qrCode}:`, errorData)
            throw new Error(`Error guardando diseño para ${qrCode}: ${errorData.error || 'Unknown error'}`)
          }

          console.log(`✅ QR ${qrCode} procesado exitosamente`)
          return qrCode
        } catch (error) {
          console.error(`❌ Error procesando QR ${qrCode}:`, error)
          throw error
        }
      })

      // Esperar a que se procesen todos los QRs
      const processedQRs = await Promise.all(promises)
      console.log('🎉 Paquete aplicado exitosamente a QRs:', processedQRs)
      
      toast.success(`¡Paquete aplicado! Se añadieron camisetas a ${processedQRs.length} QR${processedQRs.length !== 1 ? 's' : ''}`)
      
      // Notificar que se aplicó el paquete
      onPackageApplied?.()
      
    } catch (error) {
      console.error('❌ Error aplicando paquete:', error)
      toast.error(`Error aplicando el paquete: ${error instanceof Error ? error.message : 'Error desconocido'}`)
    } finally {
      setApplying(false)
    }
  }

      if (qrCodes.length === 0 && !isConfigurator) {
        return null
      }

      // En el configurador, usar participantes en lugar de QRs
      const displayCount = isConfigurator ? participants.length : qrCodes.length
      const displayText = isConfigurator ? 'participante' : 'QR'

  // No mostrar el componente hasta tener el precio real
  if (loadingPrice || camisetaPrice === null) {
    return (
      <div className={`bg-gradient-to-br from-orange-50 to-orange-100 rounded-2xl border-2 border-orange-200 p-6 ${className}`}>
        <div className="flex items-center justify-center py-8">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin text-orange-600 mx-auto mb-2" />
            <p className="text-orange-700 font-medium">Calculando precios del paquete...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={`bg-gradient-to-br from-orange-50 to-orange-100 rounded-2xl border-2 border-orange-200 p-6 ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-xl font-bold text-orange-900 flex items-center gap-2">
            <Shirt className="h-6 w-6" />
            🎉 ¡HAY CAMISETAS PARA TODOS!
          </h3>
              <p className="text-sm text-orange-700">
                Añade una camiseta con tu QR en el frontal a cada uno de tus {displayCount} {displayText}{displayCount !== 1 ? 's' : ''}
                {isConfigurator && participants.some(p => p.size) && (
                  <span className="block mt-1 text-xs text-orange-600">
                    📏 Usando las tallas especificadas: {participants.map(p => p.size).filter(Boolean).join(', ')}
                  </span>
                )}
              </p>
        </div>
        <div className="text-right">
              <div className="text-2xl font-bold text-orange-600">
                €{Math.round(displayCount * camisetaPrice * 100) / 100}
              </div>
          <div className="text-sm text-orange-500 font-medium">Total</div>
        </div>
      </div>

      <div className="space-y-3">
        <div className="bg-white/60 rounded-lg p-4 border border-orange-200">
          <h4 className="font-semibold text-orange-900 mb-2 flex items-center gap-2">
            <Check className="h-4 w-4" />
            Incluye:
          </h4>
          <ul className="text-sm text-orange-800 space-y-1">
                <li>• {displayCount} camiseta{displayCount !== 1 ? 's' : ''} Unisex Staple (Bella + Canvas)</li>
            <li>• QR personalizado en el frontal</li>
            <li>• {isConfigurator ? 'Tallas según configurador' : 'Talla M por defecto'} (blanco)</li>
            <li>• Listo para personalizar después</li>
          </ul>
        </div>

        <button
          onClick={handleApplyPackage}
          disabled={applying}
          className="w-full bg-orange-600 hover:bg-orange-700 disabled:bg-orange-400 text-white font-semibold py-3 px-6 rounded-lg transition-colors flex items-center justify-center gap-2"
        >
          {applying ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin" />
              Aplicando paquete...
            </>
          ) : (
            <>
              <Shirt className="h-5 w-5" />
              Aplicar Paquete de Camisetas
            </>
          )}
        </button>

        <p className="text-xs text-orange-600 text-center">
          💡 Podrás personalizar tallas, colores y diseños después de aplicar el paquete
        </p>
      </div>
    </div>
  )
}

// Función de migración (copiada de types/qr-product.ts)
function migrateLegacyDesign(designData: any): any {
  if (!designData) {
    return {
      version: '2.0',
      products: []
    }
  }

  // Si ya es v2.0, devolverlo tal como está
  if (designData.version === '2.0') {
    return designData
  }

  // Migrar de formato legacy a v2.0
  const migratedDesign: any = {
    version: '2.0',
    products: []
  }

  // Si hay datos legacy, crear un producto
  if (designData.printfulProduct || designData.templateId) {
    const legacyProduct = {
      id: `legacy-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      productId: designData.printfulProduct?.id || 71,
      templateId: designData.templateId || 71,
      variantId: designData.printfulProduct?.variant_id || 71,
      productName: designData.printfulProduct?.name || 'Producto personalizado',
      size: designData.printfulProduct?.size || null,
      color: designData.printfulProduct?.color || null,
      colorCode: designData.printfulProduct?.color_code || null,
      designsByPlacement: designData.designsByPlacement || {},
      designMetadata: designData.designMetadata || {},
      variantMockups: designData.variantMockups || {},
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      deletedAt: null
    }

    migratedDesign.products = [legacyProduct]
  }

  return migratedDesign
}

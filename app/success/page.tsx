'use client'

import { useEffect, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { Header } from '@/components/Header'
import { Footer } from '@/components/Footer'
import { CheckCircle, Package, QrCode, ArrowRight } from 'lucide-react'

export default function SuccessPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const sessionId = searchParams.get('session_id')
  const [loading, setLoading] = useState(true)
  const [orderData, setOrderData] = useState<any>(null)

  useEffect(() => {
    if (sessionId) {
      // Aquí podrías hacer una llamada a tu API para obtener los detalles del pedido
      // Por ahora simulamos que se procesó correctamente
      setTimeout(() => {
        setOrderData({
          orderId: sessionId,
          total: 29, // Esto vendría de la API
          items: 1, // Esto vendría de la API
        })
        setLoading(false)
      }, 1000)
    } else {
      router.push('/dashboard')
    }
  }, [sessionId, router])

  if (loading) {
    return (
      <main className="min-h-screen bg-gray-50">
        <Header />
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
            <div className="animate-pulse">
              <div className="h-8 bg-gray-200 rounded w-3/4 mx-auto mb-4"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2 mx-auto"></div>
            </div>
          </div>
        </div>
        <Footer />
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-gray-50">
      <Header />
      
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
          <div className="mb-6">
            <div className="flex justify-center mb-6">
              <img 
                src="/logo.png" 
                alt="ELQUELO Logo" 
                className="h-24 w-24 object-contain"
              />
            </div>
            <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              ¡Pedido Confirmado!
            </h1>
            <p className="text-gray-600">
              Tu pago se ha procesado correctamente. Te enviaremos las camisetas pronto.
            </p>
          </div>

          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
            <div className="flex items-center justify-center gap-2 text-green-800 font-medium">
              <Package className="h-5 w-5" />
              <span>Procesando tu pedido...</span>
            </div>
            <p className="text-sm text-green-700 mt-2">
              ID de pedido: {orderData?.orderId}
            </p>
          </div>

          <div className="space-y-4 mb-8">
            <div className="flex items-center justify-center gap-3 text-sm text-gray-600">
              <QrCode className="h-5 w-5 text-blue-500" />
              <span>QRs personalizados generados</span>
            </div>
            
            <div className="flex items-center justify-center gap-3 text-sm text-gray-600">
              <Package className="h-5 w-5 text-purple-500" />
              <span>Camisetas en proceso de impresión</span>
            </div>
            
            <div className="flex items-center justify-center gap-3 text-sm text-gray-600">
              <CheckCircle className="h-5 w-5 text-green-500" />
              <span>Entrega en 5-7 días laborables</span>
            </div>
          </div>

          <div className="space-y-3">
            <button
              onClick={() => router.push('/dashboard')}
              className="w-full flex items-center justify-center gap-2 bg-primary-600 text-white px-6 py-3 rounded-lg hover:bg-primary-700 transition-colors"
            >
              <QrCode className="h-5 w-5" />
              Gestionar QRs
              <ArrowRight className="h-4 w-4" />
            </button>
            
            <p className="text-xs text-gray-500">
              Te enviaremos un email de confirmación con todos los detalles
            </p>
          </div>
        </div>
      </div>

      <Footer />
    </main>
  )
}

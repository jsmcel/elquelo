'use client'

/* eslint-disable @next/next/no-img-element */

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
      // Aqui podrias hacer una llamada a tu API para obtener los detalles del pedido
      // Por ahora simulamos que se proceso correctamente
      setTimeout(() => {
        setOrderData({
          orderId: sessionId,
          total: 29, // Esto vendria de la API
          items: 1, // Esto vendria de la API
        })
        setLoading(false)
      }, 1000)
    } else {
      router.push('/dashboard/despedida')
    }
  }, [sessionId, router])

  if (loading) {
    return (
      <main className="min-h-screen bg-gray-50">
        <Header />
        <div className="mx-auto max-w-2xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="rounded-2xl bg-white p-8 text-center shadow-lg">
            <div className="animate-pulse">
              <div className="mx-auto mb-4 h-8 w-3/4 rounded bg-gray-200"></div>
              <div className="mx-auto h-4 w-1/2 rounded bg-gray-200"></div>
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

      <div className="mx-auto max-w-2xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="rounded-2xl bg-white p-8 text-center shadow-lg">
          <div className="mb-6">
            <div className="mb-6 flex justify-center">
              <img src="/logo.png" alt="ELQUELO Logo" className="h-24 w-24 object-contain" />
            </div>
            <CheckCircle className="mx-auto mb-4 h-16 w-16 text-green-500" />
            <h1 className="mb-2 text-3xl font-bold text-gray-900">Pedido Confirmado!</h1>
            <p className="text-gray-600">Tu pago se ha procesado correctamente. Te enviaremos las camisetas pronto.</p>
          </div>

          <div className="mb-6 rounded-lg border border-green-200 bg-green-50 p-4">
            <div className="flex items-center justify-center gap-2 font-medium text-green-800">
              <Package className="h-5 w-5" />
              <span>Procesando tu pedido...</span>
            </div>
            <p className="mt-2 text-sm text-green-700">ID de pedido: {orderData?.orderId}</p>
          </div>

          <div className="mb-8 space-y-4 text-sm text-gray-600">
            <div className="flex items-center justify-center gap-3">
              <QrCode className="h-5 w-5 text-blue-500" />
              <span>QRs personalizados generados</span>
            </div>

            <div className="flex items-center justify-center gap-3">
              <Package className="h-5 w-5 text-purple-500" />
              <span>Camisetas en proceso de impresion</span>
            </div>

            <div className="flex items-center justify-center gap-3">
              <CheckCircle className="h-5 w-5 text-green-500" />
              <span>Entrega en 5-7 dias laborables</span>
            </div>
          </div>

          <div className="space-y-3">
            <button
              onClick={() => router.push('/dashboard/despedida')}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary-600 px-6 py-3 text-white transition-colors hover:bg-primary-700"
            >
              <QrCode className="h-5 w-5" />
              Gestionar QRs
              <ArrowRight className="h-4 w-4" />
            </button>

            <p className="text-xs text-gray-500">Te enviaremos un email de confirmacion con todos los detalles</p>
          </div>
        </div>
      </div>

      <Footer />
    </main>
  )
}

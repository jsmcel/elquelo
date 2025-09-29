'use client'

import { useRouter } from 'next/navigation'
import { Header } from '@/components/Header'
import { Footer } from '@/components/Footer'
import { XCircle, ArrowLeft, CreditCard } from 'lucide-react'

export default function CancelPage() {
  const router = useRouter()

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
            <XCircle className="h-16 w-16 text-orange-500 mx-auto mb-4" />
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Pago Cancelado
            </h1>
            <p className="text-gray-600">
              Tu pago ha sido cancelado. No se ha realizado ningún cargo.
            </p>
          </div>

          <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-6">
            <div className="flex items-center justify-center gap-2 text-orange-800 font-medium">
              <CreditCard className="h-5 w-5" />
              <span>No se ha procesado ningún pago</span>
            </div>
            <p className="text-sm text-orange-700 mt-2">
              Puedes intentar el pago nuevamente cuando quieras
            </p>
          </div>

          <div className="space-y-3">
            <button
              onClick={() => router.push('/dashboard')}
              className="w-full flex items-center justify-center gap-2 bg-primary-600 text-white px-6 py-3 rounded-lg hover:bg-primary-700 transition-colors"
            >
              <ArrowLeft className="h-5 w-5" />
              Volver al Dashboard
            </button>
            
            <button
              onClick={() => window.history.back()}
              className="w-full flex items-center justify-center gap-2 bg-gray-100 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-200 transition-colors"
            >
              <CreditCard className="h-5 w-5" />
              Intentar Pago Nuevamente
            </button>
          </div>

          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-500">
              ¿Necesitas ayuda? Contacta con nuestro soporte
            </p>
          </div>
        </div>
      </div>

      <Footer />
    </main>
  )
}

'use client'

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { loadStripe } from '@stripe/stripe-js'
import { Header } from '@/components/Header'
import { Footer } from '@/components/Footer'
import { Loader2, CreditCard, Shield, Truck } from 'lucide-react'

export default function CheckoutPage() {
  const searchParams = useSearchParams()
  const sessionId = searchParams.get('session_id')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const redirectToCheckout = async () => {
      if (!sessionId) {
        setError('Sesión de pago no válida')
        setLoading(false)
        return
      }

      try {
        const stripe = await loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!)
        
        if (!stripe) {
          setError('Stripe no está disponible')
          setLoading(false)
          return
        }

        const { error } = await stripe.redirectToCheckout({ sessionId })
        
        if (error) {
          setError(error.message || 'Error al redirigir al pago')
          setLoading(false)
        }
      } catch (err) {
        setError('Error inesperado')
        setLoading(false)
      }
    }

    redirectToCheckout()
  }, [sessionId])

  if (error) {
    return (
      <main className="min-h-screen bg-gray-50">
        <Header />
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
            <h1 className="text-xl font-semibold text-red-800 mb-2">Error en el pago</h1>
            <p className="text-red-600">{error}</p>
            <button 
              onClick={() => window.location.href = '/dashboard'}
              className="mt-4 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700"
            >
              Volver al Dashboard
            </button>
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
            <Loader2 className="h-12 w-12 animate-spin text-primary-600 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Redirigiendo al pago...
            </h1>
            <p className="text-gray-600">
              Te estamos llevando a Stripe para completar tu pago de forma segura
            </p>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-center gap-3 text-sm text-gray-600">
              <Shield className="h-5 w-5 text-green-500" />
              <span>Pago 100% seguro con Stripe</span>
            </div>
            
            <div className="flex items-center justify-center gap-3 text-sm text-gray-600">
              <CreditCard className="h-5 w-5 text-blue-500" />
              <span>Aceptamos todas las tarjetas principales</span>
            </div>
            
            <div className="flex items-center justify-center gap-3 text-sm text-gray-600">
              <Truck className="h-5 w-5 text-purple-500" />
              <span>Entrega en 5-7 días laborables</span>
            </div>
          </div>

          <div className="mt-8 p-4 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-500">
              Si no eres redirigido automáticamente, 
              <a href="#" className="text-primary-600 hover:underline ml-1">
                haz clic aquí
              </a>
            </p>
          </div>
        </div>
      </div>

      <Footer />
    </main>
  )
}

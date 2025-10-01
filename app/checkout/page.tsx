'use client'

/* eslint-disable @next/next/no-img-element */

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
        setError('Sesion de pago no valida')
        setLoading(false)
        return
      }

      try {
        const stripe = await loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!)

        if (!stripe) {
          setError('Stripe no esta disponible')
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
        <div className="mx-auto max-w-2xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="rounded-lg border border-red-200 bg-red-50 p-6 text-center">
            <h1 className="mb-2 text-xl font-semibold text-red-800">Error en el pago</h1>
            <p className="text-red-600">{error}</p>
            <button
              onClick={() => {
                window.location.href = '/dashboard'
              }}
              className="mt-4 rounded-lg bg-red-600 px-4 py-2 text-white hover:bg-red-700"
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

      <div className="mx-auto max-w-2xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="rounded-2xl bg-white p-8 text-center shadow-lg">
          <div className="mb-6">
            <div className="mb-6 flex justify-center">
              <img src="/logo.png" alt="ELQUELO Logo" className="h-24 w-24 object-contain" />
            </div>
            <Loader2 className="mx-auto mb-4 h-12 w-12 animate-spin text-primary-600" />
            <h1 className="mb-2 text-2xl font-bold text-gray-900">Redirigiendo al pago...</h1>
            <p className="text-gray-600">Te estamos llevando a Stripe para completar tu pago de forma segura</p>
          </div>

          <div className="space-y-4 text-sm text-gray-600">
            <div className="flex items-center justify-center gap-3">
              <Shield className="h-5 w-5 text-green-500" />
              <span>Pago 100% seguro con Stripe</span>
            </div>

            <div className="flex items-center justify-center gap-3">
              <CreditCard className="h-5 w-5 text-blue-500" />
              <span>Aceptamos todas las tarjetas principales</span>
            </div>

            <div className="flex items-center justify-center gap-3">
              <Truck className="h-5 w-5 text-purple-500" />
              <span>Entrega en 5-7 dias laborables</span>
            </div>
          </div>

          <div className="mt-8 rounded-lg bg-gray-50 p-4">
            <p className="text-sm text-gray-500">
              Si no eres redirigido automaticamente,
              <a href="#" className="ml-1 text-primary-600 hover:underline">
                haz clic aqui
              </a>
            </p>
          </div>
        </div>
      </div>

      <Footer />
    </main>
  )
}

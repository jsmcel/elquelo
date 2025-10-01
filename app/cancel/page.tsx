'use client'

/* eslint-disable @next/next/no-img-element */

import { useRouter } from 'next/navigation'
import { Header } from '@/components/Header'
import { Footer } from '@/components/Footer'
import { XCircle, ArrowLeft, CreditCard } from 'lucide-react'

export default function CancelPage() {
  const router = useRouter()

  return (
    <main className="min-h-screen bg-gray-50">
      <Header />

      <div className="mx-auto max-w-2xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="rounded-2xl bg-white p-8 text-center shadow-lg">
          <div className="mb-6">
            <div className="mb-6 flex justify-center">
              <img src="/logo.png" alt="ELQUELO Logo" className="h-24 w-24 object-contain" />
            </div>
            <XCircle className="mx-auto mb-4 h-16 w-16 text-orange-500" />
            <h1 className="mb-2 text-3xl font-bold text-gray-900">Pago Cancelado</h1>
            <p className="text-gray-600">Tu pago ha sido cancelado. No se ha realizado ningun cargo.</p>
          </div>

          <div className="mb-6 rounded-lg border border-orange-200 bg-orange-50 p-4">
            <div className="flex items-center justify-center gap-2 font-medium text-orange-800">
              <CreditCard className="h-5 w-5" />
              <span>No se ha procesado ningun pago</span>
            </div>
            <p className="mt-2 text-sm text-orange-700">Puedes intentar el pago nuevamente cuando quieras</p>
          </div>

          <div className="space-y-3">
            <button
              onClick={() => router.push('/dashboard')}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary-600 px-6 py-3 text-white transition-colors hover:bg-primary-700"
            >
              <ArrowLeft className="h-5 w-5" />
              Volver al Dashboard
            </button>

            <button
              onClick={() => window.history.back()}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-gray-100 px-6 py-3 text-gray-700 transition-colors hover:bg-gray-200"
            >
              <CreditCard className="h-5 w-5" />
              Intentar Pago Nuevamente
            </button>
          </div>

          <div className="mt-6 rounded-lg bg-gray-50 p-4">
            <p className="text-sm text-gray-500">Necesitas ayuda? Contacta con nuestro soporte</p>
          </div>
        </div>
      </div>

      <Footer />
    </main>
  )
}

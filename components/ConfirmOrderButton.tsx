'use client'

import { useState } from 'react'
import { useUser } from '@/app/providers'
import { toast } from 'react-hot-toast'
import { ShoppingCart, Loader2, Check } from 'lucide-react'

interface ConfirmOrderButtonProps {
  qrCodes?: string[]
  className?: string
}

export function ConfirmOrderButton({ qrCodes = [], className = '' }: ConfirmOrderButtonProps) {
  const { user } = useUser()
  const [confirming, setConfirming] = useState(false)

  const handleConfirmOrder = async () => {
    if (!user) {
      toast.error('Debes iniciar sesión para continuar')
      return
    }

    if (qrCodes.length === 0) {
      toast.error('No hay QRs para confirmar')
      return
    }

    setConfirming(true)

    try {
      // Calculate total price (€29 per QR)
      const totalPrice = qrCodes.length * 29

      // Prepare checkout items
      const checkoutItems = qrCodes.map((code, index) => ({
        name: `Camiseta ${index + 1}`,
        description: `Camiseta personalizada con QR ${code}`,
        price: 29,
        quantity: 1,
        qr_code: code,
      }))

      // Get event date if available (optional - can be set later)
      const eventDate = new Date()
      eventDate.setDate(eventDate.getDate() + 30) // Default 30 days from now

      // Create checkout session with QR codes
      const checkoutResponse = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: checkoutItems,
          productType: 'evento',
          qrCodes: qrCodes, // Pass the QR codes
          eventDate: eventDate.toISOString(),
          eventTimezone: 'Europe/Madrid',
          contentTtlDays: 30,
        }),
      })

      const payload = await checkoutResponse.json().catch(() => null)

      if (!checkoutResponse.ok) {
        console.error('Checkout session failed', payload)
        const message = payload && typeof (payload as any).error === 'string' ? (payload as any).error : 'Error creando sesión de pago'
        throw new Error(message)
      }

      const { sessionId } = (payload ?? {}) as { sessionId?: string }
      if (!sessionId) {
        throw new Error('No recibimos el identificador de la sesión de pago')
      }

      // Redirect to Stripe checkout
      window.location.href = `/checkout?session_id=${sessionId}`
    } catch (error) {
      console.error('Error en checkout:', error)
      const message = error instanceof Error ? error.message : 'Error procesando el pedido. Inténtalo de nuevo.'
      toast.error(message)
    } finally {
      setConfirming(false)
    }
  }

  if (qrCodes.length === 0) {
    return null
  }

  return (
    <div className={`bg-gradient-to-br from-primary-50 to-primary-100 rounded-2xl border-2 border-primary-200 p-6 ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-xl font-bold text-primary-900">🚀 ¡Listo para Confirmar!</h3>
          <p className="text-sm text-primary-700">
            {qrCodes.length} camiseta{qrCodes.length > 1 ? 's' : ''} lista{qrCodes.length > 1 ? 's' : ''} para confirmar
          </p>
        </div>
        <div className="text-right">
          <div className="text-3xl font-bold text-primary-600">
            €{qrCodes.length * 29}
          </div>
          <div className="text-sm text-primary-500 font-medium">Total</div>
        </div>
      </div>

      <div className="space-y-3">
        <div className="bg-white/80 backdrop-blur-sm p-4 rounded-xl border border-primary-200/50">
          <h4 className="text-sm font-semibold text-primary-900 mb-3">✨ Incluye:</h4>
          <ul className="text-sm text-primary-800 space-y-2">
            <li className="flex items-center">
              <Check className="h-4 w-4 text-green-600 mr-3 flex-shrink-0" />
              {qrCodes.length} camiseta{qrCodes.length > 1 ? 's' : ''} premium
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
          disabled={confirming}
          className="w-full flex items-center justify-center gap-3 rounded-xl bg-gradient-to-r from-primary-600 to-primary-700 px-6 py-4 text-base font-bold text-white hover:from-primary-700 hover:to-primary-800 disabled:cursor-not-allowed disabled:opacity-50 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
        >
          {confirming ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin" />
              Procesando pedido...
            </>
          ) : (
            <>
              <ShoppingCart className="h-5 w-5" />
              💳 Confirmar Pedido y Pagar
            </>
          )}
        </button>

        <p className="text-xs text-primary-600 text-center font-medium">
          🔒 Pago seguro con Stripe • Procesaremos tu pedido y te enviaremos las camisetas en 5-7 días laborables
        </p>
      </div>
    </div>
  )
}


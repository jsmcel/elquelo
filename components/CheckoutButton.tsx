'use client'

import { useState } from 'react'
import { useStripe } from '@stripe/stripe-js'
import { toast } from 'react-hot-toast'
import { ShoppingCart, Loader } from 'lucide-react'

interface CheckoutButtonProps {
  items: Array<{
    id: string
    name: string
    description: string
    price: number
    quantity: number
    images?: string[]
    size?: string
    color?: string
    initial_url?: string
  }>
  productType: 'drop' | 'evento' | 'merchandising' | 'estado'
  className?: string
  children?: React.ReactNode
}

export function CheckoutButton({ items, productType, className = '', children }: CheckoutButtonProps) {
  const [loading, setLoading] = useState(false)
  const stripe = useStripe()

  const handleCheckout = async () => {
    if (!stripe) {
      toast.error('Stripe no está disponible')
      return
    }

    setLoading(true)

    try {
      const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          items,
          productType,
        }),
      })

      const { sessionId, error } = await response.json()

      if (error) {
        toast.error(error)
        return
      }

      const { error: stripeError } = await stripe.redirectToCheckout({
        sessionId,
      })

      if (stripeError) {
        toast.error(stripeError.message || 'Error al procesar el pago')
      }
    } catch (error) {
      toast.error('Error al crear la sesión de pago')
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      onClick={handleCheckout}
      disabled={loading || !stripe}
      className={`flex items-center justify-center space-x-2 px-6 py-3 rounded-lg font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
    >
      {loading ? (
        <>
          <Loader className="w-5 h-5 animate-spin" />
          <span>Procesando...</span>
        </>
      ) : (
        <>
          {children || (
            <>
              <ShoppingCart className="w-5 h-5" />
              <span>Comprar Ahora</span>
            </>
          )}
        </>
      )}
    </button>
  )
}

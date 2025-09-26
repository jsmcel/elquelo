'use client'

import { useState } from 'react'
import { Check, Star, Zap } from 'lucide-react'

interface EstadoPlan {
  id: string
  name: string
  description: string
  price: number
  period: string
  features: string[]
  popular: boolean
}

interface EstadoCardProps {
  plan: EstadoPlan
}

export function EstadoCard({ plan }: EstadoCardProps) {
  const [isHovered, setIsHovered] = useState(false)

  return (
    <div 
      className={`relative bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden ${
        plan.popular ? 'ring-2 ring-orange-500' : ''
      }`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {plan.popular && (
        <div className="absolute top-0 left-0 right-0 bg-orange-500 text-white text-center py-2 text-sm font-semibold">
          <div className="flex items-center justify-center space-x-1">
            <Star className="w-4 h-4" />
            <span>MÁS POPULAR</span>
          </div>
        </div>
      )}

      <div className={`p-8 ${plan.popular ? 'pt-12' : ''}`}>
        <div className="text-center mb-8">
          <h3 className="text-2xl font-bold text-gray-900 mb-2">
            {plan.name}
          </h3>
          <p className="text-gray-600 mb-6">
            {plan.description}
          </p>
          
          <div className="mb-6">
            <span className="text-4xl font-bold text-orange-600">
              €{plan.price}
            </span>
            <span className="text-gray-500 ml-2">/{plan.period}</span>
          </div>

          {plan.period === 'año' && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-6">
              <p className="text-sm text-green-800 font-medium">
                🎉 Ahorras €2.90 al año
              </p>
            </div>
          )}
        </div>

        {/* Features */}
        <ul className="space-y-4 mb-8">
          {plan.features.map((feature, index) => (
            <li key={index} className="flex items-start space-x-3">
              <Check className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
              <span className="text-gray-700">{feature}</span>
            </li>
          ))}
        </ul>

        {/* CTA Button */}
        <button 
          className={`w-full py-3 px-6 rounded-lg font-semibold transition-colors ${
            plan.popular 
              ? 'bg-orange-600 text-white hover:bg-orange-700' 
              : 'bg-gray-100 text-gray-900 hover:bg-gray-200'
          }`}
        >
          {plan.popular ? (
            <div className="flex items-center justify-center space-x-2">
              <Zap className="w-4 h-4" />
              <span>Empezar Ahora</span>
            </div>
          ) : (
            'Seleccionar Plan'
          )}
        </button>

        {/* Additional info */}
        {plan.id === '1' && (
          <p className="text-xs text-gray-500 text-center mt-4">
            Perfecto para uso personal
          </p>
        )}
        
        {plan.id === '2' && (
          <p className="text-xs text-gray-500 text-center mt-4">
            Ideal para influencers y profesionales
          </p>
        )}
        
        {plan.id === '3' && (
          <p className="text-xs text-gray-500 text-center mt-4">
            Mejor valor - Ahorra 2 meses
          </p>
        )}
      </div>
    </div>
  )
}

'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Users, Calendar, Phone, Mail } from 'lucide-react'

interface Event {
  id: string
  name: string
  description: string
  image: string
  price: number
  minOrder: number
  features: string[]
}

interface EventCardProps {
  event: Event
}

export function EventCard({ event }: EventCardProps) {
  const [isHovered, setIsHovered] = useState(false)

  return (
    <div 
      className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden group"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Image */}
      <div className="relative h-64 overflow-hidden">
        <Image
          src={event.image}
          alt={event.name}
          fill
          className="object-cover group-hover:scale-105 transition-transform duration-300"
        />
        <div className="absolute top-4 left-4">
          <span className="bg-blue-600 text-white px-3 py-1 rounded-full text-sm font-semibold">
            EVENTO
          </span>
        </div>
        <div className="absolute top-4 right-4">
          <span className="bg-green-500 text-white px-3 py-1 rounded-full text-sm font-semibold flex items-center space-x-1">
            <Users className="w-4 h-4" />
            <span>Min. {event.minOrder}</span>
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        <h3 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors">
          {event.name}
        </h3>
        
        <p className="text-gray-600 mb-4 text-sm leading-relaxed">
          {event.description}
        </p>

        {/* Features */}
        <ul className="space-y-2 mb-6">
          {event.features.map((feature, index) => (
            <li key={index} className="flex items-center text-sm text-gray-600">
              <div className="w-1.5 h-1.5 bg-blue-500 rounded-full mr-3"></div>
              {feature}
            </li>
          ))}
        </ul>

        {/* Price and Actions */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <span className="text-2xl font-bold text-gray-900">
              €{event.price}
            </span>
            <span className="text-sm text-gray-500 ml-2">por camiseta</span>
          </div>
          
          <div className="text-right">
            <p className="text-sm text-gray-500">Pedido mínimo</p>
            <p className="text-lg font-semibold text-blue-600">{event.minOrder} unidades</p>
          </div>
        </div>

        {/* Contact Actions */}
        <div className="flex space-x-2">
          <Link 
            href={`/eventos/${event.id}`}
            className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-blue-700 transition-colors text-center"
          >
            Ver Detalles
          </Link>
          <a 
            href={`mailto:eventos@elquelo.com?subject=Consulta sobre ${event.name}`}
            className="p-2 text-gray-400 hover:text-blue-600 transition-colors border border-gray-300 rounded-lg hover:border-blue-600"
            title="Contactar por email"
          >
            <Mail className="w-5 h-5" />
          </a>
          <a 
            href={`tel:+34600000000`}
            className="p-2 text-gray-400 hover:text-blue-600 transition-colors border border-gray-300 rounded-lg hover:border-blue-600"
            title="Llamar"
          >
            <Phone className="w-5 h-5" />
          </a>
        </div>

        {/* Discount info */}
        {event.minOrder >= 20 && (
          <div className="mt-4 bg-green-50 border border-green-200 rounded-lg p-3">
            <p className="text-sm text-green-800 font-medium">
              🎉 Descuento del 15% en pedidos de 20+ unidades
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

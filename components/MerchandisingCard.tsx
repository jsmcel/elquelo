'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Store, Gift, QrCode, Users, ShoppingCart, Eye } from 'lucide-react'

interface MerchandisingItem {
  id: string
  name: string
  description: string
  image: string
  price: number
  category: string
  features: string[]
}

interface MerchandisingCardProps {
  item: MerchandisingItem
}

export function MerchandisingCard({ item }: MerchandisingCardProps) {
  const [isHovered, setIsHovered] = useState(false)

  const getCategoryInfo = (category: string) => {
    switch (category) {
      case 'restaurante':
        return { label: 'Restaurante', color: 'bg-orange-500', icon: Store }
      case 'promocion':
        return { label: 'Promoción', color: 'bg-red-500', icon: Gift }
      case 'bar':
        return { label: 'Bar', color: 'bg-purple-500', icon: QrCode }
      default:
        return { label: 'General', color: 'bg-gray-500', icon: Store }
    }
  }

  const categoryInfo = getCategoryInfo(item.category)
  const CategoryIcon = categoryInfo.icon

  return (
    <div 
      className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden group"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Image */}
      <div className="relative h-64 overflow-hidden">
        <Image
          src={item.image}
          alt={item.name}
          fill
          className="object-cover group-hover:scale-105 transition-transform duration-300"
        />
        <div className="absolute top-4 left-4">
          <span className={`${categoryInfo.color} text-white px-3 py-1 rounded-full text-sm font-semibold flex items-center space-x-1`}>
            <CategoryIcon className="w-4 h-4" />
            <span>{categoryInfo.label}</span>
          </span>
        </div>
        <div className="absolute top-4 right-4">
          <span className="bg-green-500 text-white px-3 py-1 rounded-full text-sm font-semibold flex items-center space-x-1">
            <QrCode className="w-4 h-4" />
            <span>QR</span>
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        <h3 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-green-600 transition-colors">
          {item.name}
        </h3>
        
        <p className="text-gray-600 mb-4 text-sm leading-relaxed">
          {item.description}
        </p>

        {/* Features */}
        <ul className="space-y-2 mb-6">
          {item.features.map((feature, index) => (
            <li key={index} className="flex items-center text-sm text-gray-600">
              <div className="w-1.5 h-1.5 bg-green-500 rounded-full mr-3"></div>
              {feature}
            </li>
          ))}
        </ul>

        {/* Price and Actions */}
        <div className="flex items-center justify-between">
          <div>
            <span className="text-2xl font-bold text-gray-900">
              €{item.price}
            </span>
            <span className="text-sm text-gray-500 ml-2">por camiseta</span>
          </div>
          
          <div className="flex space-x-2">
            <Link 
              href={`/merchandising/${item.id}`}
              className="p-2 text-gray-400 hover:text-green-600 transition-colors"
            >
              <Eye className="w-5 h-5" />
            </Link>
            <button className="bg-green-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-green-700 transition-colors flex items-center space-x-2">
              <ShoppingCart className="w-4 h-4" />
              <span>Comprar</span>
            </button>
          </div>
        </div>

        {/* Business benefits */}
        <div className="mt-4 bg-green-50 border border-green-200 rounded-lg p-3">
          <div className="flex items-center space-x-2 mb-2">
            <Users className="w-4 h-4 text-green-600" />
            <span className="text-sm font-medium text-green-800">Beneficios para tu negocio:</span>
          </div>
          <ul className="text-xs text-green-700 space-y-1">
            <li>• Aumento de ventas hasta 30%</li>
            <li>• Reducción de costos de impresión</li>
            <li>• Mejora de la experiencia del cliente</li>
          </ul>
        </div>
      </div>
    </div>
  )
}

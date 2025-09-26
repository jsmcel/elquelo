'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { ShoppingCart, Eye, Zap, Users, Clock } from 'lucide-react'

interface Drop {
  id: string
  name: string
  description: string
  image: string
  price: number
  nftIncluded: boolean
  totalSupply: number
  minted: number
  features: string[]
}

interface DropCardProps {
  drop: Drop
}

export function DropCard({ drop }: DropCardProps) {
  const [isHovered, setIsHovered] = useState(false)
  const remaining = drop.totalSupply - drop.minted
  const percentage = (drop.minted / drop.totalSupply) * 100

  return (
    <div 
      className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden group"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Image */}
      <div className="relative h-64 overflow-hidden">
        <Image
          src={drop.image}
          alt={drop.name}
          fill
          className="object-cover group-hover:scale-105 transition-transform duration-300"
        />
        <div className="absolute top-4 left-4">
          <span className="bg-purple-600 text-white px-3 py-1 rounded-full text-sm font-semibold">
            DROP
          </span>
        </div>
        {drop.nftIncluded && (
          <div className="absolute top-4 right-4">
            <span className="bg-yellow-500 text-white px-3 py-1 rounded-full text-sm font-semibold flex items-center space-x-1">
              <Zap className="w-4 h-4" />
              <span>NFT</span>
            </span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-6">
        <h3 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-purple-600 transition-colors">
          {drop.name}
        </h3>
        
        <p className="text-gray-600 mb-4 text-sm leading-relaxed">
          {drop.description}
        </p>

        {/* Progress Bar */}
        <div className="mb-4">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium text-gray-700">
              {drop.minted} de {drop.totalSupply} vendidas
            </span>
            <span className="text-sm text-gray-500">
              {remaining} restantes
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-purple-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${percentage}%` }}
            />
          </div>
        </div>

        {/* Features */}
        <ul className="space-y-2 mb-6">
          {drop.features.map((feature, index) => (
            <li key={index} className="flex items-center text-sm text-gray-600">
              <div className="w-1.5 h-1.5 bg-purple-500 rounded-full mr-3"></div>
              {feature}
            </li>
          ))}
        </ul>

        {/* Price and Actions */}
        <div className="flex items-center justify-between">
          <div>
            <span className="text-2xl font-bold text-gray-900">
              €{drop.price}
            </span>
            {drop.nftIncluded && (
              <span className="text-sm text-gray-500 ml-2">+ NFT incluido</span>
            )}
          </div>
          
          <div className="flex space-x-2">
            <Link 
              href={`/drops/${drop.id}`}
              className="p-2 text-gray-400 hover:text-purple-600 transition-colors"
            >
              <Eye className="w-5 h-5" />
            </Link>
            <button className="bg-purple-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-purple-700 transition-colors flex items-center space-x-2">
              <ShoppingCart className="w-4 h-4" />
              <span>Comprar</span>
            </button>
          </div>
        </div>

        {/* Urgency indicator */}
        {remaining < 10 && (
          <div className="mt-4 flex items-center text-orange-600 text-sm">
            <Clock className="w-4 h-4 mr-2" />
            <span>Solo quedan {remaining} unidades</span>
          </div>
        )}
      </div>
    </div>
  )
}

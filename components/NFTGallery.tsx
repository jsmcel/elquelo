'use client'

import { useState, useEffect } from 'react'
import { useUser } from '@/app/providers'
import { Zap, ExternalLink, Image as ImageIcon } from 'lucide-react'

interface NFT {
  id: string
  drop_id: string
  nft_token_id: number
  transaction_hash: string
  claimed_at: string
  drop: {
    name: string
    description: string
    image_url: string
    nft_contract_address: string
  }
}

export function NFTGallery() {
  const { user } = useUser()
  const [nfts, setNfts] = useState<NFT[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (user) {
      fetchUserNFTs()
    }
  }, [user])

  const fetchUserNFTs = async () => {
    try {
      const response = await fetch('/api/user/nfts')
      const { nfts } = await response.json()
      setNfts(nfts || [])
    } catch (error) {
      console.error('Error fetching NFTs:', error)
    } finally {
      setLoading(false)
    }
  }

  if (!user) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">Inicia sesión para ver tus NFTs</p>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
        <p className="text-gray-600 mt-2">Cargando NFTs...</p>
      </div>
    )
  }

  if (nfts.length === 0) {
    return (
      <div className="text-center py-12">
        <Zap className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          No tienes NFTs aún
        </h3>
        <p className="text-gray-600 mb-4">
          Compra una camiseta DROP para obtener tu primer NFT
        </p>
        <a
          href="/drops"
          className="bg-primary-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-primary-700 transition-colors"
        >
          Ver Colecciones DROP
        </a>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {nfts.map((nft) => (
        <div key={nft.id} className="bg-white rounded-lg shadow-lg overflow-hidden">
          <div className="aspect-square bg-gradient-to-br from-purple-100 to-pink-100 flex items-center justify-center">
            {nft.drop.image_url ? (
              <img
                src={nft.drop.image_url}
                alt={nft.drop.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <ImageIcon className="w-12 h-12 text-gray-400" />
            )}
          </div>
          
          <div className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {nft.drop.name}
            </h3>
            <p className="text-gray-600 text-sm mb-4">
              {nft.drop.description}
            </p>
            
            <div className="space-y-2 mb-4">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Token ID:</span>
                <span className="text-gray-900">#{nft.nft_token_id}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Reclamado:</span>
                <span className="text-gray-900">
                  {new Date(nft.claimed_at).toLocaleDateString()}
                </span>
              </div>
            </div>
            
            <div className="flex space-x-2">
              <a
                href={`https://basescan.org/tx/${nft.transaction_hash}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 bg-gray-100 text-gray-700 px-3 py-2 rounded-md text-sm hover:bg-gray-200 transition-colors flex items-center justify-center space-x-1"
              >
                <span>Transacción</span>
                <ExternalLink className="w-3 h-3" />
              </a>
              <a
                href={`https://opensea.io/assets/base/${nft.drop.nft_contract_address}/${nft.nft_token_id}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 bg-purple-100 text-purple-700 px-3 py-2 rounded-md text-sm hover:bg-purple-200 transition-colors flex items-center justify-center space-x-1"
              >
                <span>OpenSea</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

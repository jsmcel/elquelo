'use client'

import { useState } from 'react'
import { useUser } from '@/app/providers'
import { toast } from 'react-hot-toast'
import { Zap, ExternalLink, CheckCircle, Loader } from 'lucide-react'

interface NFTClaimProps {
  dropId: string
  orderId?: string
  onClaimed?: () => void
}

export function NFTClaim({ dropId, orderId, onClaimed }: NFTClaimProps) {
  const { user } = useUser()
  const [claiming, setClaiming] = useState(false)
  const [claimed, setClaimed] = useState(false)
  const [claimData, setClaimData] = useState<any>(null)

  const handleClaim = async () => {
    if (!user) {
      toast.error('Debes iniciar sesión para reclamar tu NFT')
      return
    }

    setClaiming(true)
    try {
      const response = await fetch('/api/claim', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dropId, orderId }),
      })

      const { success, claim, transactionHash, nftUrl, error } = await response.json()

      if (success) {
        setClaimed(true)
        setClaimData({ transactionHash, nftUrl })
        toast.success('¡NFT reclamado exitosamente!')
        onClaimed?.()
      } else {
        toast.error(error || 'Error al reclamar NFT')
      }
    } catch (error) {
      toast.error('Error al reclamar NFT')
    } finally {
      setClaiming(false)
    }
  }

  if (!user) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <p className="text-yellow-800 text-sm">
          Inicia sesión para reclamar tu NFT
        </p>
      </div>
    )
  }

  if (claimed) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-lg p-6">
        <div className="flex items-center space-x-3 mb-4">
          <CheckCircle className="w-6 h-6 text-green-600" />
          <h3 className="text-lg font-semibold text-green-800">
            ¡NFT Reclamado!
          </h3>
        </div>
        <p className="text-green-700 mb-4">
          Tu NFT ha sido minteado exitosamente en la blockchain de Base.
        </p>
        {claimData && (
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <span className="text-sm text-green-600">Transacción:</span>
              <a
                href={`https://basescan.org/tx/${claimData.transactionHash}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-blue-600 hover:text-blue-800 flex items-center space-x-1"
              >
                <span>Ver en Basescan</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-sm text-green-600">NFT:</span>
              <a
                href={claimData.nftUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-blue-600 hover:text-blue-800 flex items-center space-x-1"
              >
                <span>Ver en OpenSea</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 rounded-lg p-6">
      <div className="flex items-center space-x-3 mb-4">
        <Zap className="w-6 h-6 text-purple-600" />
        <h3 className="text-lg font-semibold text-purple-800">
          ¡Reclama tu NFT!
        </h3>
      </div>
      <p className="text-purple-700 mb-4">
        Esta camiseta incluye un NFT único. Haz clic en el botón para reclamarlo en tu wallet.
      </p>
      <button
        onClick={handleClaim}
        disabled={claiming}
        className="bg-purple-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
      >
        {claiming ? (
          <>
            <Loader className="w-5 h-5 animate-spin" />
            <span>Reclamando...</span>
          </>
        ) : (
          <>
            <Zap className="w-5 h-5" />
            <span>Reclamar NFT</span>
          </>
        )}
      </button>
      <p className="text-xs text-purple-600 mt-2">
        El NFT se minteará en la blockchain de Base y aparecerá en tu wallet.
      </p>
    </div>
  )
}

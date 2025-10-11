'use client'

import React, { useState } from 'react'
import { useDragDrop } from './DragDropManager'
import { Upload } from 'lucide-react'

interface QRDropZoneProps {
  qrId: string
  qrCode: string
  eventId: string
  children: React.ReactNode
  className?: string
}

export function QRDropZone({ qrId, qrCode, eventId, children, className = '' }: QRDropZoneProps) {
  const { draggedItem, onDrop } = useDragDrop()
  const [isOver, setIsOver] = useState(false)
  const [isDropping, setIsDropping] = useState(false)

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'copy'
    setIsOver(true)
  }

  const handleDragLeave = () => {
    setIsOver(false)
  }

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault()
    setIsOver(false)

    if (!draggedItem) {
      console.warn('[QR DROP] No dragged item')
      return
    }

    setIsDropping(true)

    try {
      await onDrop(qrId, draggedItem, eventId)
    } catch (error) {
      console.error('[QR DROP] Error:', error)
    } finally {
      setIsDropping(false)
    }
  }

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`relative transition-all ${className} ${
        isOver ? 'ring-2 ring-primary-500 ring-offset-2 bg-primary-50' : ''
      } ${isDropping ? 'opacity-50 pointer-events-none' : ''}`}
    >
      {children}

      {isOver && (
        <div className="absolute inset-0 flex items-center justify-center bg-primary-100 bg-opacity-90 rounded-xl pointer-events-none z-10">
          <div className="text-center">
            <Upload className="h-8 w-8 text-primary-600 mx-auto mb-2 animate-bounce" />
            <p className="text-sm font-semibold text-primary-900">
              Soltar en QR: {qrCode}
            </p>
            <p className="text-xs text-primary-700 mt-1">
              {draggedItem?.label}
            </p>
          </div>
        </div>
      )}

      {isDropping && (
        <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-90 rounded-xl z-20">
          <div className="text-center">
            <div className="animate-spin h-8 w-8 border-4 border-primary-600 border-t-transparent rounded-full mx-auto mb-2"></div>
            <p className="text-sm font-semibold text-gray-900">Creando destino...</p>
          </div>
        </div>
      )}
    </div>
  )
}













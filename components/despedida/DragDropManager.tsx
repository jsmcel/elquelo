'use client'

import React, { createContext, useContext, useState } from 'react'
import { toast } from 'react-hot-toast'

export type DraggableItemType = 'prueba' | 'mensaje' | 'url' | 'album' | 'destination' | 'microsite'

export interface DraggableItem {
  type: DraggableItemType
  id: string
  label: string
  url?: string
  data: any
}

interface DragDropContextValue {
  draggedItem: DraggableItem | null
  setDraggedItem: (item: DraggableItem | null) => void
  onDrop: (qrId: string, item: DraggableItem, eventId: string) => Promise<void>
}

const DragDropContext = createContext<DragDropContextValue | undefined>(undefined)

export function useDragDrop() {
  const context = useContext(DragDropContext)
  if (!context) {
    throw new Error('useDragDrop must be used within DragDropProvider')
  }
  return context
}

export function DragDropProvider({ children }: { children: React.ReactNode }) {
  const [draggedItem, setDraggedItem] = useState<DraggableItem | null>(null)

  const onDrop = async (qrId: string, item: DraggableItem, eventId: string) => {
    try {
      console.log('[DRAG DROP] Dropping', item.type, 'on QR', qrId)

      let destinationPayload: any = {
        qrId,
        isActive: true,
      }

      switch (item.type) {
        case 'prueba':
          destinationPayload = {
            ...destinationPayload,
            type: 'prueba',
            label: item.label,
            targetUrl: `/e/${eventId}/reto/${item.id}`,
          }
          break

        case 'mensaje':
          destinationPayload = {
            ...destinationPayload,
            type: 'message_wall',
            label: `Mensaje: ${item.label}`,
            targetUrl: `/e/${eventId}/mensaje/${item.id}`,
          }
          break

        case 'url':
          destinationPayload = {
            ...destinationPayload,
            type: 'external',
            label: item.label || 'Enlace externo',
            targetUrl: item.url || item.data.url,
          }
          break

        case 'album':
          destinationPayload = {
            ...destinationPayload,
            type: 'album',
            label: `Álbum: ${item.label}`,
            targetUrl: `/e/${eventId}/album`,
          }
          break

        case 'microsite':
          destinationPayload = {
            ...destinationPayload,
            type: 'microsite',
            label: 'Microsite del evento',
            targetUrl: `/e/${eventId}/microsite`,
          }
          break

        default:
          throw new Error(`Unknown item type: ${item.type}`)
      }

      console.log('[DRAG DROP] Creating destination:', destinationPayload)

      const response = await fetch(`/api/events/${eventId}/destinations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(destinationPayload),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to create destination')
      }

      const result = await response.json()
      console.log('[DRAG DROP] Success:', result)

      toast.success(`✅ "${item.label}" añadido al QR`)

      // Recargar la página para ver los cambios
      setTimeout(() => window.location.reload(), 500)

      return result.destination
    } catch (error: any) {
      console.error('[DRAG DROP] Error:', error)
      toast.error(error.message || 'Error al añadir destino')
      throw error
    }
  }

  return (
    <DragDropContext.Provider value={{ draggedItem, setDraggedItem, onDrop }}>
      {children}
    </DragDropContext.Provider>
  )
}










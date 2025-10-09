'use client'

import { useState } from 'react'
import { toast } from 'react-hot-toast'
import { Loader2, Clock, Send, Trash2 } from 'lucide-react'
import type { EventSummary } from '@/types/despedida'

interface MessageWallProps {
  eventId: string
  messages: EventSummary['messages']
  onMessageUpdated: (message: EventSummary['messages'][number]) => void
  onMessageRemoved: (messageId: string) => void
}

export function MessageWall({ eventId, messages, onMessageUpdated, onMessageRemoved }: MessageWallProps) {
  const [processingId, setProcessingId] = useState<string | null>(null)

  const updateMessage = async (messageId: string, updates: Record<string, unknown>, success: string) => {
    setProcessingId(messageId)
    try {
      const response = await fetch(`/api/events/${eventId}/messages/${messageId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      })
      if (!response.ok) {
        throw new Error('No se pudo actualizar el mensaje')
      }
      const payload = await response.json()
      toast.success(success)
      onMessageUpdated(payload.message)
    } catch (error) {
      console.error(error)
      toast.error('Error actualizando mensaje')
    } finally {
      setProcessingId(null)
    }
  }

  const deleteMessage = async (messageId: string) => {
    setProcessingId(messageId)
    try {
      const response = await fetch(`/api/events/${eventId}/messages/${messageId}`, {
        method: 'DELETE',
      })
      if (!response.ok) {
        throw new Error('No se pudo eliminar')
      }
      toast.success('Mensaje eliminado')
      onMessageRemoved(messageId)
    } catch (error) {
      console.error(error)
      toast.error('Error eliminando mensaje')
    } finally {
      setProcessingId(null)
    }
  }

  return (
    <section className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
      <h2 className="text-lg font-semibold text-gray-900">Mensajes programados</h2>
      <p className="mt-1 text-sm text-gray-600">
        Controla cuándo se liberan las sorpresas enviadas por los amigos que no asisten a la despedida.
      </p>
      <div className="mt-5 space-y-4">
        {messages.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-primary-200 bg-primary-50 p-6 text-sm text-primary-700">
            Aún no hay mensajes. Comparte el enlace de aportación para que empiecen a llegar las sorpresas.
          </div>
        ) : (
          messages.map((message) => {
            const schedule = message.scheduled_at ? new Date(message.scheduled_at) : null
            const published = message.published_at ? new Date(message.published_at) : null
            const isScheduling = processingId === message.id
            const visibilityLabel =
              message.visibility === 'scheduled'
                ? 'Programado'
                : message.visibility === 'published'
                ? 'Publicado'
                : message.visibility === 'archived'
                ? 'Archivado'
                : 'Borrador'

            return (
              <div key={message.id} className="flex items-center justify-between rounded-2xl border border-gray-100 bg-gray-50 p-4">
                <div>
                  <p className="text-sm font-semibold text-gray-900">{visibilityLabel}</p>
                  <p className="mt-1 flex items-center gap-2 text-xs text-gray-600">
                    <Clock className="h-3 w-3" />
                    {schedule ? `Se libera el ${schedule.toLocaleString('es-ES')}` : 'Sin fecha programada'}
                  </p>
                  {published ? (
                    <p className="text-xs text-green-600">Publicado el {published.toLocaleString('es-ES')}</p>
                  ) : null}
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => updateMessage(message.id, { visibility: 'published', publishedAt: new Date().toISOString() }, 'Mensaje publicado')}
                    disabled={isScheduling}
                    className="inline-flex items-center gap-1 rounded-lg bg-primary-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {isScheduling ? <Loader2 className="h-3 w-3 animate-spin" /> : <Send className="h-3 w-3" />}
                    Publicar
                  </button>
                  <button
                    onClick={() => deleteMessage(message.id)}
                    disabled={isScheduling}
                    className="inline-flex items-center gap-1 rounded-lg border border-red-200 px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <Trash2 className="h-3 w-3" />
                    Eliminar
                  </button>
                </div>
              </div>
            )
          })
        )}
      </div>
    </section>
  )
}
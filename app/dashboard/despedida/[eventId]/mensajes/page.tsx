'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Header } from '@/components/Header'
import { Footer } from '@/components/Footer'
import { MessageWall } from '@/components/despedida/MessageWall'
import { Loader2, ArrowLeft, ExternalLink, Copy } from 'lucide-react'
import { toast } from 'react-hot-toast'
import type { EventSummary } from '@/types/despedida'

export default function MessageWallConfigPage() {
  const params = useParams<{ eventId: string }>()
  const router = useRouter()
  const eventId = params.eventId
  const [summary, setSummary] = useState<EventSummary | null>(null)
  const [loading, setLoading] = useState(true)
  const [settings, setSettings] = useState({
    title: 'Muro de mensajes',
    instructions: 'Deja un mensaje especial para la persona homenajeada',
    deadline: '',
    allowVideo: true,
    allowAudio: true,
    maxDuration: 60,
  })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    const loadEvent = async () => {
      try {
        const response = await fetch(`/api/events/${eventId}/summary`)
        if (response.ok) {
          const data = await response.json()
          setSummary(data)
          
          const messageModule = data.modules?.find((m: any) => m.type === 'message_wall')
          if (messageModule?.settings) {
            setSettings({
              title: messageModule.settings.title || 'Muro de mensajes',
              instructions: messageModule.settings.instructions || 'Deja un mensaje especial',
              deadline: messageModule.settings.deadline || '',
              allowVideo: messageModule.settings.allowVideo ?? true,
              allowAudio: messageModule.settings.allowAudio ?? true,
              maxDuration: messageModule.settings.maxDuration || 60,
            })
          }
        }
      } catch (error) {
        console.error('Error loading event:', error)
        toast.error('Error cargando evento')
      } finally {
        setLoading(false)
      }
    }

    loadEvent()
  }, [eventId])

  const handleSaveSettings = async () => {
    setSaving(true)
    try {
      const response = await fetch(`/api/events/${eventId}/modules/message_wall`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'active',
          settings,
        }),
      })

      if (!response.ok) throw new Error('Error guardando configuración')

      toast.success('Configuración guardada')
    } catch (error) {
      console.error(error)
      toast.error('Error guardando configuración')
    } finally {
      setSaving(false)
    }
  }

  const handleMessageUpdate = (updatedMessage: any) => {
    if (!summary) return
    setSummary({
      ...summary,
      messages: summary.messages.map(m => m.id === updatedMessage.id ? updatedMessage : m)
    })
  }

  const handleMessageRemove = (messageId: string) => {
    if (!summary) return
    setSummary({
      ...summary,
      messages: summary.messages.filter(m => m.id !== messageId)
    })
  }

  const getSendMessageUrl = () => {
    return `${window.location.origin}/e/${eventId}/enviar-mensaje`
  }

  const getViewMessagesUrl = () => {
    return `${window.location.origin}/e/${eventId}/mensajes`
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
      </div>
    )
  }

  if (!summary) {
    return <div>Evento no encontrado</div>
  }

  const messageModule = summary.modules?.find(m => m.type === 'message_wall')
  const isActive = messageModule?.status === 'active'

  return (
    <main className="min-h-screen bg-gray-50">
      <Header />
      <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
        <button
          onClick={() => router.back()}
          className="mb-6 inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft className="h-4 w-4" />
          Volver al panel
        </button>

        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Muro de Mensajes</h1>
          <p className="mt-2 text-gray-600">
            Recibe mensajes de amigos que no pueden asistir y publícalos en el momento perfecto
          </p>
        </div>

        {!isActive && (
          <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50 p-4">
            <p className="text-sm text-amber-800">
              ⚠️ El módulo de mensajes está desactivado. Actívalo primero en el panel principal.
            </p>
          </div>
        )}

        <div className="space-y-6">
          {/* Configuración */}
          <section className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-gray-900">Configuración</h2>
            <div className="mt-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Título
                </label>
                <input
                  type="text"
                  value={settings.title}
                  onChange={(e) => setSettings(prev => ({ ...prev, title: e.target.value }))}
                  className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-200"
                  placeholder="Muro de mensajes"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Instrucciones para enviar
                </label>
                <textarea
                  value={settings.instructions}
                  onChange={(e) => setSettings(prev => ({ ...prev, instructions: e.target.value }))}
                  rows={3}
                  className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-200"
                  placeholder="Deja tu mensaje especial..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Fecha límite para enviar (opcional)
                </label>
                <input
                  type="datetime-local"
                  value={settings.deadline}
                  onChange={(e) => setSettings(prev => ({ ...prev, deadline: e.target.value }))}
                  className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-200"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center justify-between rounded-xl border border-gray-200 p-4">
                  <div>
                    <p className="text-sm font-medium text-gray-900">Permitir video</p>
                  </div>
                  <label className="relative inline-flex cursor-pointer items-center">
                    <input
                      type="checkbox"
                      checked={settings.allowVideo}
                      onChange={(e) => setSettings(prev => ({ ...prev, allowVideo: e.target.checked }))}
                      className="sr-only peer"
                    />
                    <div className="peer h-6 w-11 rounded-full bg-gray-200 after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-gray-300 after:bg-white after:transition-all after:content-[''] peer-checked:bg-primary-600 peer-checked:after:translate-x-full peer-checked:after:border-white"></div>
                  </label>
                </div>

                <div className="flex items-center justify-between rounded-xl border border-gray-200 p-4">
                  <div>
                    <p className="text-sm font-medium text-gray-900">Permitir audio</p>
                  </div>
                  <label className="relative inline-flex cursor-pointer items-center">
                    <input
                      type="checkbox"
                      checked={settings.allowAudio}
                      onChange={(e) => setSettings(prev => ({ ...prev, allowAudio: e.target.checked }))}
                      className="sr-only peer"
                    />
                    <div className="peer h-6 w-11 rounded-full bg-gray-200 after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-gray-300 after:bg-white after:transition-all after:content-[''] peer-checked:bg-primary-600 peer-checked:after:translate-x-full peer-checked:after:border-white"></div>
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Duración máxima (segundos)
                </label>
                <input
                  type="number"
                  value={settings.maxDuration}
                  onChange={(e) => setSettings(prev => ({ ...prev, maxDuration: parseInt(e.target.value) }))}
                  min={30}
                  max={180}
                  className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-200"
                />
              </div>

              <div className="flex justify-end">
                <button
                  onClick={handleSaveSettings}
                  disabled={saving}
                  className="inline-flex items-center gap-2 rounded-xl bg-primary-600 px-4 py-2 text-sm font-semibold text-white hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                  Guardar configuración
                </button>
              </div>
            </div>
          </section>

          {/* URLs públicas */}
          {isActive && (
            <section className="rounded-3xl border border-green-200 bg-green-50 p-6">
              <h3 className="text-sm font-semibold text-green-900">URLs públicas</h3>
              
              <div className="mt-4 space-y-3">
                <div>
                  <p className="text-xs font-medium text-green-700">Para enviar mensajes:</p>
                  <div className="mt-1 flex items-center gap-2">
                    <input
                      type="text"
                      readOnly
                      value={getSendMessageUrl()}
                      className="flex-1 rounded-lg border border-green-300 bg-white px-3 py-2 text-xs font-mono"
                    />
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(getSendMessageUrl())
                        toast.success('URL copiada')
                      }}
                      className="rounded-lg bg-green-600 p-2 text-white hover:bg-green-700"
                    >
                      <Copy className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                <div>
                  <p className="text-xs font-medium text-green-700">Para ver mensajes publicados:</p>
                  <div className="mt-1 flex items-center gap-2">
                    <input
                      type="text"
                      readOnly
                      value={getViewMessagesUrl()}
                      className="flex-1 rounded-lg border border-green-300 bg-white px-3 py-2 text-xs font-mono"
                    />
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(getViewMessagesUrl())
                        toast.success('URL copiada')
                      }}
                      className="rounded-lg bg-green-600 p-2 text-white hover:bg-green-700"
                    >
                      <Copy className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            </section>
          )}

          {/* Gestión de mensajes */}
          <MessageWall
            eventId={eventId}
            messages={summary.messages}
            onMessageUpdated={handleMessageUpdate}
            onMessageRemoved={handleMessageRemove}
          />
        </div>
      </div>
      <Footer />
    </main>
  )
}





'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Header } from '@/components/Header'
import { Footer } from '@/components/Footer'
import { AlbumManager } from '@/components/despedida/AlbumManager'
import { Loader2, ArrowLeft, ExternalLink } from 'lucide-react'
import { toast } from 'react-hot-toast'
import type { EventSummary } from '@/types/despedida'

export default function AlbumConfigPage() {
  const params = useParams<{ eventId: string }>()
  const router = useRouter()
  const eventId = params.eventId
  const [summary, setSummary] = useState<EventSummary | null>(null)
  const [loading, setLoading] = useState(true)
  const [albumSettings, setAlbumSettings] = useState({
    title: 'Álbum colaborativo',
    description: 'Comparte tus mejores momentos del evento',
    allowUploads: true,
    requireApproval: true,
  })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    const loadEvent = async () => {
      try {
        const response = await fetch(`/api/events/${eventId}/summary`)
        if (response.ok) {
          const data = await response.json()
          setSummary(data)
          
          // Load album module settings if exists
          const albumModule = data.modules?.find((m: any) => m.type === 'album')
          if (albumModule?.settings) {
            setAlbumSettings({
              title: albumModule.settings.title || 'Álbum colaborativo',
              description: albumModule.settings.description || 'Comparte tus mejores momentos del evento',
              allowUploads: albumModule.settings.allowUploads ?? true,
              requireApproval: albumModule.settings.requireApproval ?? true,
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
      const response = await fetch(`/api/events/${eventId}/modules/album`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'active',
          settings: albumSettings,
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

  const getAlbumPublicUrl = () => {
    return `${window.location.origin}/e/${eventId}/album`
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

  const albumModule = summary.modules?.find(m => m.type === 'album')
  const isActive = albumModule?.status === 'active'

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
          <h1 className="text-3xl font-bold text-gray-900">Configuración del Álbum</h1>
          <p className="mt-2 text-gray-600">
            Gestiona el álbum colaborativo donde los invitados pueden compartir fotos y videos
          </p>
        </div>

        {!isActive && (
          <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50 p-4">
            <p className="text-sm text-amber-800">
              ⚠️ El módulo de álbum está desactivado. Actívalo primero en el panel principal.
            </p>
          </div>
        )}

        <div className="space-y-6">
          {/* Configuración básica */}
          <section className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-gray-900">Configuración básica</h2>
            <div className="mt-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Título del álbum
                </label>
                <input
                  type="text"
                  value={albumSettings.title}
                  onChange={(e) => setAlbumSettings(prev => ({ ...prev, title: e.target.value }))}
                  className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-200"
                  placeholder="Álbum colaborativo"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Descripción
                </label>
                <textarea
                  value={albumSettings.description}
                  onChange={(e) => setAlbumSettings(prev => ({ ...prev, description: e.target.value }))}
                  rows={3}
                  className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-200"
                  placeholder="Comparte tus mejores momentos..."
                />
              </div>

              <div className="flex items-center justify-between rounded-xl border border-gray-200 p-4">
                <div>
                  <p className="text-sm font-medium text-gray-900">Permitir subidas de invitados</p>
                  <p className="text-xs text-gray-600">Los invitados pueden subir fotos desde sus móviles</p>
                </div>
                <label className="relative inline-flex cursor-pointer items-center">
                  <input
                    type="checkbox"
                    checked={albumSettings.allowUploads}
                    onChange={(e) => setAlbumSettings(prev => ({ ...prev, allowUploads: e.target.checked }))}
                    className="sr-only peer"
                  />
                  <div className="peer h-6 w-11 rounded-full bg-gray-200 after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-gray-300 after:bg-white after:transition-all after:content-[''] peer-checked:bg-primary-600 peer-checked:after:translate-x-full peer-checked:after:border-white peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-200"></div>
                </label>
              </div>

              <div className="flex items-center justify-between rounded-xl border border-gray-200 p-4">
                <div>
                  <p className="text-sm font-medium text-gray-900">Requiere aprobación</p>
                  <p className="text-xs text-gray-600">Las fotos deben ser aprobadas antes de mostrarse</p>
                </div>
                <label className="relative inline-flex cursor-pointer items-center">
                  <input
                    type="checkbox"
                    checked={albumSettings.requireApproval}
                    onChange={(e) => setAlbumSettings(prev => ({ ...prev, requireApproval: e.target.checked }))}
                    className="sr-only peer"
                  />
                  <div className="peer h-6 w-11 rounded-full bg-gray-200 after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-gray-300 after:bg-white after:transition-all after:content-[''] peer-checked:bg-primary-600 peer-checked:after:translate-x-full peer-checked:after:border-white peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-200"></div>
                </label>
              </div>

              <div className="flex justify-end gap-3">
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

          {/* URL pública */}
          {isActive && (
            <section className="rounded-3xl border border-green-200 bg-green-50 p-6">
              <h3 className="text-sm font-semibold text-green-900">URL pública del álbum</h3>
              <p className="mt-1 text-xs text-green-700">
                Comparte este enlace para que los invitados vean y suban fotos
              </p>
              <div className="mt-3 flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={getAlbumPublicUrl()}
                  className="flex-1 rounded-lg border border-green-300 bg-white px-3 py-2 text-sm font-mono"
                />
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(getAlbumPublicUrl())
                    toast.success('URL copiada')
                  }}
                  className="rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-700"
                >
                  Copiar
                </button>
                <a
                  href={getAlbumPublicUrl()}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-700"
                >
                  <ExternalLink className="h-4 w-4" />
                  Ver
                </a>
              </div>
            </section>
          )}

          {/* Gestor de archivos */}
          <AlbumManager eventId={eventId} summary={summary} />
        </div>
      </div>
      <Footer />
    </main>
  )
}













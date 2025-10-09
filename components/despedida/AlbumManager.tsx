'use client'

import { useState } from 'react'
import { toast } from 'react-hot-toast'
import { Loader2, UploadCloud, Eye } from 'lucide-react'
import type { EventSummary } from '@/types/despedida'

interface AlbumManagerProps {
  eventId: string
  summary: EventSummary
}

export function AlbumManager({ eventId, summary }: AlbumManagerProps) {
  const album = summary.destinations.find((destination) => destination.type === 'album')
  const [isUploading, setIsUploading] = useState(false)
  const [assetUrl, setAssetUrl] = useState('')
  const [thumbnailUrl, setThumbnailUrl] = useState('')
  const [visibility, setVisibility] = useState<'approved' | 'pending' | 'hidden'>('pending')

  const createMediaRecord = async () => {
    if (!assetUrl.trim()) {
      toast.error('Añade la URL del archivo subido a Supabase storage')
      return
    }

    if (!album) {
      toast.error('No hay módulo de álbum activo')
      return
    }

    setIsUploading(true)
    try {
      const response = await fetch(`/api/events/${eventId}/album/media`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          albumId: album.id,
          assetUrl,
          thumbnailUrl: thumbnailUrl || undefined,
          visibility,
        }),
      })

      if (!response.ok) {
        throw new Error('No se pudo registrar el archivo')
      }

      toast.success('Archivo añadido al álbum')
      setAssetUrl('')
      setThumbnailUrl('')
      setVisibility('pending')
    } catch (error) {
      console.error(error)
      toast.error('Error registrando archivo')
    } finally {
      setIsUploading(false)
    }
  }

  return (
    <section className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
      <h2 className="text-lg font-semibold text-gray-900">Álbum colaborativo</h2>
      <p className="mt-1 text-sm text-gray-600">
        El equipo puede subir fotos y vídeos desde el móvil. Registra los archivos ya subidos a Supabase para mostrarlos en el panel.
      </p>

      {!album ? (
        <p className="mt-4 rounded-2xl border border-dashed border-amber-200 bg-amber-50 p-4 text-sm text-amber-700">
          Activa el módulo de álbum para comenzar a recopilar recuerdos.
        </p>
      ) : (
        <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-3">
          <label className="text-xs font-semibold uppercase tracking-wide text-gray-700 md:col-span-3">
            URL del archivo (storage)
            <input
              type="url"
              className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm"
              placeholder="https://..."
              value={assetUrl}
              onChange={(event) => setAssetUrl(event.target.value)}
            />
          </label>
          <label className="text-xs font-semibold uppercase tracking-wide text-gray-700 md:col-span-2">
            Miniatura (opcional)
            <input
              type="url"
              className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm"
              placeholder="https://..."
              value={thumbnailUrl}
              onChange={(event) => setThumbnailUrl(event.target.value)}
            />
          </label>
          <label className="text-xs font-semibold uppercase tracking-wide text-gray-700">
            Visibilidad
            <select
              value={visibility}
              onChange={(event) => setVisibility(event.target.value as typeof visibility)}
              className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm"
            >
              <option value="approved">Aprobado</option>
              <option value="pending">Pendiente</option>
              <option value="hidden">Oculto</option>
            </select>
          </label>
          <div className="md:col-span-3 flex justify-end gap-3">
            <button
              onClick={createMediaRecord}
              disabled={isUploading}
              className="inline-flex items-center gap-2 rounded-xl bg-primary-600 px-4 py-2 text-sm font-semibold text-white hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isUploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <UploadCloud className="h-4 w-4" />}
              Registrar archivo
            </button>
          </div>
        </div>
      )}

      <div className="mt-6 rounded-2xl border border-gray-100 bg-gray-50 p-4 text-xs text-gray-600">
        <p className="font-semibold text-gray-700">Cómo funciona:</p>
        <ol className="mt-2 list-decimal space-y-1 pl-5">
          <li>El móvil sube la imagen/vídeo a Supabase Storage con un token de servicio.</li>
          <li>Registra aquí la URL para que aparezca en el panel y la microsite.</li>
          <li>Modera la visibilidad antes de compartir el enlace con los invitados.</li>
        </ol>
      </div>
    </section>
  )
}
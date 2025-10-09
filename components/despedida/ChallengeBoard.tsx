'use client'

import { useState } from 'react'
import { toast } from 'react-hot-toast'
import { Loader2, Trophy, Flag } from 'lucide-react'
import type { EventSummary } from '@/types/despedida'

interface ChallengeBoardProps {
  eventId: string
  pruebas: EventSummary['pruebas']
  onPruebaCreated: (prueba: EventSummary['pruebas'][number]) => void
}

export function ChallengeBoard({ eventId, pruebas, onPruebaCreated }: ChallengeBoardProps) {
  const [isCreating, setIsCreating] = useState(false)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [creating, setCreating] = useState(false)

  const handleSubmit = async () => {
    if (!title.trim()) {
      toast.error('Añade un título para la prueba')
      return
    }

    setCreating(true)
    try {
      const response = await fetch(`/api/events/${eventId}/pruebas`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, description }),
      })

      if (!response.ok) {
        throw new Error('Error creando prueba')
      }

      const payload = await response.json()
      onPruebaCreated(payload.prueba)
      toast.success('Prueba creada')
      setTitle('')
      setDescription('')
      setIsCreating(false)
    } catch (error) {
      console.error(error)
      toast.error('No se pudo crear la prueba')
    } finally {
      setCreating(false)
    }
  }

  return (
    <section className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Pruebas y retos</h2>
          <p className="text-sm text-gray-600">
            Organiza dinámicas para el fin de semana y haz seguimiento de su progreso.
          </p>
        </div>
        <button
          onClick={() => setIsCreating((prev) => !prev)}
          className="inline-flex items-center gap-1 rounded-lg border border-primary-200 px-3 py-1.5 text-xs font-semibold text-primary-700 hover:bg-primary-50"
        >
          <Trophy className="h-3 w-3" /> Nueva prueba
        </button>
      </div>

      {isCreating ? (
        <div className="mt-5 rounded-2xl border border-primary-200 bg-primary-50 p-4">
          <label className="text-xs font-semibold uppercase tracking-wide text-primary-700">
            Título
            <input
              type="text"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              className="mt-1 w-full rounded-xl border border-primary-200 px-3 py-2 text-sm"
            />
          </label>
          <label className="mt-3 text-xs font-semibold uppercase tracking-wide text-primary-700">
            Descripción
            <textarea
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              className="mt-1 h-24 w-full rounded-xl border border-primary-200 px-3 py-2 text-sm"
            />
          </label>
          <div className="mt-4 flex justify-end gap-3">
            <button
              onClick={() => setIsCreating(false)}
              className="rounded-xl px-3 py-2 text-xs font-semibold text-primary-700 hover:bg-primary-100"
            >
              Cancelar
            </button>
            <button
              onClick={handleSubmit}
              disabled={creating}
              className="inline-flex items-center gap-1 rounded-xl bg-primary-600 px-3 py-2 text-xs font-semibold text-white hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {creating ? <Loader2 className="h-3 w-3 animate-spin" /> : <Flag className="h-3 w-3" />}
              Guardar
            </button>
          </div>
        </div>
      ) : null}

      <div className="mt-5 space-y-3">
        {pruebas.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-gray-200 bg-gray-50 p-4 text-sm text-gray-600">
            Sin pruebas aún. Crea retos para gamificar la despedida y motivar a los equipos.
          </p>
        ) : (
          pruebas.map((prueba) => (
            <div key={prueba.id} className="rounded-2xl border border-gray-100 bg-gray-50 p-4">
              <p className="text-sm font-semibold text-gray-900">{prueba.title}</p>
              <p className="mt-1 text-xs text-gray-500">
                {prueba.start_at
                  ? `Disponible desde ${new Date(prueba.start_at).toLocaleString('es-ES')}`
                  : 'Disponible inmediatamente'}
              </p>
              {prueba.end_at ? (
                <p className="text-xs text-gray-500">
                  Termina el {new Date(prueba.end_at).toLocaleString('es-ES')}
                </p>
              ) : null}
            </div>
          ))
        )}
      </div>
    </section>
  )
}
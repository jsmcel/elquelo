'use client'

import { useState } from 'react'
import { toast } from 'react-hot-toast'
import { Loader2 } from 'lucide-react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import type { EventSummary } from '@/types/despedida'

interface EventOverviewProps {
  summary: EventSummary
  onScheduleUpdated: (event: EventSummary['event']) => void
}

export function EventOverview({ summary, onScheduleUpdated }: EventOverviewProps) {
  const { event, stats } = summary
  const [updating, setUpdating] = useState(false)
  const [eventDate, setEventDate] = useState(() =>
    event.event_date ? event.event_date.slice(0, 16) : ''
  )
  const [ttlDays, setTtlDays] = useState(() => String(event.content_ttl_days ?? 30))
  const [timezone, setTimezone] = useState(() => event.event_timezone ?? Intl.DateTimeFormat().resolvedOptions().timeZone)

  const handleUpdateSchedule = async () => {
    if (!eventDate) {
      toast.error('Indica una fecha válida')
      return
    }
    const ttlNumber = parseInt(ttlDays, 10)
    if (Number.isNaN(ttlNumber) || ttlNumber <= 0) {
      toast.error('El TTL debe ser un número positivo')
      return
    }

    setUpdating(true)
    try {
      const response = await fetch(`/api/events/${event.id}/schedule`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          eventDate,
          contentTtlDays: ttlNumber,
          eventTimezone: timezone,
        }),
      })

      if (!response.ok) {
        throw new Error('No se pudo actualizar la agenda')
      }

      const payload = await response.json()
      toast.success('Agenda actualizada')
      onScheduleUpdated(payload.event)
    } catch (error) {
      console.error(error)
      toast.error('Error actualizando la agenda')
    } finally {
      setUpdating(false)
    }
  }

  const formattedEventDate = event.event_date
    ? format(new Date(event.event_date), "dd 'de' MMMM yyyy 'a' HH:mm", { locale: es })
    : 'Pendiente'
  const formattedExpiry = event.expires_at
    ? format(new Date(event.expires_at), "dd 'de' MMMM yyyy", { locale: es })
    : 'Sin definir'

  return (
    <section className="grid grid-cols-1 gap-6 lg:grid-cols-3">
      <div className="rounded-3xl border border-primary-100 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-900">Resumen</h2>
        <p className="mt-1 text-sm text-gray-600">
          Controla el ciclo de vida del evento y mantiene los QR activos solo durante el periodo necesario.
        </p>
        <dl className="mt-6 space-y-4 text-sm">
          <div className="flex items-center justify-between">
            <dt className="text-gray-500">Estado</dt>
            <dd className="font-medium capitalize text-gray-900">{event.status}</dd>
          </div>
          <div className="flex items-center justify-between">
            <dt className="text-gray-500">Evento</dt>
            <dd className="font-medium text-gray-900">{formattedEventDate}</dd>
          </div>
          <div className="flex items-center justify-between">
            <dt className="text-gray-500">Caducidad</dt>
            <dd className="font-medium text-gray-900">{formattedExpiry}</dd>
          </div>
          <div className="flex items-center justify-between">
            <dt className="text-gray-500">QRs</dt>
            <dd className="font-semibold text-indigo-600">{stats.qrCount}</dd>
          </div>
          <div className="flex items-center justify-between">
            <dt className="text-gray-500">Escaneos</dt>
            <dd className="font-semibold text-green-600">{stats.totalScans}</dd>
          </div>
          <div className="flex items-center justify-between">
            <dt className="text-gray-500">Mensajes programados</dt>
            <dd className="font-semibold text-amber-600">{stats.scheduledMessages}</dd>
          </div>
        </dl>
      </div>

      <div className="rounded-3xl border border-primary-100 bg-white p-6 shadow-sm lg:col-span-2">
        <h3 className="text-lg font-semibold text-gray-900">Programación del evento</h3>
        <p className="mt-1 text-sm text-gray-600">
          Ajusta la fecha de la despedida, la zona horaria y los días que el contenido estará disponible.
        </p>
        <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-3">
          <label className="flex flex-col text-sm font-medium text-gray-700">
            Fecha y hora
            <input
              type="datetime-local"
              value={eventDate}
              onChange={(event) => setEventDate(event.target.value)}
              className="mt-2 rounded-xl border border-gray-200 px-3 py-2 text-sm focus:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-200"
            />
          </label>
          <label className="flex flex-col text-sm font-medium text-gray-700">
            Días activos
            <input
              type="number"
              min={1}
              value={ttlDays}
              onChange={(event) => setTtlDays(event.target.value)}
              className="mt-2 rounded-xl border border-gray-200 px-3 py-2 text-sm focus:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-200"
            />
          </label>
          <label className="flex flex-col text-sm font-medium text-gray-700">
            Zona horaria
            <input
              type="text"
              value={timezone}
              onChange={(event) => setTimezone(event.target.value)}
              className="mt-2 rounded-xl border border-gray-200 px-3 py-2 text-sm focus:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-200"
            />
          </label>
        </div>
        <div className="mt-5 flex justify-end">
          <button
            onClick={handleUpdateSchedule}
            disabled={updating}
            className="inline-flex items-center rounded-xl bg-primary-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {updating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Guardar cambios
          </button>
        </div>
      </div>
    </section>
  )
}
'use client'

import Link from 'next/link'
import { useQuery } from '@tanstack/react-query'
import { Loader2, Calendar, QrCode, Activity } from 'lucide-react'
import { Header } from '@/components/Header'
import { Footer } from '@/components/Footer'
import { useUser } from '@/app/providers'

interface DashboardEvent {
  id: string
  name: string | null
  description: string | null
  status: string
  type: string
  event_date: string | null
  expires_at: string | null
  content_ttl_days: number | null
  event_timezone: string | null
  qr_count: number
  scan_count: number
  role: string
}

async function fetchEvents(): Promise<DashboardEvent[]> {
  const response = await fetch('/api/events')
  if (!response.ok) {
    throw new Error('No se pudieron cargar los eventos')
  }
  const payload = await response.json()
  return payload.events ?? []
}

export default function DespedidaDashboardPage() {
  const { user, loading } = useUser()
  const {
    data: events,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['events'],
    queryFn: fetchEvents,
    enabled: !!user,
  })

  if (loading || (isLoading && !events)) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
      </div>
    )
  }

  if (!user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <p className="text-gray-700">Inicia sesión para ver tus despedidas</p>
      </div>
    )
  }

  return (
    <main className="min-h-screen bg-gray-50">
      <Header />
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="mb-10 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Panel de despedidas</h1>
            <p className="text-sm text-gray-600">
              Gestiona eventos, destinos, mensajes y estadísticas de tus QR dinámicos.
            </p>
          </div>
          <button
            onClick={() => refetch()}
            className="inline-flex items-center rounded-lg border border-primary-200 bg-white px-4 py-2 text-sm font-semibold text-primary-700 shadow-sm hover:bg-primary-50"
          >
            <Loader2 className="mr-2 h-4 w-4 text-primary-500" />
            Actualizar
          </button>
        </div>

        {error ? (
          <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-700">
            {(error as Error).message}
          </div>
        ) : null}

        {!events || events.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-primary-200 bg-white p-12 text-center">
            <h2 className="text-lg font-semibold text-gray-900">Aún no tienes despedidas activas</h2>
            <p className="mt-2 text-sm text-gray-600">
              Compra un lote de camisetas o completa el pago pendiente para desbloquear el panel de control.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            {events.map((event) => {
              const eventDate = event.event_date ? new Date(event.event_date) : null
              const expiresAt = event.expires_at ? new Date(event.expires_at) : null
              return (
                <Link
                  key={event.id}
                  href={`/dashboard/despedida/${event.id}`}
                  className="group flex flex-col justify-between rounded-3xl border border-gray-200 bg-white p-6 shadow-sm transition-shadow hover:shadow-lg"
                >
                  <div>
                    <div className="mb-3 flex items-center justify-between">
                      <span className="rounded-full bg-primary-100 px-3 py-1 text-xs font-semibold text-primary-700">
                        {event.role === 'owner' ? 'Organizador' : event.role === 'editor' ? 'Editor' : 'Invitado'}
                      </span>
                      <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                        {event.status}
                      </span>
                    </div>
                    <h3 className="text-xl font-semibold text-gray-900">
                      {event.name || 'Despedida sin título'}
                    </h3>
                    {event.description ? (
                      <p className="mt-2 line-clamp-2 text-sm text-gray-600">{event.description}</p>
                    ) : null}
                  </div>

                  <div className="mt-6 grid grid-cols-2 gap-4 text-sm text-gray-600">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-primary-500" />
                      <div>
                        <p className="text-xs uppercase text-gray-500">Evento</p>
                        <p className="font-medium text-gray-900">
                          {eventDate ? eventDate.toLocaleString('es-ES', { dateStyle: 'medium', timeStyle: 'short' }) : 'Sin fecha'}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Activity className="h-4 w-4 text-green-500" />
                      <div>
                        <p className="text-xs uppercase text-gray-500">Escaneos</p>
                        <p className="font-medium text-gray-900">{event.scan_count}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <QrCode className="h-4 w-4 text-indigo-500" />
                      <div>
                        <p className="text-xs uppercase text-gray-500">QRs</p>
                        <p className="font-medium text-gray-900">{event.qr_count}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-amber-500" />
                      <div>
                        <p className="text-xs uppercase text-gray-500">Caducidad</p>
                        <p className="font-medium text-gray-900">
                          {expiresAt ? expiresAt.toLocaleDateString('es-ES') : 'Sin programar'}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="mt-6 flex items-center justify-between text-sm font-semibold text-primary-600">
                    <span>Ver panel completo</span>
                    <span className="transition-transform group-hover:translate-x-1">→</span>
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </div>
      <Footer />
    </main>
  )
}

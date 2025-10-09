'use client'

import React, { useMemo, useState } from 'react'
import { toast } from 'react-hot-toast'
import { Loader2, Plus, Calendar, ArrowUpRight, ChevronDown, ChevronRight } from 'lucide-react'
import clsx from 'clsx'
import type { EventSummary } from '@/types/despedida'
import { QRScheduler } from './QRScheduler'
import { QRDropZone } from './QRDropZone'

interface QRTableProps {
  eventId: string
  summary: EventSummary
  onDestinationCreated: (destination: any) => void
}

interface DestinationFormState {
  qrId: string
  type: string
  label: string
  targetUrl: string
  startAt: string
  endAt: string
  isActive: boolean
}

const defaultForm: DestinationFormState = {
  qrId: '',
  type: 'external',
  label: '',
  targetUrl: '',
  startAt: '',
  endAt: '',
  isActive: true,
}

const destinationLabels: Record<string, string> = {
  external: 'Enlace',
  album: 'Álbum',
  microsite: 'Microsite',
  prueba: 'Prueba',
  timeline: 'Timeline',
  message_wall: 'Mensajes',
  playlist: 'Playlist',
  map: 'Mapa',
  surprise: 'Sorpresa',
}

export function QRTable({ eventId, summary, onDestinationCreated }: QRTableProps) {
  const [isCreating, setIsCreating] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [form, setForm] = useState<DestinationFormState>(defaultForm)
  const [isLinking, setIsLinking] = useState(false)
  const [userQRs, setUserQRs] = useState<any[]>([])
  const [loadingUserQRs, setLoadingUserQRs] = useState(false)
  const [expandedQR, setExpandedQR] = useState<string | null>(null)
  const [localSummary, setLocalSummary] = useState(summary)

  React.useEffect(() => {
    setLocalSummary(summary)
  }, [summary])

  const refreshSummary = React.useCallback(async () => {
    try {
      const response = await fetch(`/api/events/${eventId}/summary`)
      if (!response.ok) throw new Error('Failed to refresh summary')
      const data = await response.json()
      setLocalSummary(data)
    } catch (error) {
      console.error('Error refreshing summary:', error)
    }
  }, [eventId])

  const qrsWithDestinations = useMemo(() => {
    if (!localSummary) return []

    const destinationByQR = new Map<string, any>()
    localSummary.destinations?.forEach((destination: any) => {
      if (!destinationByQR.has(destination.qr_id ?? '')) {
        destinationByQR.set(destination.qr_id ?? '', destination)
      }
    })

    return localSummary.qrs.map((qr) => ({
      ...qr,
      destination: destinationByQR.get(qr.id) ?? null,
    }))
  }, [localSummary])

  const handleOpenCreate = (qrId: string, label?: string) => {
    setForm({
      ...defaultForm,
      qrId,
      label: label ?? `QR ${qrId.slice(0, 6)}`,
    })
    setIsCreating(true)
  }

  // Load user's existing QRs
  React.useEffect(() => {
    const loadUserQRs = async () => {
      if (qrsWithDestinations.length > 0) return // Already has QRs linked
      
      setLoadingUserQRs(true)
      try {
        const response = await fetch('/api/qr/list')
        if (response.ok) {
          const data = await response.json()
          // Filter QRs that don't have an event_id yet
          const unlinkedQRs = (data.qrs || []).filter((qr: any) => !qr.event_id)
          setUserQRs(unlinkedQRs)
        }
      } catch (error) {
        console.error('Error loading user QRs:', error)
      } finally {
        setLoadingUserQRs(false)
      }
    }
    
    loadUserQRs()
  }, [qrsWithDestinations.length])

  const handleLinkExistingQRs = async () => {
    if (userQRs.length === 0) {
      toast.error('No hay QRs disponibles para vincular')
      return
    }

    setIsLinking(true)
    try {
      const qrCodes = userQRs.map(qr => qr.code)
      const response = await fetch(`/api/events/${eventId}/qrs`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          qrCodes: qrCodes,
          groupName: localSummary.event.name,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Error vinculando QRs')
      }

      const result = await response.json()
      toast.success(`${result.linked} QRs vinculados exitosamente`)
      setUserQRs([])
      setExpandedQR(null)
      void refreshSummary()
    } catch (error) {
      console.error(error)
      toast.error(error instanceof Error ? error.message : 'No se pudieron vincular los QRs')
    } finally {
      setIsLinking(false)
    }
  }

  const handleSubmit = async () => {
    if (!form.qrId) {
      toast.error('Selecciona un QR válido')
      return
    }
    if (!form.label.trim()) {
      toast.error('Añade un nombre para la experiencia')
      return
    }

    setSubmitting(true)
    try {
      const payload = {
        qrId: form.qrId,
        type: form.type,
        label: form.label,
        targetUrl: form.targetUrl || undefined,
        startAt: form.startAt || undefined,
        endAt: form.endAt || undefined,
        isActive: form.isActive,
      }
      
      console.log('[CREATE DESTINATION] Sending payload:', payload)
      
      const response = await fetch(`/api/events/${eventId}/destinations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        const errorData = await response.json()
        console.error('[CREATE DESTINATION] Error response:', errorData)
        throw new Error(errorData.error || 'Error creando destino')
      }

      const result = await response.json()
      console.log('[CREATE DESTINATION] Success:', result)
      toast.success('Destino creado')
      onDestinationCreated(result.destination)
      setIsCreating(false)
      setForm(defaultForm)
      void refreshSummary()
    } catch (error: any) {
      console.error('[CREATE DESTINATION] Caught error:', error)
      toast.error(error.message || 'No se pudo crear el destino')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <section className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">QRs y destinos</h2>
          <p className="text-sm text-gray-600">
            Cambia el destino activo en tiempo real o programa experiencias futuras.
          </p>
        </div>
      </div>

      {qrsWithDestinations.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-amber-200 bg-amber-50 p-8">
          <h3 className="text-lg font-semibold text-amber-900">No hay QRs vinculados a este evento</h3>
          <p className="mt-2 text-sm text-amber-700">
            Este evento necesita QRs para funcionar. Los QRs deben ser los mismos que se imprimirán en las camisetas.
          </p>
          
          {loadingUserQRs ? (
            <div className="mt-6 flex items-center justify-center gap-2 text-amber-700">
              <Loader2 className="h-5 w-5 animate-spin" />
              <span className="text-sm">Buscando tus QRs...</span>
            </div>
          ) : userQRs.length > 0 ? (
            <div className="mt-6">
              <div className="rounded-xl border border-amber-300 bg-white p-4">
                <p className="text-sm font-semibold text-amber-900">
                  ✅ Encontramos {userQRs.length} QR{userQRs.length > 1 ? 's' : ''} disponible{userQRs.length > 1 ? 's' : ''}:
                </p>
                <div className="mt-3 max-h-40 overflow-y-auto space-y-1">
                  {userQRs.map((qr) => (
                    <div key={qr.id} className="flex items-center gap-2 text-xs text-gray-600">
                      <span className="font-mono font-semibold">{qr.code}</span>
                      <span className="text-gray-400">—</span>
                      <span>{qr.title || 'Sin título'}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="mt-4 flex justify-center">
                <button
                  onClick={handleLinkExistingQRs}
                  disabled={isLinking}
                  className="inline-flex items-center gap-2 rounded-xl bg-green-600 px-6 py-3 text-sm font-semibold text-white hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {isLinking ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                  Vincular estos {userQRs.length} QRs al evento
                </button>
              </div>
              <p className="mt-3 text-center text-xs text-amber-600">
                ⚠️ Estos QRs deben coincidir con los que se imprimieron en las camisetas
              </p>
            </div>
          ) : (
            <div className="mt-6 rounded-xl border border-red-300 bg-red-50 p-4">
              <p className="text-sm font-semibold text-red-900">
                ⚠️ No se encontraron QRs disponibles en tu cuenta
              </p>
              <p className="mt-2 text-xs text-red-700">
                Debes crear QRs primero en el configurador antes de poder vincularlos a este evento.
                Los QRs que crees deben ser los mismos que se imprimirán en las camisetas.
              </p>
            </div>
          )}
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-gray-100">
        <table className="min-w-full divide-y divide-gray-100">
          <thead className="bg-gray-50 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
            <tr>
              <th className="px-4 py-3">QR</th>
              <th className="px-4 py-3">Destino</th>
              <th className="px-4 py-3">Escaneos</th>
              <th className="px-4 py-3">Última actividad</th>
              <th className="px-4 py-3 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 text-sm text-gray-700">
            {qrsWithDestinations.map((qr) => {
              const destination = qr.destination
              const destinationType = destination ? destination.type : null
              const lastActive = qr.last_active_at ? new Date(qr.last_active_at) : null
              const isExpanded = expandedQR === qr.id
              const qrDestinations = localSummary.destinations?.filter((d: any) => d.qr_id === qr.id) || []
              
              return (
                <React.Fragment key={qr.id}>
                <QRDropZone qrId={qr.id} qrCode={qr.code} eventId={eventId} className="contents">
                <tr className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setExpandedQR(isExpanded ? null : qr.id)}
                        className="text-gray-400 hover:text-gray-600"
                      >
                        {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                      </button>
                      <span className="font-mono text-xs text-gray-600">{qr.code}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    {destination ? (
                      <div>
                        <p className="font-medium text-gray-900">{destination.label ?? 'Sin título'}</p>
                        <p className="text-xs text-gray-500">
                          {destinationType ? destinationLabels[destinationType] ?? destinationType : 'Sin tipo'}
                        </p>
                        {destination.start_at || destination.end_at ? (
                          <p className="mt-1 flex items-center gap-1 text-xs text-gray-500">
                            <Calendar className="h-3 w-3" />
                            {destination.start_at ? new Date(destination.start_at).toLocaleDateString('es-ES') : 'Ahora'}
                            {' → '}
                            {destination.end_at ? new Date(destination.end_at).toLocaleDateString('es-ES') : 'Sin fin'}
                          </p>
                        ) : null}
                      </div>
                    ) : (
                      <span className="text-xs font-medium text-amber-600">Sin destino activo</span>
                    )}
                  </td>
                  <td className="px-4 py-3 font-semibold text-gray-900">{qr.scan_count}</td>
                  <td className="px-4 py-3 text-xs text-gray-500">
                    {lastActive ? lastActive.toLocaleString('es-ES') : 'Sin registros'}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <a
                        href={`/qr/${qr.code}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 rounded-lg border border-green-200 bg-green-50 px-3 py-1 text-xs font-semibold text-green-700 hover:bg-green-100"
                        title="Probar QR (abre en nueva pestaña)"
                      >
                        🧪 Probar
                      </a>
                      <button
                        onClick={() => handleOpenCreate(qr.id, destination?.label ?? undefined)}
                        className="inline-flex items-center gap-1 rounded-lg border border-primary-200 px-3 py-1 text-xs font-semibold text-primary-700 hover:bg-primary-50"
                      >
                        <Plus className="h-3 w-3" /> Nuevo destino
                      </button>
                    </div>
                  </td>
                </tr>
                
                {/* Fila expandida con el scheduler */}
                {isExpanded && (
                  <tr>
                    <td colSpan={5} className="bg-gray-50 p-6">
                      <QRScheduler
                        qrId={qr.id}
                        qrCode={qr.code}
                        destinations={qrDestinations as any}
                        eventTimezone={localSummary.event.event_timezone}
                        onUpdate={() => { void refreshSummary() }}
                      />
                    </td>
                  </tr>
                )}
                </QRDropZone>
                </React.Fragment>
              )
            })}
          </tbody>
        </table>
      </div>
      )}

      {qrsWithDestinations.length > 0 && isCreating ? (
        <div className="mt-6 rounded-3xl border border-primary-200 bg-primary-50 p-5">
          <h3 className="text-sm font-semibold text-primary-800">Programar nuevo destino</h3>
          <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
            <label className="text-xs font-semibold uppercase tracking-wide text-primary-700">
              Tipo de experiencia
              <select
                className="mt-1 w-full rounded-xl border border-primary-200 px-3 py-2 text-sm"
                value={form.type}
                onChange={(event) => setForm((prev) => ({ ...prev, type: event.target.value }))}
              >
                {Object.entries(destinationLabels).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </label>
            <label className="text-xs font-semibold uppercase tracking-wide text-primary-700">
              Nombre
              <input
                type="text"
                className="mt-1 w-full rounded-xl border border-primary-200 px-3 py-2 text-sm"
                value={form.label}
                onChange={(event) => setForm((prev) => ({ ...prev, label: event.target.value }))}
              />
            </label>
            <label className="text-xs font-semibold uppercase tracking-wide text-primary-700 md:col-span-2">
              URL objetivo
              <input
                type="text"
                className="mt-1 w-full rounded-xl border border-primary-200 px-3 py-2 text-sm font-mono"
                placeholder="www.ejemplo.com o /ruta (se añade https:// automáticamente)"
                value={form.targetUrl}
                onChange={(event) => setForm((prev) => ({ ...prev, targetUrl: event.target.value }))}
              />
              {form.targetUrl && !form.targetUrl.startsWith('http') && !form.targetUrl.startsWith('/') && (
                <p className="mt-1 text-xs text-gray-500">
                  → Se redirigirá a: <span className="font-mono text-primary-600">https://{form.targetUrl}</span>
                </p>
              )}
            </label>
            <label className="text-xs font-semibold uppercase tracking-wide text-primary-700">
              Inicio
              <input
                type="datetime-local"
                className="mt-1 w-full rounded-xl border border-primary-200 px-3 py-2 text-sm"
                value={form.startAt}
                onChange={(event) => setForm((prev) => ({ ...prev, startAt: event.target.value }))}
              />
            </label>
            <label className="text-xs font-semibold uppercase tracking-wide text-primary-700">
              Fin (opcional)
              <input
                type="datetime-local"
                className="mt-1 w-full rounded-xl border border-primary-200 px-3 py-2 text-sm"
                value={form.endAt}
                onChange={(event) => setForm((prev) => ({ ...prev, endAt: event.target.value }))}
              />
            </label>
            <label className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-primary-700">
              <input
                type="checkbox"
                checked={form.isActive}
                onChange={(event) => setForm((prev) => ({ ...prev, isActive: event.target.checked }))}
                className="h-4 w-4 rounded border border-primary-200"
              />
              Activar inmediatamente
            </label>
          </div>
          <div className="mt-4 flex justify-end gap-3">
            <button
              onClick={() => {
                setIsCreating(false)
                setForm(defaultForm)
              }}
              className="rounded-xl border border-transparent px-4 py-2 text-sm font-semibold text-primary-700 hover:bg-primary-100"
            >
              Cancelar
            </button>
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className={clsx(
                'inline-flex items-center rounded-xl bg-primary-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-50'
              )}
            >
              {submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ArrowUpRight className="mr-2 h-4 w-4" />}
              Guardar destino
            </button>
          </div>
        </div>
      ) : null}
    </section>
  )
}
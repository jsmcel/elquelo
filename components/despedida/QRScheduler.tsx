'use client'

import React, { useEffect, useMemo, useState } from 'react'
import { Calendar, Clock, Plus, Edit2, Trash2, CheckCircle, GitBranch } from 'lucide-react'
import { toast } from 'react-hot-toast'
import { DestinationTriggers } from './DestinationTriggers'
import { QRSchedulerCalendar } from './QRSchedulerCalendar'

interface Destination {
  id: string
  label: string
  type: string
  target_url: string | null
  is_active: boolean
  start_at: string | null
  end_at: string | null
  priority: number
}

interface QRSchedulerProps {
  qrId: string
  qrCode: string
  destinations: Destination[]
  allQRs?: Array<{ id: string; code: string }>
  allDestinations?: Array<{ id: string; label: string; qr_id: string }>
  eventId?: string
  eventTimezone?: string | null
  onUpdate: () => void
}

export function QRScheduler({ qrId, qrCode, destinations, allQRs = [], allDestinations = [], eventId, eventTimezone, onUpdate }: QRSchedulerProps) {
  const [view, setView] = useState<'calendar' | 'timeline' | 'list'>('calendar')
  const [expandedTriggers, setExpandedTriggers] = useState<Set<string>>(new Set())
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editForm, setEditForm] = useState<any>({})
  const [localDestinations, setLocalDestinations] = useState(destinations)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [savingEdit, setSavingEdit] = useState(false)

  useEffect(() => {
    setLocalDestinations(destinations)
  }, [destinations])

  // Ordenar destinos por fecha de inicio
  const sortedDestinations = useMemo(() => {
    return [...localDestinations].sort((a, b) => {
      if (!a.start_at) return 1
      if (!b.start_at) return -1
      return new Date(a.start_at).getTime() - new Date(b.start_at).getTime()
    })
  }, [localDestinations])

  const editingDestination = editingId ? localDestinations.find((dest) => dest.id === editingId) : null

  const now = new Date()

  const getDestinationStatus = (dest: Destination): 'active' | 'upcoming' | 'expired' | 'permanent' => {
    if (!dest.is_active) return 'expired'
    if (!dest.start_at && !dest.end_at) return 'permanent'
    
    const start = dest.start_at ? new Date(dest.start_at) : null
    const end = dest.end_at ? new Date(dest.end_at) : null
    
    if (start && now < start) return 'upcoming'
    if (end && now > end) return 'expired'
    return 'active'
  }

  const formatDateTime = (date: string | null) => {
    if (!date) return 'Sin límite'
    return new Date(date).toLocaleString('es-ES', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800 border-green-300'
      case 'upcoming': return 'bg-blue-100 text-blue-800 border-blue-300'
      case 'expired': return 'bg-gray-100 text-gray-600 border-gray-300'
      case 'permanent': return 'bg-purple-100 text-purple-800 border-purple-300'
      default: return 'bg-gray-100 text-gray-600 border-gray-300'
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'active': return '🟢 Activo ahora'
      case 'upcoming': return '🔵 Próximamente'
      case 'expired': return '⚫ Finalizado'
      case 'permanent': return '💜 Permanente'
      default: return 'Desconocido'
    }
  }

  const getCompactStatusLabel = (status: string) => {
    switch (status) {
      case 'active': return 'Activo'
      case 'upcoming': return 'Proximo'
      case 'expired': return 'Finalizado'
      case 'permanent': return 'Permanente'
      default: return ''
    }
  }

  const handleToggleActive = async (destId: string, currentState: boolean) => {
    try {
      const response = await fetch(`/api/destinations/${destId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: !currentState }),
      })

      if (!response.ok) throw new Error('Error actualizando destino')

      toast.success(currentState ? 'Destino desactivado' : 'Destino activado')
      setLocalDestinations((prev) =>
        prev.map((dest) =>
          dest.id === destId ? { ...dest, is_active: !currentState } : dest
        )
      )
      onUpdate()
    } catch (error) {
      console.error(error)
      toast.error('Error actualizando destino')
    }
  }

  const handleDeleteDestination = async (destination: Destination) => {
    if (!eventId) {
      toast.error('No se puede eliminar sin contexto del evento')
      return
    }

    setDeletingId(destination.id)

    try {
      const response = await fetch(`/api/events/${eventId}/destinations/${destination.id}`, {
        method: 'DELETE',
      })

      if (!response.ok) throw new Error('Error eliminando destino')

      toast.success('Destino eliminado')
      setLocalDestinations((prev) => prev.filter((dest) => dest.id !== destination.id))
      setEditingId((current) => (current === destination.id ? null : current))
      onUpdate()
    } catch (error) {
      console.error(error)
      toast.error('No se pudo eliminar el destino')
    } finally {
      setDeletingId(null)
    }
  }

  const handleEdit = (dest: Destination) => {
    setEditingId(dest.id)
    setEditForm({
      startAt: dest.start_at ? new Date(dest.start_at).toISOString().slice(0, 16) : '',
      endAt: dest.end_at ? new Date(dest.end_at).toISOString().slice(0, 16) : '',
      label: dest.label,
      targetUrl: dest.target_url || ''
    })
  }

  const handleSaveEdit = async () => {
    if (!editingId || !eventId) return

    const editingTarget = localDestinations.find((dest) => dest.id === editingId)

    let nextStart: string | null | undefined
    let nextEnd: string | null | undefined
    const payload: Record<string, unknown> = {}

    if (editForm.startAt) {
      nextStart = new Date(editForm.startAt).toISOString().slice(0, -1)
      payload.startAt = nextStart
    } else if (editingTarget?.start_at) {
      nextStart = null
      payload.startAt = null
    } else {
      nextStart = editingTarget?.start_at ?? null
    }

    if (editForm.endAt) {
      nextEnd = new Date(editForm.endAt).toISOString().slice(0, -1)
      payload.endAt = nextEnd
    } else if (editingTarget?.end_at) {
      nextEnd = null
      payload.endAt = null
    } else {
      nextEnd = editingTarget?.end_at ?? null
    }

    if (!Object.keys(payload).length) {
      setEditingId(null)
      toast.success('Sin cambios pendientes')
      return
    }

    setSavingEdit(true)

    try {
      const response = await fetch(`/api/events/${eventId}/destinations/${editingId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: Object.keys(payload).length ? JSON.stringify(payload) : undefined
      })

      if (!response.ok) {
        const error = await response.json()
        console.error('[EDIT DESTINATION] Error:', error)
        throw new Error('Error guardando cambios')
      }

      toast.success('Fechas guardadas')
      setLocalDestinations((prev) =>
        prev.map((dest) =>
          dest.id === editingId
            ? {
                ...dest,
                start_at: nextStart ?? null,
                end_at: nextEnd ?? null,
              }
            : dest
        )
      )
      setEditingId(null)
      onUpdate()
    } catch (error) {
      console.error(error)
      toast.error('Error guardando cambios')
    } finally {
      setSavingEdit(false)
    }
  }


  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <Calendar className="h-5 w-5 text-primary-600" />
            Agenda del QR: <span className="font-mono text-sm">{qrCode}</span>
          </h3>
          <p className="text-sm text-gray-600 mt-1">
            Programa cuándo debe redirigir a cada destino
          </p>
        </div>
        
        {/* Toggle View */}
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setView('calendar')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg ${
              view === 'calendar'
                ? 'bg-primary-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Agenda
          </button>
          <button
            onClick={() => setView('timeline')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg ${
              view === 'timeline'
                ? 'bg-primary-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Timeline
          </button>
          <button
            onClick={() => setView('list')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg ${
              view === 'list'
                ? 'bg-primary-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Lista
          </button>
        </div>
      </div>

      {/* Indicador de hora actual */}
      <div className="rounded-xl bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 p-3">
        <div className="flex items-center gap-2 text-sm">
          <Clock className="h-4 w-4 text-blue-600" />
          <span className="font-semibold text-blue-900">Ahora:</span>
          <span className="text-blue-700">
            {now.toLocaleString('es-ES', {
              weekday: 'long',
              day: 'numeric',
              month: 'long',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            })}
          </span>
        </div>
      </div>

      {view === 'calendar' && (
        <>
          <QRSchedulerCalendar
            destinations={sortedDestinations}
            onEdit={handleEdit}
            onToggleActive={(destination) => { void handleToggleActive(destination.id, destination.is_active) }}
            getStatusLabel={(destination) => getCompactStatusLabel(getDestinationStatus(destination))}
            getStatusColor={(destination) => getStatusColor(getDestinationStatus(destination))}
            selectedDestinationId={editingId}
            timezone={eventTimezone}
          />

          {editingDestination && (
            <div className="mt-4 rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
              <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
                <div>
                  <h4 className="text-sm font-semibold text-gray-900">Ajustar programación</h4>
                  <p className="text-xs text-gray-500">
                    {editingDestination.label || 'Sin nombre'} &bull; {editingDestination.target_url || 'Sin URL'}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setEditingId(null)}
                  className="self-start rounded-lg border border-gray-200 px-3 py-1 text-xs font-semibold text-gray-600 hover:bg-gray-100"
                >
                  Cerrar
                </button>
              </div>

              <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
                <div>
                  <label className="mb-1 block text-xs font-semibold text-gray-700">Fecha inicio</label>
                  <input
                    type="datetime-local"
                    value={editForm.startAt}
                    onChange={(e) => setEditForm({ ...editForm, startAt: e.target.value })}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold text-gray-700">Fecha fin (opcional)</label>
                  <input
                    type="datetime-local"
                    value={editForm.endAt}
                    onChange={(e) => setEditForm({ ...editForm, endAt: e.target.value })}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
              </div>

              {!eventId && (
                <p className="mt-3 text-xs text-amber-600">
                  Necesitas abrir este tablero completo para guardar los cambios del evento.
                </p>
              )}

              <div className="mt-4 flex flex-col gap-2 md:flex-row md:justify-end">
                <button
                  type="button"
                  onClick={() => editingDestination && handleDeleteDestination(editingDestination)}
                  className="rounded-lg border border-rose-200 px-4 py-2 text-sm font-semibold text-rose-600 hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-60"
                  disabled={!eventId || deletingId === editingDestination?.id}
                >
                  Eliminar
                </button>
                <button
                  type="button"
                  onClick={() => setEditingId(null)}
                  className="rounded-lg px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-100"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleSaveEdit}
                  className="rounded-lg bg-primary-600 px-4 py-2 text-sm font-semibold text-white hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-60"
                  disabled={!eventId || savingEdit}
                >
                  {savingEdit ? 'Guardando...' : 'Guardar'}
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Vista Timeline */}
      {view === 'timeline' && (
        <div className="relative">
          {/* Línea de tiempo vertical */}
          <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-gradient-to-b from-gray-200 via-primary-300 to-gray-200"></div>

          <div className="space-y-4">
            {sortedDestinations.map((dest, index) => {
              const status = getDestinationStatus(dest)
              const isActive = status === 'active'

              return (
                <div key={dest.id} className="relative pl-16">
                  {/* Nodo en la línea de tiempo */}
                  <div
                    className={`absolute left-3 top-3 h-6 w-6 rounded-full border-4 ${
                      isActive
                        ? 'bg-green-500 border-green-200 shadow-lg shadow-green-300 animate-pulse'
                        : 'bg-white border-gray-300'
                    }`}
                  >
                    {isActive && (
                      <div className="absolute inset-0 rounded-full bg-green-400 animate-ping opacity-75"></div>
                    )}
                  </div>

                  {/* Tarjeta del destino */}
                  <div
                    className={`rounded-xl border-2 p-4 transition-all ${
                      isActive
                        ? 'bg-green-50 border-green-300 shadow-md'
                        : 'bg-white border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h4 className="font-bold text-gray-900">{dest.label}</h4>
                          <span
                            className={`px-2 py-0.5 text-xs font-semibold rounded-full border ${getStatusColor(
                              status
                            )}`}
                          >
                            {getStatusLabel(status)}
                          </span>
                        </div>

                        <p className="text-sm text-gray-600 mb-3 font-mono">
                          → {dest.target_url || '(sin URL)'}
                        </p>

                        <div className="grid grid-cols-2 gap-3 text-xs">
                          <div>
                            <span className="font-semibold text-gray-700">📅 Inicio:</span>
                            <p className="text-gray-600 mt-0.5">{formatDateTime(dest.start_at)}</p>
                          </div>
                          <div>
                            <span className="font-semibold text-gray-700">🏁 Fin:</span>
                            <p className="text-gray-600 mt-0.5">{formatDateTime(dest.end_at)}</p>
                          </div>
                        </div>
                      </div>

                      {/* Acciones */}
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleEdit(dest)}
                          className="p-2 rounded-lg text-xs font-semibold bg-blue-100 text-blue-700 hover:bg-blue-200 transition-colors"
                          title="Editar fechas"
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleToggleActive(dest.id, dest.is_active)}
                          className={`p-2 rounded-lg text-xs font-semibold transition-colors ${
                            dest.is_active
                              ? 'bg-red-100 text-red-700 hover:bg-red-200'
                              : 'bg-green-100 text-green-700 hover:bg-green-200'
                          }`}
                          title={dest.is_active ? 'Desactivar' : 'Activar'}
                          disabled={deletingId === dest.id}
                        >
                          {dest.is_active ? 'Desactivar' : 'Activar'}
                        </button>
                        <button
                          onClick={() => handleDeleteDestination(dest)}
                          className="p-2 rounded-lg text-xs font-semibold bg-rose-100 text-rose-700 hover:bg-rose-200 transition-colors disabled:opacity-60"
                          title="Eliminar destino"
                          disabled={deletingId === dest.id}
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>

                    {/* Formulario de edición inline */}
                    {editingId === dest.id && (
                      <div className="mt-4 pt-4 border-t border-gray-200 space-y-3">
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block text-xs font-semibold text-gray-700 mb-1">
                              📅 Fecha inicio
                            </label>
                            <input
                              type="datetime-local"
                              value={editForm.startAt}
                              onChange={(e) => setEditForm({...editForm, startAt: e.target.value})}
                              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-semibold text-gray-700 mb-1">
                              🏁 Fecha fin (opcional)
                            </label>
                            <input
                              type="datetime-local"
                              value={editForm.endAt}
                              onChange={(e) => setEditForm({...editForm, endAt: e.target.value})}
                              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                            />
                          </div>
                        </div>
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => setEditingId(null)}
                            className="px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-100 rounded-lg"
                          >
                            Cancelar
                          </button>
                          <button
                            onClick={handleSaveEdit}
                            className="px-4 py-2 text-sm font-semibold bg-primary-600 text-white rounded-lg hover:bg-primary-700"
                          >
                            💾 Guardar
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Barra de progreso si está activo */}
                    {isActive && dest.start_at && dest.end_at && (
                      <div className="mt-3">
                        <div className="flex items-center justify-between text-xs text-gray-600 mb-1">
                          <span>Progreso del período</span>
                          <span>
                            {Math.round(
                              ((now.getTime() - new Date(dest.start_at).getTime()) /
                                (new Date(dest.end_at).getTime() -
                                  new Date(dest.start_at).getTime())) *
                                100
                            )}
                            %
                          </span>
                        </div>
                        <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-green-400 to-green-600 transition-all"
                            style={{
                              width: `${Math.min(
                                100,
                                Math.max(
                                  0,
                                  ((now.getTime() - new Date(dest.start_at).getTime()) /
                                    (new Date(dest.end_at).getTime() -
                                      new Date(dest.start_at).getTime())) *
                                    100
                                )
                              )}%`,
                            }}
                          ></div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>

          {localDestinations.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              <Calendar className="h-12 w-12 mx-auto mb-3 text-gray-300" />
              <p className="font-semibold">No hay destinos programados</p>
              <p className="text-sm mt-1">Añade tu primer destino para empezar</p>
            </div>
          )}
        </div>
      )}

      {/* Vista Lista */}
      {view === 'list' && (
        <div className="rounded-xl border border-gray-200 overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">
                  Estado
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">
                  Destino
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">
                  Inicio
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">
                  Fin
                </th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-700 uppercase">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {sortedDestinations.map((dest) => {
                const status = getDestinationStatus(dest)
                return (
                  <tr key={dest.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <span
                        className={`px-2 py-1 text-xs font-semibold rounded-full border ${getStatusColor(
                          status
                        )}`}
                      >
                        {getStatusLabel(status)}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-semibold text-gray-900 text-sm">{dest.label}</p>
                      <p className="text-xs text-gray-500 font-mono truncate max-w-xs">
                        {dest.target_url}
                      </p>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {formatDateTime(dest.start_at)}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {formatDateTime(dest.end_at)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleToggleActive(dest.id, dest.is_active)}
                          className={`px-3 py-1 rounded-lg text-xs font-semibold ${
                            dest.is_active
                              ? 'bg-red-100 text-red-700 hover:bg-red-200'
                              : 'bg-green-100 text-green-700 hover:bg-green-200'
                          }`}
                          disabled={deletingId === dest.id}
                        >
                          {dest.is_active ? 'Desactivar' : 'Activar'}
                        </button>
                        <button
                          onClick={() => handleDeleteDestination(dest)}
                          className="px-3 py-1 rounded-lg text-xs font-semibold bg-rose-100 text-rose-700 hover:bg-rose-200 disabled:opacity-60"
                          disabled={deletingId === dest.id}
                        >
                          Eliminar
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}





    </div>
  )
}

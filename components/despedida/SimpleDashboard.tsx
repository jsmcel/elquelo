'use client'

import { useEffect, useMemo, useState, type MouseEvent } from 'react'
import NextImage from 'next/image'
import { 
  QrCode, 
  Calendar, 
  Sparkles, 
  Trophy, 
  MessageSquare, 
  Image,
  Globe,
  ExternalLink,
  Plus,
  ChevronRight,
  Play,
  Eye,
  TrendingUp
} from 'lucide-react'
import { QRScheduler } from './QRScheduler'
import { toast } from 'react-hot-toast'

interface SimpleDashboardProps {
  eventId: string
  event: any
  onRefresh: (options?: { background?: boolean }) => Promise<void> | void
  onOpenQuickStart: () => void
}

export function SimpleDashboard({ eventId, event, onRefresh, onOpenQuickStart }: SimpleDashboardProps) {
  const [view, setView] = useState<'overview' | 'qrs' | 'content'>('overview')

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      {/* HEADER SIMPLE */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-2">
          {event.event.name}
        </h1>
        <div className="flex flex-wrap items-center gap-4 md:gap-6 text-sm text-gray-600">
          <span className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            {new Date(event.event.event_date).toLocaleDateString('es-ES', {
              day: 'numeric',
              month: 'long',
              year: 'numeric'
            })}
          </span>
          <span className="flex items-center gap-2">
            <QrCode className="h-4 w-4" />
            {event.qrs.length} QRs
          </span>
          <span className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            {event.stats?.totalScans || 0} escaneos
          </span>
          <span className="px-3 py-1 rounded-full bg-green-100 text-green-700 font-semibold">
            ● Activo
          </span>
        </div>
        
        {/* Banner Colaborativo */}
        <div className="mt-4 rounded-xl bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 p-4">
          <p className="text-sm text-gray-700">
            🤝 <strong>Panel Colaborativo:</strong> Todos los del grupo podéis editar y programar los QRs. 
            <span className="ml-2 text-blue-700">💡 Consejo: Excluir al homenajeado para mantener la sorpresa</span>
          </p>
        </div>
      </div>

      {/* NAVEGACIÓN TABS GRANDE */}
      <div className="mb-8 flex flex-wrap gap-4">
        <TabButton
          active={view === 'overview'}
          onClick={() => setView('overview')}
          icon={<Sparkles className="h-5 w-5" />}
          label="Vista General"
        />
        <TabButton
          active={view === 'qrs'}
          onClick={() => setView('qrs')}
          icon={<QrCode className="h-5 w-5" />}
          label="Mis QRs"
          badge={event.qrs.length}
        />
        <TabButton
          active={view === 'content'}
          onClick={() => setView('content')}
          icon={<Trophy className="h-5 w-5" />}
          label="Contenido"
        />
      </div>

      {/* CONTENIDO SEGÚN VIEW */}
      {view === 'overview' && <OverviewPanel eventId={eventId} event={event} onOpenQuickStart={onOpenQuickStart} />}
      {view === 'qrs' && <QRsPanel eventId={eventId} event={event} onRefresh={onRefresh} />}
      {view === 'content' && <ContentPanel eventId={eventId} event={event} />}
    </div>
  )
}

// ============ TAB BUTTON ============
function TabButton({ active, onClick, icon, label, badge }: any) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-3 px-4 md:px-6 py-3 md:py-4 rounded-2xl font-semibold transition-all ${
        active
          ? 'bg-gradient-to-r from-primary-600 to-purple-600 text-white shadow-lg scale-105'
          : 'bg-white text-gray-700 hover:bg-gray-50 border-2 border-gray-200'
      }`}
    >
      {icon}
      <span className="text-sm md:text-base">{label}</span>
      {badge !== undefined && (
        <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
          active ? 'bg-white/20' : 'bg-gray-200'
        }`}>
          {badge}
        </span>
      )}
    </button>
  )
}

// ============ OVERVIEW PANEL ============
function OverviewPanel({ eventId, event, onOpenQuickStart }: any) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {/* CARD: Quick Start */}
      <ActionCard
        icon={<Sparkles className="h-8 w-8" />}
        title="Setup Rápido"
        description="Configurad el evento entre todos"
        color="purple"
        action="Empezar"
        href={`/dashboard/despedida/${eventId}?quickstart=true`}
        onClick={(event: MouseEvent<HTMLAnchorElement>) => {
          event.preventDefault()
          onOpenQuickStart()
        }}
      />

      {/* CARD: Crear Reto */}
      <ActionCard
        icon={<Trophy className="h-8 w-8" />}
        title="Retos"
        description={`${event.pruebas?.length || 0} retos activos`}
        color="orange"
        action="Gestionar"
        href={`/dashboard/despedida/${eventId}/retos`}
      />

      {/* CARD: Microsite */}
      <ActionCard
        icon={<Globe className="h-8 w-8" />}
        title="Microsite"
        description="Página del grupo"
        color="green"
        action="Editar"
        href={`/dashboard/despedida/${eventId}/microsite`}
      />

      {/* CARD: Álbum */}
      <ActionCard
        icon={<Image className="h-8 w-8" />}
        title="Álbum de Fotos"
        description={`${event.album?.length || 0} fotos`}
        color="purple"
        action="Gestionar"
        href={`/dashboard/despedida/${eventId}/album`}
      />

      {/* CARD: Mensajes */}
      <ActionCard
        icon={<MessageSquare className="h-8 w-8" />}
        title="Muro de Mensajes"
        description={`${event.messages?.length || 0} mensajes`}
        color="blue"
        action="Ver"
        href={`/dashboard/despedida/${eventId}/mensajes`}
      />

      {/* CARD: Vista Previa */}
      <ActionCard
        icon={<Eye className="h-8 w-8" />}
        title="Ver Resultado"
        description="Prueba la experiencia final"
        color="gray"
        action="Abrir"
        href={`/e/${eventId}/microsite`}
        external
      />
    </div>
  )
}

// ============ QRS PANEL ============
function QRsPanel({ eventId, event, onRefresh }: any) {
  const [selectedQR, setSelectedQR] = useState<string | null>(null)

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">QRs del Grupo</h2>
          <p className="text-sm text-gray-600 mt-1">
            Programad los QRs entre todos para sorprender al homenajeado
          </p>
        </div>
      </div>

      {event.qrs.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-2xl border-2 border-dashed border-gray-300">
          <QrCode className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-gray-900 mb-2">
            No hay QRs vinculados
          </h3>
          <p className="text-gray-600 mb-6">
            Los QRs se vinculan automáticamente al comprar un kit
          </p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {event.qrs.map((qr: any) => (
              <QRCard
                key={qr.id}
                qr={qr}
                eventId={eventId}
                isSelected={selectedQR === qr.id}
                onClick={() => setSelectedQR(qr.id === selectedQR ? null : qr.id)}
              />
            ))}
          </div>

          {selectedQR && (
            <div className="mt-8">
              <QRSchedulerWrapper
                qrId={selectedQR}
                eventId={eventId}
                event={event}
                onUpdate={() => onRefresh({ background: true })}
              />
            </div>
          )}
        </>
      )}
    </div>
  )
}

// ============ QR CARD ============
function QRCard({ qr, eventId, isSelected, onClick }: any) {
  const activeDestination = qr.destinations?.find((d: any) => d.id === qr.active_destination_id)
  const destination = activeDestination?.target_url || activeDestination?.label || 'Sin destino'

  return (
    <button
      onClick={onClick}
      className={`p-6 rounded-2xl border-2 transition-all text-left w-full ${
        isSelected
          ? 'border-primary-600 bg-primary-50 shadow-lg'
          : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-md'
      }`}
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-primary-100 flex items-center justify-center">
            <QrCode className="h-6 w-6 text-primary-600" />
          </div>
          <div>
            <div className="font-mono text-sm font-bold text-gray-900">
              {qr.code}
            </div>
            <div className="text-xs text-gray-500">
              {qr.scan_count || 0} escaneos
            </div>
          </div>
        </div>
      </div>

      <div className="mb-3">
        <div className="text-xs text-gray-500 mb-1">Actualmente redirige a:</div>
        <div className="text-sm font-semibold text-gray-900 truncate">
          {destination}
        </div>
        {qr.destinations && qr.destinations.some((dest: any) => dest.start_at && dest.end_at) && (
          <div className="text-xs text-primary-600 mt-1">
            {qr.destinations.filter((dest: any) => dest.start_at && dest.end_at).length} destino(s) programado(s)
          </div>
        )}
      </div>

      <div className="flex items-center justify-between">
        <a
          href={`/qr/${qr.code}`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-xs font-semibold text-primary-600 hover:text-primary-700"
          onClick={(e) => e.stopPropagation()}
        >
          <Play className="h-3 w-3" />
          Probar
        </a>
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500">
            {isSelected ? 'Ocultar' : 'Programar'}
          </span>
          <ChevronRight className={`h-4 w-4 transition-transform ${isSelected ? 'rotate-90' : ''}`} />
        </div>
      </div>
    </button>
  )
}

// ============ QR SCHEDULER WRAPPER ============
function QRSchedulerWrapper({ qrId, eventId, event, onUpdate }: any) {
  const [showContentPicker, setShowContentPicker] = useState(false)
  const [pendingDestination, setPendingDestination] = useState<any | null>(null)
  const [scheduleForm, setScheduleForm] = useState({ startAt: '', endAt: '' })
  const [scheduleSubmitting, setScheduleSubmitting] = useState(false)
  const [scheduleError, setScheduleError] = useState<string | null>(null)
  const [scheduleWarning, setScheduleWarning] = useState<string | null>(null)
  const qr = event.qrs.find((q: any) => q.id === qrId)

  const allQRs = event.qrs.map((q: any) => ({ id: q.id, code: q.code }))
  const allDestinations = event.destinations || []
  const existingDestinations = useMemo(() => (qr?.destinations || []), [qr?.destinations])
  const activeDestinations = useMemo(() => existingDestinations.filter((dest: any) => dest?.is_active !== false), [existingDestinations])
  const scheduledDestinations = useMemo(() => activeDestinations.filter((dest: any) => dest?.start_at && dest?.end_at), [activeDestinations])

  const toLocalInputValue = (date: Date) => {
    const tzOffset = date.getTimezoneOffset() * 60000
    return new Date(date.getTime() - tzOffset).toISOString().slice(0, 16)
  }

  const getNextSlot = () => {
    const now = new Date()
    const endTimes = scheduledDestinations
      .map((dest: any) => (dest.end_at ? new Date(dest.end_at).getTime() : null))
      .filter((value: number | null): value is number => value !== null && !Number.isNaN(value))

    let startTime = now.getTime()
    if (endTimes.length > 0) {
      const latestEnd = Math.max(...endTimes)
      startTime = Math.max(startTime, latestEnd + 60_000)
    }

    let suggestedEnd = startTime + 60 * 60 * 1000

    const upcomingStarts = scheduledDestinations
      .map((dest: any) => (dest.start_at ? new Date(dest.start_at).getTime() : null))
      .filter((value: number | null): value is number => value !== null && !Number.isNaN(value) && value > startTime)

    if (upcomingStarts.length > 0) {
      const nextStart = Math.min(...upcomingStarts)
      if (nextStart - 60_000 > startTime) {
        suggestedEnd = Math.min(suggestedEnd, nextStart - 60_000)
      }
    }

    return { start: new Date(startTime), end: new Date(suggestedEnd) }
  }

  const toOffsetIsoString = (value: string) => {
    if (!value) return null
    const date = new Date(value)
    if (Number.isNaN(date.getTime())) return null
    const offsetMinutes = -date.getTimezoneOffset()
    const sign = offsetMinutes >= 0 ? '+' : '-'
    const absMinutes = Math.abs(offsetMinutes)
    const hours = String(Math.floor(absMinutes / 60)).padStart(2, '0')
    const minutes = String(absMinutes % 60).padStart(2, '0')
    const base = value.length === 16 ? `${value}:00` : value
    return `${base}${sign}${hours}:${minutes}`
  }

  const resetScheduleForm = () => {
    const slot = getNextSlot()
    setScheduleForm({ startAt: toLocalInputValue(slot.start), endAt: toLocalInputValue(slot.end) })
  }

  const handleAddContent = (contentType: string, contentId?: string, url?: string) => {
    const destinationData: any = {
      qrId: qr.id,
      type: contentType,
      label: '',
      targetUrl: '',
      isActive: true
    }

    if (contentType === 'microsite') {
      destinationData.label = 'Microsite del Evento'
      destinationData.targetUrl = `/e/${eventId}/microsite`
    } else if (contentType === 'album') {
      destinationData.label = 'Álbum de Fotos'
      destinationData.targetUrl = `/e/${eventId}/album`
    } else if (contentType === 'prueba' && contentId) {
      const prueba = event.pruebas.find((p: any) => p.id === contentId)
      destinationData.label = prueba?.title || 'Reto'
      destinationData.targetUrl = `/e/${eventId}/reto/${contentId}`
    } else if (contentType === 'external' && url) {
      destinationData.label = 'Enlace externo'
      destinationData.targetUrl = url
    } else if (contentType === 'message_wall') {
      destinationData.label = 'Muro de Mensajes'
      destinationData.targetUrl = `/e/${eventId}/mensajes`
    }

    resetScheduleForm()
    setScheduleError(null)
    setPendingDestination(destinationData)
    setShowContentPicker(false)
  }

  const intervalsOverlap = (startA: number, endA: number, startB: number, endB: number) => {
    return startA < endB && startB < endA
  }

  const handleSubmitScheduledContent = async () => {
    if (!pendingDestination) return
    if (scheduleError) {
      toast.error(scheduleError)
      return
    }
    if (!scheduleForm.startAt || !pendingDestination) return

    const start = new Date(scheduleForm.startAt)
    const end = scheduleForm.endAt ? new Date(scheduleForm.endAt) : null

    setScheduleSubmitting(true)

    try {
      const payload = {
        ...pendingDestination,
        startAt: toOffsetIsoString(scheduleForm.startAt) || undefined,
        endAt: scheduleForm.endAt ? toOffsetIsoString(scheduleForm.endAt) : null
      }

      const response = await fetch(`/api/events/${eventId}/destinations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      if (!response.ok) {
        const errorData = await response.json()
        console.error('[ADD CONTENT] Error:', errorData)
        throw new Error('Error creando destino')
      }

      toast.success('Contenido programado')
      setPendingDestination(null)
      await Promise.resolve(onUpdate?.({ background: true }))
    } catch (error) {
      console.error(error)
      toast.error('Error añadiendo contenido')
    } finally {
      setScheduleSubmitting(false)
    }
  }

  useEffect(() => {
    if (!pendingDestination) {
      setScheduleError(null)
      setScheduleWarning(null)
      return
    }

    if (!scheduleForm.startAt) {
      setScheduleError('Indica cuándo empieza este contenido')
      setScheduleWarning(null)
      return
    }

    const start = new Date(scheduleForm.startAt)
    if (Number.isNaN(start.getTime())) {
      setScheduleError('Fecha de inicio no válida')
      setScheduleWarning(null)
      return
    }

    if (scheduleForm.endAt) {
      const end = new Date(scheduleForm.endAt)
      if (Number.isNaN(end.getTime())) {
        setScheduleError('Fecha de fin no válida')
        setScheduleWarning(null)
        return
      }
      if (end <= start) {
        setScheduleError('La hora de fin debe ser posterior a la de inicio')
        setScheduleWarning(null)
        return
      }
    }

    const newStart = start.getTime()
    const newEnd = scheduleForm.endAt ? new Date(scheduleForm.endAt).getTime() : Number.POSITIVE_INFINITY

    if (scheduledDestinations.length === 0) {
      setScheduleError(null)
      setScheduleWarning(null)
      return
    }

    const overlaps = scheduledDestinations.some((dest: any) => {
      const startExisting = dest.start_at ? new Date(dest.start_at).getTime() : Number.NEGATIVE_INFINITY
      const endExisting = dest.end_at ? new Date(dest.end_at).getTime() : Number.POSITIVE_INFINITY
      return intervalsOverlap(newStart, newEnd, startExisting, endExisting)
    })

    if (overlaps) {
      setScheduleError('Este QR ya tiene contenido programado en ese intervalo')
      setScheduleWarning(null)
      return
    }

    if (activeDestinations.some((dest: any) => !dest.start_at && !dest.end_at)) {
      setScheduleWarning('Este QR tiene contenido permanente activo. El nuevo contenido tomará el control en las fechas seleccionadas.')
    } else {
      setScheduleWarning(null)
    }

    setScheduleError(null)
  }, [pendingDestination, scheduleForm, scheduledDestinations, activeDestinations])

  const handleCancelSchedule = () => {
    setPendingDestination(null)
    setScheduleError(null)
    setScheduleWarning(null)
  }

  if (!qr) return null

  return (
    <div className="rounded-2xl border-2 border-primary-200 bg-white p-6 shadow-xl">
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h3 className="text-2xl font-bold text-gray-900 mb-2">
            📅 Programar QR: <span className="font-mono text-primary-600">{qr.code}</span>
          </h3>
          <p className="text-sm text-gray-600">
            Añade contenido y programa cuándo debe activarse
          </p>
        </div>
        <button
          onClick={() => setShowContentPicker(!showContentPicker)}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-primary-600 to-purple-600 text-white font-semibold hover:shadow-lg transition-all"
        >
          <Plus className="h-4 w-4" />
          Añadir Contenido
        </button>
      </div>

      {/* Content Picker */}
      {showContentPicker && (
        <div className="mb-6 rounded-xl bg-gradient-to-br from-blue-50 to-purple-50 border-2 border-purple-200 p-6">
          <h4 className="font-bold text-gray-900 mb-4">¿Qué quieres añadir?</h4>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Microsite */}
            <button
              onClick={() => handleAddContent('microsite')}
              className="text-left p-4 rounded-xl bg-white border-2 border-gray-200 hover:border-green-400 hover:shadow-md transition-all"
            >
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                  <Globe className="h-5 w-5 text-green-600" />
                </div>
                <span className="font-bold text-gray-900">Microsite</span>
              </div>
              <p className="text-sm text-gray-600">Página del evento</p>
            </button>

            {/* Álbum */}
            <button
              onClick={() => handleAddContent('album')}
              className="text-left p-4 rounded-xl bg-white border-2 border-gray-200 hover:border-purple-400 hover:shadow-md transition-all"
            >
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center">
                  <Image className="h-5 w-5 text-purple-600" />
                </div>
                <span className="font-bold text-gray-900">Álbum</span>
              </div>
              <p className="text-sm text-gray-600">Fotos del grupo</p>
            </button>

            {/* Mensajes */}
            <button
              onClick={() => handleAddContent('message_wall')}
              className="text-left p-4 rounded-xl bg-white border-2 border-gray-200 hover:border-blue-400 hover:shadow-md transition-all"
            >
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                  <MessageSquare className="h-5 w-5 text-blue-600" />
                </div>
                <span className="font-bold text-gray-900">Mensajes</span>
              </div>
              <p className="text-sm text-gray-600">Muro de mensajes</p>
            </button>

            {/* Retos */}
            {event.pruebas && event.pruebas.length > 0 && event.pruebas.map((prueba: any) => (
              <button
                key={prueba.id}
                onClick={() => handleAddContent('prueba', prueba.id)}
                className="text-left p-4 rounded-xl bg-white border-2 border-gray-200 hover:border-orange-400 hover:shadow-md transition-all"
              >
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center">
                    <Trophy className="h-5 w-5 text-orange-600" />
                  </div>
                  <span className="font-bold text-gray-900">{prueba.title}</span>
                </div>
                <p className="text-sm text-gray-600">{prueba.points} puntos</p>
              </button>
            ))}
          </div>
        </div>
      )}
      
      <QRScheduler
        qrId={qr.id}
        qrCode={qr.code}
        destinations={qr.destinations || []}
        allQRs={allQRs}
        allDestinations={allDestinations}
        eventId={eventId}
        eventTimezone={event.event.event_timezone}
        onUpdate={() => onUpdate?.({ background: true })}
      />

      {pendingDestination && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/70 px-4 py-8">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
            <h3 className="text-lg font-bold text-gray-900">Programar contenido</h3>
            <p className="mt-1 text-sm text-gray-600">
              {pendingDestination.label || 'Nueva experiencia'}
            </p>

            <div className="mt-4 space-y-3">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Fecha y hora de inicio</label>
                <input
                  type="datetime-local"
                  value={scheduleForm.startAt}
                  onChange={(e) => setScheduleForm((prev) => ({ ...prev, startAt: e.target.value }))}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Fecha y hora de fin</label>
                <input
                  type="datetime-local"
                  value={scheduleForm.endAt}
                  onChange={(e) => setScheduleForm((prev) => ({ ...prev, endAt: e.target.value }))}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
                <p className="mt-1 text-xs text-gray-500">Deja vacío para mantenerlo activo hasta que programes otro contenido.</p>
              </div>
            </div>

            <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={handleCancelSchedule}
                className="rounded-lg px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-100"
              >
                Cancelar
              </button>
              {scheduleError && (
                <p className="text-xs text-rose-600 text-right">{scheduleError}</p>
              )}
              {!scheduleError && scheduleWarning && (
                <p className="text-xs text-amber-600 text-right">{scheduleWarning}</p>
              )}
              <button
                type="button"
                onClick={handleSubmitScheduledContent}
                className="rounded-lg bg-primary-600 px-4 py-2 text-sm font-semibold text-white hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-60"
                disabled={scheduleSubmitting || !!scheduleError}
              >
                {scheduleSubmitting ? 'Guardando...' : 'Guardar programación'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ============ CONTENT PANEL ============
function ContentPanel({ eventId, event }: any) {
  return (
    <div className="space-y-8">
      {/* Retos */}
      <ContentSection
        title="🏆 Retos"
        items={event.pruebas || []}
        renderItem={(reto: any) => (
          <div key={reto.id} className="p-4 rounded-xl bg-orange-50 border border-orange-200 hover:shadow-md transition-shadow">
            <div className="font-semibold text-orange-900">{reto.title}</div>
            <div className="text-sm text-orange-700 mt-1">{reto.points} puntos</div>
            {reto.description && (
              <p className="text-xs text-orange-600 mt-2 line-clamp-2">{reto.description}</p>
            )}
          </div>
        )}
        createButton="+ Nuevo Reto"
        onCreate={() => window.location.href = `/dashboard/despedida/${eventId}/retos`}
      />

      {/* Mensajes */}
      <ContentSection
        title="💬 Mensajes"
        items={event.messages || []}
        renderItem={(msg: any) => (
          <div key={msg.id} className="p-4 rounded-xl bg-blue-50 border border-blue-200 hover:shadow-md transition-shadow">
            <div className="font-semibold text-blue-900">{msg.sender_name || 'Anónimo'}</div>
            <div className="text-sm text-blue-700 mt-1 line-clamp-2">{msg.content || '(Sin contenido)'}</div>
            <div className="text-xs text-blue-600 mt-2">
              {msg.is_approved ? '✓ Aprobado' : '⏳ Pendiente'}
            </div>
          </div>
        )}
        createButton="+ Ver Todos"
        onCreate={() => window.location.href = `/dashboard/despedida/${eventId}/mensajes`}
      />

      {/* Álbum */}
      <ContentSection
        title="📸 Álbum"
        items={event.album || []}
        renderItem={(photo: any) => (
          <div key={photo.id} className="relative aspect-square rounded-xl overflow-hidden bg-purple-50 border border-purple-200 hover:shadow-md transition-shadow">
            {photo.url ? (
              <NextImage src={photo.url} alt={photo.caption || 'Foto del álbum'} className="w-full h-full object-cover" width={400} height={400} />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <Image className="h-12 w-12 text-purple-300" />
              </div>
            )}
          </div>
        )}
        createButton="+ Gestionar Álbum"
        onCreate={() => window.location.href = `/dashboard/despedida/${eventId}/album`}
      />
    </div>
  )
}

// ============ HELPERS ============
function ActionCard({ icon, title, description, color, action, href, onClick, external }: any) {
  const colors: Record<string, string> = {
    purple: 'from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700',
    orange: 'from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700',
    green: 'from-green-500 to-green-600 hover:from-green-600 hover:to-green-700',
    blue: 'from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700',
    gray: 'from-gray-500 to-gray-600 hover:from-gray-600 hover:to-gray-700',
  }

  const content = (
    <div className={`p-6 rounded-2xl bg-gradient-to-br ${colors[color]} text-white cursor-pointer transition-all hover:shadow-xl hover:scale-105`}>
      <div className="mb-4">{icon}</div>
      <h3 className="text-xl font-bold mb-2">{title}</h3>
      <p className="text-sm opacity-90 mb-4">{description}</p>
      <div className="flex items-center justify-between">
        <span className="font-semibold">{action}</span>
        {external ? <ExternalLink className="h-4 w-4" /> : <ChevronRight className="h-5 w-5" />}
      </div>
    </div>
  )

  if (href) {
    const handleAnchorClick = (event: MouseEvent<HTMLAnchorElement>) => {
      if (onClick) {
        onClick(event)
      }
      if (event.defaultPrevented) return
      if (!external && href) {
        window.location.href = href
      }
    }

    return (
      <a
        href={href}
        onClick={onClick ? handleAnchorClick : undefined}
        target={external ? '_blank' : undefined}
        rel={external ? 'noopener noreferrer' : undefined}
      >
        {content}
      </a>
    )
  }

  return (
    <button type="button" onClick={onClick} className="w-full text-left">
      {content}
    </button>
  )
}


function ContentSection({ title, items, renderItem, createButton, onCreate }: any) {
  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-bold text-gray-900">{title}</h3>
        <button
          onClick={onCreate}
          className="px-4 py-2 rounded-xl bg-gray-900 text-white font-semibold hover:bg-gray-800 transition-colors"
        >
          {createButton}
        </button>
      </div>
      {items.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-300">
          <p className="text-gray-600 mb-4">No hay elementos todavía</p>
          <button
            onClick={onCreate}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-primary-600 text-white font-semibold hover:bg-primary-700"
          >
            <Plus className="h-4 w-4" />
            Crear Primero
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {items.map(renderItem)}
        </div>
      )}
    </div>
  )
}


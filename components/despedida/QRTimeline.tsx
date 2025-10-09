'use client'

import React, { useState } from 'react'
import { QRDropZone } from './QRDropZone'
import { Calendar, ChevronDown, ChevronRight, Eye } from 'lucide-react'
import type { EventSummary } from '@/types/despedida'

interface QRTimelineProps {
  eventId: string
  summary: EventSummary
}

export function QRTimeline({ eventId, summary }: QRTimelineProps) {
  const [expandedQRs, setExpandedQRs] = useState<Set<string>>(new Set())

  const toggleExpand = (qrId: string) => {
    const newExpanded = new Set(expandedQRs)
    if (newExpanded.has(qrId)) {
      newExpanded.delete(qrId)
    } else {
      newExpanded.add(qrId)
    }
    setExpandedQRs(newExpanded)
  }

  const getQRDestinations = (qrId: string) => {
    return summary.destinations?.filter((d: any) => d.qr_id === qrId) || []
  }

  const getActiveDestination = (qrId: string) => {
    const destinations = getQRDestinations(qrId)
    const now = new Date()
    
    return destinations.find((d: any) => {
      if (!d.is_active) return false
      const start = d.start_at ? new Date(d.start_at) : null
      const end = d.end_at ? new Date(d.end_at) : null
      if (start && now < start) return false
      if (end && now > end) return false
      return true
    })
  }

  const formatTime = (dateStr: string | null) => {
    if (!dateStr) return '∞'
    return new Date(dateStr).toLocaleString('es-ES', {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
          <Calendar className="h-5 w-5 text-gray-600" />
          Timeline de QRs ({summary.qrs?.length || 0})
        </h3>
      </div>

      {/* Lista de QRs */}
      <div className="space-y-3">
        {summary.qrs?.map((qr: any) => {
          const isExpanded = expandedQRs.has(qr.id)
          const destinations = getQRDestinations(qr.id)
          const activeDestination = getActiveDestination(qr.id)

          return (
            <QRDropZone
              key={qr.id}
              qrId={qr.id}
              qrCode={qr.code}
              eventId={eventId}
              className="block"
            >
              <div className="rounded-xl border-2 border-gray-200 bg-white hover:border-primary-300 transition-all">
                {/* Header del QR */}
                <div className="p-4 bg-gradient-to-r from-gray-50 to-white">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => toggleExpand(qr.id)}
                        className="text-gray-400 hover:text-gray-600 transition-colors"
                      >
                        {isExpanded ? (
                          <ChevronDown className="h-5 w-5" />
                        ) : (
                          <ChevronRight className="h-5 w-5" />
                        )}
                      </button>

                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-sm font-bold text-gray-900">
                            {qr.code}
                          </span>
                          {qr.title && (
                            <span className="text-xs text-gray-500">({qr.title})</span>
                          )}
                        </div>
                        
                        {activeDestination ? (
                          <div className="flex items-center gap-2 mt-1">
                            <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse"></div>
                            <span className="text-xs font-semibold text-green-700">
                              {activeDestination.label}
                            </span>
                          </div>
                        ) : (
                          <span className="text-xs text-gray-500">
                            {destinations.length > 0
                              ? `${destinations.length} destino(s) programado(s)`
                              : '⬅️ Arrastra contenido aquí'}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-700">
                        {qr.scan_count || 0} escaneos
                      </span>
                      <a
                        href={`/qr/${qr.code}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                        title="Probar QR"
                      >
                        <Eye className="h-4 w-4 text-gray-600" />
                      </a>
                    </div>
                  </div>
                </div>

                {/* Timeline expandida */}
                {isExpanded && (
                  <div className="p-4 border-t border-gray-200 bg-white">
                    {destinations.length === 0 ? (
                      <div className="text-center py-8 text-gray-500">
                        <div className="text-4xl mb-2">📦</div>
                        <p className="text-sm font-semibold">Sin contenido programado</p>
                        <p className="text-xs mt-1">Arrastra un elemento aquí para empezar</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {/* Línea de tiempo */}
                        <div className="relative pl-6">
                          <div className="absolute left-2 top-0 bottom-0 w-0.5 bg-gradient-to-b from-primary-200 via-primary-300 to-primary-200"></div>
                          
                          {destinations
                            .sort((a: any, b: any) => {
                              if (!a.start_at) return 1
                              if (!b.start_at) return -1
                              return new Date(a.start_at).getTime() - new Date(b.start_at).getTime()
                            })
                            .map((dest: any) => {
                              const isActive = dest.id === activeDestination?.id
                              const isPast = dest.end_at && new Date(dest.end_at) < new Date()

                              return (
                                <div key={dest.id} className="relative">
                                  {/* Nodo */}
                                  <div
                                    className={`absolute -left-4 top-2 h-4 w-4 rounded-full border-2 ${
                                      isActive
                                        ? 'bg-green-500 border-green-200 animate-pulse'
                                        : isPast
                                        ? 'bg-gray-300 border-gray-200'
                                        : 'bg-white border-primary-400'
                                    }`}
                                  ></div>

                                  {/* Contenido */}
                                  <div
                                    className={`rounded-lg border p-3 ${
                                      isActive
                                        ? 'bg-green-50 border-green-300'
                                        : isPast
                                        ? 'bg-gray-50 border-gray-200 opacity-60'
                                        : 'bg-white border-gray-200'
                                    }`}
                                  >
                                    <div className="flex items-start justify-between gap-2">
                                      <div className="flex-1">
                                        <div className="font-semibold text-sm text-gray-900">
                                          {dest.label}
                                        </div>
                                        <div className="text-xs text-gray-600 font-mono mt-1 truncate">
                                          {dest.target_url}
                                        </div>
                                        <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
                                          <span>📅 {formatTime(dest.start_at)}</span>
                                          <span>→</span>
                                          <span>🏁 {formatTime(dest.end_at)}</span>
                                        </div>
                                      </div>
                                      
                                      {isActive && (
                                        <span className="px-2 py-0.5 text-xs font-bold rounded-full bg-green-600 text-white">
                                          ACTIVO
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              )
                            })}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </QRDropZone>
          )
        })}

        {summary.qrs?.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            <div className="text-6xl mb-4">🔍</div>
            <p className="text-lg font-semibold">No hay QRs vinculados</p>
            <p className="text-sm mt-2">Vincula QRs al evento primero</p>
          </div>
        )}
      </div>
    </div>
  )
}




'use client'

import React from 'react'
import { DragDropProvider } from './DragDropManager'
import { ContentLibrary } from './ContentLibrary'
import { QRTimeline } from './QRTimeline'
import type { EventSummary } from '@/types/despedida'

interface ContentPlannerProps {
  eventId: string
  summary: EventSummary
}

export function ContentPlanner({ eventId, summary }: ContentPlannerProps) {
  return (
    <DragDropProvider>
      <div className="rounded-3xl border-2 border-gray-200 bg-white shadow-lg overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-primary-600 to-purple-600 p-6 text-white">
          <h2 className="text-2xl font-bold mb-2">📅 Planificador de Contenido</h2>
          <p className="text-sm opacity-90">
            Arrastra contenido desde la biblioteca → Timeline de QRs para programar cuándo se activa
          </p>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-0" style={{ height: '600px' }}>
          {/* Biblioteca (izquierda) */}
          <div className="lg:col-span-1 h-full">
            <ContentLibrary eventId={eventId} summary={summary} />
          </div>

          {/* Timeline (derecha) */}
          <div className="lg:col-span-2 h-full overflow-y-auto bg-gray-50">
            <QRTimeline eventId={eventId} summary={summary} />
          </div>
        </div>

        {/* Tutorial flotante */}
        <div className="bg-blue-50 border-t-2 border-blue-200 p-4">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-sm">
              💡
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-blue-900 mb-1">
                ¿Cómo funciona?
              </p>
              <ol className="text-xs text-blue-800 space-y-1">
                <li>1️⃣ <strong>Prepara:</strong> Crea retos, mensajes, álbumes en sus respectivos módulos</li>
                <li>2️⃣ <strong>Arrastra:</strong> Desde la biblioteca (izquierda) hasta un QR (derecha)</li>
                <li>3️⃣ <strong>Programa:</strong> Configura cuándo debe activarse ese contenido</li>
                <li>4️⃣ <strong>¡Listo!</strong> El QR físico redirigirá automáticamente según la programación</li>
              </ol>
            </div>
          </div>
        </div>
      </div>
    </DragDropProvider>
  )
}












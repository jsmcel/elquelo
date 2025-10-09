'use client'

import { useState } from 'react'
import { toast } from 'react-hot-toast'
import { Switch } from '@/components/ui/Switch'
import type { EventSummary } from '@/types/despedida'

const moduleDescriptions: Record<string, string> = {
  album: 'Gestiona fotos y vídeos compartidos por el grupo.',
  message_wall: 'Recoge mensajes y sorpresas de amigos ausentes.',
  microsite: 'Construye una landing con agenda, ubicaciones e instrucciones.',
  challenge_board: 'Define pruebas y retos con seguimiento de progreso.',
  timeline: 'Ordena momentos clave del fin de semana.',
  playlist: 'Comparte listas de reproducción y sesiones.',
}

interface ModuleTogglesProps {
  eventId: string
  modules: EventSummary['modules']
  onModuleUpdated: (module: EventSummary['modules'][number]) => void
}

export function ModuleToggles({ eventId, modules, onModuleUpdated }: ModuleTogglesProps) {
  const [loadingId, setLoadingId] = useState<string | null>(null)
  const [configuringModule, setConfiguringModule] = useState<string | null>(null)

  const handleToggle = async (moduleType: string, active: boolean) => {
    setLoadingId(moduleType)
    try {
      const response = await fetch(`/api/events/${eventId}/modules/${moduleType}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: active ? 'active' : 'paused' }),
      })
      if (!response.ok) {
        throw new Error('No se pudo actualizar el módulo')
      }
      const payload = await response.json()
      toast.success(`Módulo ${active ? 'activado' : 'en pausa'}`)
      onModuleUpdated(payload.module)
    } catch (error) {
      console.error(error)
      toast.error('Error actualizando módulo')
    } finally {
      setLoadingId(null)
    }
  }

  const getConfigUrl = (moduleType: string) => {
    const baseUrl = `/dashboard/despedida/${eventId}`
    switch (moduleType) {
      case 'album': return `${baseUrl}/album`
      case 'message_wall': return `${baseUrl}/mensajes`
      case 'microsite': return `${baseUrl}/microsite`
      case 'challenge_board': return `${baseUrl}/retos`
      default: return null
    }
  }

  return (
    <section className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
      <h2 className="text-lg font-semibold text-gray-900">Módulos</h2>
      <p className="mt-1 text-sm text-gray-600">
        Activa o desactiva las experiencias disponibles para los participantes.
      </p>
      <div className="mt-5 space-y-4">
        {modules.map((module) => {
          const configUrl = getConfigUrl(module.type)
          const isActive = module.status === 'active'
          
          return (
            <div
              key={module.type}
              className="flex items-start justify-between rounded-2xl border border-gray-100 bg-gray-50 p-4"
            >
              <div className="flex-1">
                <p className="text-sm font-semibold text-gray-900 capitalize">{module.type.replace('_', ' ')}</p>
                <p className="mt-1 text-xs text-gray-600">
                  {moduleDescriptions[module.type] ?? 'Experiencia personalizada.'}
                </p>
                {isActive && configUrl && (
                  <a
                    href={configUrl}
                    className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-primary-600 hover:text-primary-700"
                  >
                    ⚙️ Configurar módulo →
                  </a>
                )}
              </div>
              <Switch
                checked={isActive}
                disabled={loadingId === module.type}
                onCheckedChange={(value) => handleToggle(module.type, value)}
              />
            </div>
          )
        })}
      </div>
    </section>
  )
}
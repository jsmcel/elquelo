'use client'

import React, { useState } from 'react'
import { GitBranch, Plus, Trash2, Zap } from 'lucide-react'
import { toast } from 'react-hot-toast'

interface Trigger {
  id: string
  type: 'on_scan' | 'on_complete' | 'on_count'
  condition?: number // Para on_count
  target_qr_id: string
  target_qr_code?: string
  action: 'activate' | 'deactivate' | 'switch'
  target_destination_id?: string
  target_destination_label?: string
}

interface DestinationTriggersProps {
  destinationId: string
  destinationLabel: string
  eventId: string
  qrId: string
  allQRs: Array<{ id: string; code: string }>
  allDestinations: Array<{ id: string; label: string; qr_id: string }>
  existingTriggers?: Trigger[]
  onUpdate: () => void
}

export function DestinationTriggers({
  destinationId,
  destinationLabel,
  eventId,
  qrId,
  allQRs,
  allDestinations,
  existingTriggers = [],
  onUpdate,
}: DestinationTriggersProps) {
  const [triggers, setTriggers] = useState<Trigger[]>(existingTriggers)
  const [isAdding, setIsAdding] = useState(false)
  const [saving, setSaving] = useState(false)

  const [newTrigger, setNewTrigger] = useState<Partial<Trigger>>({
    type: 'on_scan',
    action: 'activate',
  })

  const handleAddTrigger = () => {
    if (!newTrigger.target_qr_id || !newTrigger.action) {
      toast.error('Completa todos los campos')
      return
    }

    const trigger: Trigger = {
      id: Date.now().toString(),
      type: newTrigger.type || 'on_scan',
      condition: newTrigger.condition,
      target_qr_id: newTrigger.target_qr_id,
      target_qr_code: allQRs.find(q => q.id === newTrigger.target_qr_id)?.code,
      action: newTrigger.action as 'activate' | 'deactivate' | 'switch',
      target_destination_id: newTrigger.target_destination_id,
      target_destination_label: allDestinations.find(d => d.id === newTrigger.target_destination_id)?.label,
    }

    setTriggers([...triggers, trigger])
    setIsAdding(false)
    setNewTrigger({ type: 'on_scan', action: 'activate' })
  }

  const handleRemoveTrigger = (triggerId: string) => {
    setTriggers(triggers.filter(t => t.id !== triggerId))
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const response = await fetch(`/api/destinations/${destinationId}/triggers`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ triggers }),
      })

      if (!response.ok) throw new Error('Error guardando triggers')

      toast.success('Triggers guardados')
      onUpdate()
    } catch (error) {
      console.error(error)
      toast.error('Error guardando triggers')
    } finally {
      setSaving(false)
    }
  }

  const getTriggerDescription = (trigger: Trigger) => {
    let when = ''
    switch (trigger.type) {
      case 'on_scan':
        when = 'Cuando se escanee este QR'
        break
      case 'on_complete':
        when = 'Cuando se complete este reto'
        break
      case 'on_count':
        when = `Tras ${trigger.condition} escaneos`
        break
    }

    let action = ''
    switch (trigger.action) {
      case 'activate':
        action = `Activar en QR ${trigger.target_qr_code}: "${trigger.target_destination_label || 'destino'}"`
        break
      case 'deactivate':
        action = `Desactivar en QR ${trigger.target_qr_code}`
        break
      case 'switch':
        action = `Cambiar QR ${trigger.target_qr_code} a "${trigger.target_destination_label}"`
        break
    }

    return { when, action }
  }

  const targetQRDestinations = newTrigger.target_qr_id
    ? allDestinations.filter(d => d.qr_id === newTrigger.target_qr_id)
    : []

  return (
    <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <GitBranch className="h-5 w-5 text-purple-600" />
          <h4 className="font-semibold text-gray-900">Triggers (Dependencias)</h4>
        </div>
        <button
          onClick={() => setIsAdding(!isAdding)}
          className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-lg bg-purple-600 text-white hover:bg-purple-700"
        >
          <Plus className="h-3 w-3" />
          Añadir
        </button>
      </div>

      <p className="text-xs text-gray-600 mb-4">
        Configura qué pasa en OTROS QRs cuando este destino se activa o escanea
      </p>

      {/* Lista de triggers existentes */}
      {triggers.length > 0 && (
        <div className="space-y-2 mb-4">
          {triggers.map((trigger) => {
            const { when, action } = getTriggerDescription(trigger)
            return (
              <div
                key={trigger.id}
                className="flex items-start justify-between gap-2 rounded-lg border border-purple-200 bg-white p-3"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <Zap className="h-4 w-4 text-purple-600" />
                    <span className="text-xs font-semibold text-purple-900">{when}</span>
                  </div>
                  <p className="text-xs text-gray-700 pl-6">→ {action}</p>
                </div>
                <button
                  onClick={() => handleRemoveTrigger(trigger.id)}
                  className="text-red-600 hover:text-red-700"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            )
          })}
        </div>
      )}

      {/* Formulario para añadir nuevo trigger */}
      {isAdding && (
        <div className="rounded-lg border border-purple-300 bg-purple-50 p-4 space-y-3">
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              ¿Cuándo activar?
            </label>
            <select
              value={newTrigger.type}
              onChange={(e) => setNewTrigger({ ...newTrigger, type: e.target.value as any })}
              className="w-full text-sm rounded-lg border-gray-300"
            >
              <option value="on_scan">Al escanear este destino</option>
              <option value="on_complete">Al completar este reto</option>
              <option value="on_count">Tras X escaneos</option>
            </select>
          </div>

          {newTrigger.type === 'on_count' && (
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Número de escaneos
              </label>
              <input
                type="number"
                min="1"
                value={newTrigger.condition || 1}
                onChange={(e) =>
                  setNewTrigger({ ...newTrigger, condition: parseInt(e.target.value) })
                }
                className="w-full text-sm rounded-lg border-gray-300"
              />
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              ¿Qué QR afectar?
            </label>
            <select
              value={newTrigger.target_qr_id || ''}
              onChange={(e) =>
                setNewTrigger({ ...newTrigger, target_qr_id: e.target.value })
              }
              className="w-full text-sm rounded-lg border-gray-300"
            >
              <option value="">Selecciona un QR...</option>
              {allQRs
                .filter((q) => q.id !== qrId)
                .map((qr) => (
                  <option key={qr.id} value={qr.id}>
                    QR {qr.code}
                  </option>
                ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              ¿Qué hacer?
            </label>
            <select
              value={newTrigger.action}
              onChange={(e) => setNewTrigger({ ...newTrigger, action: e.target.value as any })}
              className="w-full text-sm rounded-lg border-gray-300"
            >
              <option value="activate">Activar un destino específico</option>
              <option value="switch">Cambiar al siguiente destino</option>
              <option value="deactivate">Desactivar destino actual</option>
            </select>
          </div>

          {(newTrigger.action === 'activate' || newTrigger.action === 'switch') &&
            newTrigger.target_qr_id && (
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  ¿Qué destino activar?
                </label>
                <select
                  value={newTrigger.target_destination_id || ''}
                  onChange={(e) =>
                    setNewTrigger({ ...newTrigger, target_destination_id: e.target.value })
                  }
                  className="w-full text-sm rounded-lg border-gray-300"
                >
                  <option value="">Selecciona destino...</option>
                  {targetQRDestinations.map((dest) => (
                    <option key={dest.id} value={dest.id}>
                      {dest.label}
                    </option>
                  ))}
                </select>
              </div>
            )}

          <div className="flex gap-2 pt-2">
            <button
              onClick={() => setIsAdding(false)}
              className="flex-1 px-3 py-2 text-xs font-semibold rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50"
            >
              Cancelar
            </button>
            <button
              onClick={handleAddTrigger}
              className="flex-1 px-3 py-2 text-xs font-semibold rounded-lg bg-purple-600 text-white hover:bg-purple-700"
            >
              Añadir Trigger
            </button>
          </div>
        </div>
      )}

      {/* Guardar cambios */}
      {triggers.length > 0 && (
        <button
          onClick={handleSave}
          disabled={saving}
          className="w-full mt-4 px-4 py-2 text-sm font-semibold rounded-lg bg-purple-600 text-white hover:bg-purple-700 disabled:opacity-50"
        >
          {saving ? 'Guardando...' : 'Guardar Triggers'}
        </button>
      )}

      {/* Ejemplos */}
      {!isAdding && triggers.length === 0 && (
        <div className="mt-4 rounded-lg bg-blue-50 border border-blue-200 p-3">
          <p className="text-xs font-semibold text-blue-900 mb-2">💡 Ejemplos de uso:</p>
          <ul className="text-xs text-blue-800 space-y-1">
            <li>• &quot;Cuando escaneen mi QR → activar video sorpresa en QR del novio&quot;</li>
            <li>• &quot;Tras 5 escaneos → desbloquear reto secreto&quot;</li>
            <li>• &quot;Al completar reto → cambiar QR de María a mensaje especial&quot;</li>
          </ul>
        </div>
      )}
    </div>
  )
}




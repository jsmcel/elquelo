'use client'

import React, { useState } from 'react'
import { Sparkles, Zap, Wrench, ArrowRight, Check } from 'lucide-react'
import { toast } from 'react-hot-toast'
import { Modal, ModalFooter } from '@/components/ui/Modal'

interface QuickStartWizardProps {
  eventId: string
  onComplete: () => void
  onClose?: () => void
}

// Paquetes preconfigurados
const QUICK_START_PACKAGES = [
  {
    id: 'express',
    name: '⚡ Express',
    subtitle: 'Listo en 30 segundos',
    level: 'zero-effort',
    duration: '30 seg',
    description: 'Paquete completo ya configurado. Solo activa y listo.',
    includes: [
      'Microsite: Plantilla "Party Animal"',
      '5 retos populares preseleccionados',
      'Álbum activado',
      'Timeline automática de 2 días',
    ],
    color: 'from-green-500 to-emerald-600',
    icon: '⚡',
  },
  {
    id: 'custom',
    name: '🎨 Personalizado',
    subtitle: 'Elige tu estilo',
    level: 'low-effort',
    duration: '5 min',
    description: 'Selecciona plantilla de microsite + retos. Nosotros montamos el resto.',
    includes: [
      'Elige plantilla de microsite (7 opciones)',
      'Selecciona retos de la biblioteca (40+)',
      'Configura fechas básicas',
      'Timeline automática',
    ],
    color: 'from-blue-500 to-cyan-600',
    icon: '🎨',
  },
  {
    id: 'pro',
    name: '🚀 Pro',
    subtitle: 'Control total',
    level: 'high-effort',
    duration: '30 min',
    description: 'Crea todo desde cero. Máxima personalización.',
    includes: [
      'Crea retos personalizados',
      'Diseña microsite sección por sección',
      'Timeline manual avanzada',
      'Configuración avanzada de módulos',
    ],
    color: 'from-purple-500 to-pink-600',
    icon: '🚀',
  },
]

export function QuickStartWizard({ eventId, onComplete, onClose }: QuickStartWizardProps) {
  const [selectedPackage, setSelectedPackage] = useState<string | null>(null)
  const [isApplying, setIsApplying] = useState(false)
  const [step, setStep] = useState<'select' | 'confirm' | 'applying' | 'done'>('select')
  const [resultSummary, setResultSummary] = useState<any | null>(null)

  const handleSelectPackage = (packageId: string) => {
    setSelectedPackage(packageId)
    setStep('confirm')
  }

  const handleApply = async () => {
    if (!selectedPackage) return

    setIsApplying(true)
    setStep('applying')

    try {
      const response = await fetch(`/api/events/${eventId}/quick-start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ packageId: selectedPackage }),
      })

      if (!response.ok) throw new Error('Error aplicando paquete')

      toast.success('¡Evento configurado correctamente!')
      
      setTimeout(() => {
        onComplete()
      }, 1000)
    } catch (error) {
      console.error('[QUICK START] Error applying package:', error)
      toast.error(error instanceof Error ? error.message : 'Error al aplicar el paquete')
      setIsApplying(false)
      setStep('confirm')
    }
  }

  const selectedPkg = QUICK_START_PACKAGES.find(p => p.id === selectedPackage)

  if (step === 'applying') {
    return (
      <Modal
        isOpen={true}
        onClose={() => {}} // No se puede cerrar durante la aplicación
        title="Configurando tu evento..."
        description={`${selectedPkg?.name} - ${selectedPkg?.duration}`}
        size="md"
        showCloseButton={false}
      >
        <div className="text-center">
          <div className="mb-6">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-primary-500 to-purple-600 mb-4">
              <div className="animate-spin h-8 w-8 border-4 border-white border-t-transparent rounded-full"></div>
            </div>
          </div>

          <div className="space-y-2 text-left">
            {selectedPkg?.includes.map((item, idx) => (
              <div key={idx} className="flex items-center gap-2 text-sm text-gray-700">
                <Check className="h-4 w-4 text-green-600" />
                <span>{item}</span>
              </div>
            ))}
          </div>
        </div>
      </Modal>
    )
  }


  if (step === 'done') {
    return (
      <Modal
        isOpen={true}
        onClose={() => {
          setResultSummary(null)
          onComplete()
        }}
        title="Paquete Express aplicado"
        description="Ya puedes seguir personalizando el evento."
        size="xl"
      >
        <div className="text-center mb-6">
          <div className="mx-auto mb-4 inline-flex h-16 w-16 items-center justify-center rounded-full bg-green-100 text-3xl">⚡</div>
        </div>

        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2">
          <SummaryCard label="Módulos activados" value={resultSummary?.modulesActivated ?? 0} />
          <SummaryCard label="Retos creados" value={resultSummary?.retosCreated ?? 0} />
        </div>

        <ModalFooter className="flex flex-col-reverse sm:flex-row gap-3 sm:justify-end">
          <button
            type="button"
            onClick={() => {
              setResultSummary(null)
              setStep('select')
            }}
            className="w-full sm:w-auto min-h-[44px] rounded-lg px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-100 border border-gray-300 touch-manipulation"
          >
            Configurar otro paquete
          </button>
          <button
            type="button"
            onClick={() => {
              setResultSummary(null)
              onComplete()
            }}
            className="w-full sm:w-auto min-h-[44px] rounded-lg bg-primary-600 px-4 py-2 text-sm font-semibold text-white hover:bg-primary-700 touch-manipulation"
          >
            Ver cambios
          </button>
        </ModalFooter>
      </Modal>
    )
  }

  if (step === 'confirm' && selectedPkg) {
    return (
      <Modal
        isOpen={true}
        onClose={() => onClose?.()}
        title="Confirma tu selección"
        size="2xl"
      >

          <div className={`rounded-xl bg-gradient-to-br ${selectedPkg.color} p-6 text-white mb-6`}>
            <div className="text-4xl mb-3">{selectedPkg.icon}</div>
            <h3 className="text-xl font-bold mb-2">{selectedPkg.name}</h3>
            <p className="text-sm opacity-90">{selectedPkg.description}</p>
          </div>

          <div className="mb-6">
            <h4 className="font-semibold text-gray-900 mb-3">
              Esto configurará automáticamente:
            </h4>
            <ul className="space-y-2">
              {selectedPkg.includes.map((item, idx) => (
                <li key={idx} className="flex items-start gap-2 text-sm text-gray-700">
                  <Check className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
            <p className="text-sm text-yellow-900">
              ⚠️ <strong>Nota:</strong> Esto sobrescribirá cualquier configuración existente.
              Podrás personalizarlo después.
            </p>
          </div>

        <ModalFooter className="flex flex-col-reverse sm:flex-row gap-3">
          <button
            onClick={() => setStep('select')}
            className="w-full sm:w-auto min-h-[44px] px-6 py-3 rounded-xl border-2 border-gray-300 text-gray-700 font-semibold hover:bg-gray-50 touch-manipulation"
          >
            ← Volver
          </button>
          <button
            type="button"
            onClick={handleApply}
            disabled={isApplying}
            className={`w-full sm:w-auto min-h-[44px] px-6 py-3 rounded-xl bg-gradient-to-br ${selectedPkg.color} text-white font-semibold hover:shadow-lg transition-all disabled:opacity-50 touch-manipulation`}
          >
            {isApplying ? 'Aplicando...' : `Aplicar ${selectedPkg.name}`}
          </button>
        </ModalFooter>
      </Modal>
    )
  }

  return (
    <Modal
      isOpen={true}
      onClose={() => onClose?.()}
      title="Quick Start"
      description="Elige tu nivel de esfuerzo"
      size="5xl"
    >
      {/* Packages Grid */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
        {QUICK_START_PACKAGES.map((pkg) => (
          <button
            type="button"
            key={pkg.id}
            onClick={() => handleSelectPackage(pkg.id)}
            className={`min-h-[44px] rounded-2xl border-2 px-6 py-5 text-left transition-all hover:scale-[1.02] hover:shadow-lg touch-manipulation ${
              selectedPackage === pkg.id
                ? 'border-primary-500 bg-primary-50'
                : 'border-gray-200 bg-white hover:border-primary-300'
            }`}
          >
            <div className="flex items-center justify-between mb-3">
              <div className="text-3xl">{pkg.icon}</div>
              <span className="text-xs font-semibold uppercase tracking-wide text-gray-400">{pkg.duration}</span>
            </div>
            <h3 className="text-lg font-bold text-gray-900">{pkg.name}</h3>
            <p className="text-sm text-gray-600 mt-2">{pkg.subtitle}</p>
          </button>
        ))}
      </div>
    </Modal>
  )
}




function SummaryCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
      <p className="text-xs uppercase tracking-wide text-gray-500">{label}</p>
      <p className="mt-2 text-2xl font-bold text-gray-900">{value}</p>
    </div>
  )
}








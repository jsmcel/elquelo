'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Header } from '@/components/Header'
import { Footer } from '@/components/Footer'
import { ChallengeBoard } from '@/components/despedida/ChallengeBoard'
import { ChallengeLibrary } from '@/components/despedida/ChallengeLibrary'
import { Loader2, ArrowLeft, ExternalLink } from 'lucide-react'
import { toast } from 'react-hot-toast'
import type { EventSummary } from '@/types/despedida'
import type { ChallengeTemplate } from '@/lib/challenge-templates'

export default function ChallengeConfigPage() {
  const params = useParams<{ eventId: string }>()
  const router = useRouter()
  const eventId = params.eventId
  const [summary, setSummary] = useState<EventSummary | null>(null)
  const [loading, setLoading] = useState(true)
  const [settings, setSettings] = useState({
    title: 'Tablero de retos',
    description: 'Completa los desafíos y gana puntos',
    enablePoints: true,
    enableTeams: false,
    requireProof: true,
  })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    const loadEvent = async () => {
      try {
        const response = await fetch(`/api/events/${eventId}/summary`)
        if (response.ok) {
          const data = await response.json()
          setSummary(data)
          
          const challengeModule = data.modules?.find((m: any) => m.type === 'challenge_board')
          if (challengeModule?.settings) {
            setSettings({
              title: challengeModule.settings.title || 'Tablero de retos',
              description: challengeModule.settings.description || 'Completa los desafíos',
              enablePoints: challengeModule.settings.enablePoints ?? true,
              enableTeams: challengeModule.settings.enableTeams ?? false,
              requireProof: challengeModule.settings.requireProof ?? true,
            })
          }
        }
      } catch (error) {
        console.error('Error loading event:', error)
        toast.error('Error cargando evento')
      } finally {
        setLoading(false)
      }
    }

    loadEvent()
  }, [eventId])

  const handleSaveSettings = async () => {
    setSaving(true)
    try {
      const response = await fetch(`/api/events/${eventId}/modules/challenge_board`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'active',
          settings,
        }),
      })

      if (!response.ok) throw new Error('Error guardando configuración')

      toast.success('Configuración guardada')
    } catch (error) {
      console.error(error)
      toast.error('Error guardando configuración')
    } finally {
      setSaving(false)
    }
  }

  const handlePruebaCreated = (prueba: any) => {
    if (!summary) return
    setSummary({
      ...summary,
      pruebas: [...summary.pruebas, prueba]
    })
  }

  const handleSelectChallenge = async (challenge: ChallengeTemplate) => {
    try {
      const response = await fetch(`/api/events/${eventId}/pruebas`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: challenge.title,
          description: challenge.description,
          points: challenge.points,
          duration: challenge.duration,
          requireProof: challenge.requiresProof,
          proofType: challenge.proofType,
          metadata: {
            templateId: challenge.id,
            category: challenge.category,
            difficulty: challenge.difficulty,
            usesQR: challenge.usesQR,
            qrInstruction: challenge.qrInstruction,
          }
        }),
      })

      if (!response.ok) throw new Error('Error creando prueba')

      const payload = await response.json()
      handlePruebaCreated(payload.prueba)
      toast.success(`✅ ${challenge.icon} "${challenge.title}" añadido`)
    } catch (error) {
      console.error(error)
      toast.error('Error añadiendo reto')
    }
  }

  const getChallengeUrl = () => {
    return `${window.location.origin}/e/${eventId}/retos`
  }

  const getLeaderboardUrl = () => {
    return `${window.location.origin}/e/${eventId}/ranking`
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
      </div>
    )
  }

  if (!summary) {
    return <div>Evento no encontrado</div>
  }

  const challengeModule = summary.modules?.find(m => m.type === 'challenge_board')
  const isActive = challengeModule?.status === 'active'

  return (
    <main className="min-h-screen bg-gray-50">
      <Header />
      <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
        <button
          onClick={() => router.back()}
          className="mb-6 inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft className="h-4 w-4" />
          Volver al panel
        </button>

        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Tablero de Retos</h1>
          <p className="mt-2 text-gray-600">
            Crea desafíos divertidos para gamificar tu evento
          </p>
        </div>

        {!isActive && (
          <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50 p-4">
            <p className="text-sm text-amber-800">
              ⚠️ El módulo de retos está desactivado. Actívalo primero en el panel principal.
            </p>
          </div>
        )}

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Biblioteca de retos */}
          <div className="lg:col-span-1">
            <ChallengeLibrary onSelectChallenge={handleSelectChallenge} />
          </div>

          {/* Configuración y gestión */}
          <div className="space-y-6 lg:col-span-1">
          {/* Configuración */}
          <section className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-gray-900">Configuración</h2>
            <div className="mt-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Título
                </label>
                <input
                  type="text"
                  value={settings.title}
                  onChange={(e) => setSettings(prev => ({ ...prev, title: e.target.value }))}
                  className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-200"
                  placeholder="Tablero de retos"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Descripción
                </label>
                <textarea
                  value={settings.description}
                  onChange={(e) => setSettings(prev => ({ ...prev, description: e.target.value }))}
                  rows={2}
                  className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-200"
                  placeholder="Completa los desafíos y gana puntos"
                />
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between rounded-xl border border-gray-200 p-4">
                  <div>
                    <p className="text-sm font-medium text-gray-900">Sistema de puntos</p>
                    <p className="text-xs text-gray-600">Asignar puntos a cada reto completado</p>
                  </div>
                  <label className="relative inline-flex cursor-pointer items-center">
                    <input
                      type="checkbox"
                      checked={settings.enablePoints}
                      onChange={(e) => setSettings(prev => ({ ...prev, enablePoints: e.target.checked }))}
                      className="sr-only peer"
                    />
                    <div className="peer h-6 w-11 rounded-full bg-gray-200 after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-gray-300 after:bg-white after:transition-all after:content-[''] peer-checked:bg-primary-600 peer-checked:after:translate-x-full peer-checked:after:border-white"></div>
                  </label>
                </div>

                <div className="flex items-center justify-between rounded-xl border border-gray-200 p-4">
                  <div>
                    <p className="text-sm font-medium text-gray-900">Modo equipos</p>
                    <p className="text-xs text-gray-600">Competir por equipos en lugar de individual</p>
                  </div>
                  <label className="relative inline-flex cursor-pointer items-center">
                    <input
                      type="checkbox"
                      checked={settings.enableTeams}
                      onChange={(e) => setSettings(prev => ({ ...prev, enableTeams: e.target.checked }))}
                      className="sr-only peer"
                    />
                    <div className="peer h-6 w-11 rounded-full bg-gray-200 after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-gray-300 after:bg-white after:transition-all after:content-[''] peer-checked:bg-primary-600 peer-checked:after:translate-x-full peer-checked:after:border-white"></div>
                  </label>
                </div>

                <div className="flex items-center justify-between rounded-xl border border-gray-200 p-4">
                  <div>
                    <p className="text-sm font-medium text-gray-900">Requerir prueba</p>
                    <p className="text-xs text-gray-600">Obligar subir foto/video para validar</p>
                  </div>
                  <label className="relative inline-flex cursor-pointer items-center">
                    <input
                      type="checkbox"
                      checked={settings.requireProof}
                      onChange={(e) => setSettings(prev => ({ ...prev, requireProof: e.target.checked }))}
                      className="sr-only peer"
                    />
                    <div className="peer h-6 w-11 rounded-full bg-gray-200 after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-gray-300 after:bg-white after:transition-all after:content-[''] peer-checked:bg-primary-600 peer-checked:after:translate-x-full peer-checked:after:border-white"></div>
                  </label>
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  onClick={handleSaveSettings}
                  disabled={saving}
                  className="inline-flex items-center gap-2 rounded-xl bg-primary-600 px-4 py-2 text-sm font-semibold text-white hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                  Guardar configuración
                </button>
              </div>
            </div>
          </section>

          {/* URLs públicas */}
          {isActive && (
            <section className="rounded-3xl border border-green-200 bg-green-50 p-6">
              <h3 className="text-sm font-semibold text-green-900">URLs públicas</h3>
              
              <div className="mt-4 space-y-3">
                <div>
                  <p className="text-xs font-medium text-green-700">Retos:</p>
                  <div className="mt-1 flex items-center gap-2">
                    <input
                      type="text"
                      readOnly
                      value={getChallengeUrl()}
                      className="flex-1 rounded-lg border border-green-300 bg-white px-3 py-2 text-xs font-mono"
                    />
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(getChallengeUrl())
                        toast.success('URL copiada')
                      }}
                      className="rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-700"
                    >
                      Copiar
                    </button>
                  </div>
                </div>

                {settings.enablePoints && (
                  <div>
                    <p className="text-xs font-medium text-green-700">Ranking:</p>
                    <div className="mt-1 flex items-center gap-2">
                      <input
                        type="text"
                        readOnly
                        value={getLeaderboardUrl()}
                        className="flex-1 rounded-lg border border-green-300 bg-white px-3 py-2 text-xs font-mono"
                      />
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(getLeaderboardUrl())
                          toast.success('URL copiada')
                        }}
                        className="rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-700"
                      >
                        Copiar
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </section>
          )}

          {/* Gestión de retos */}
          <ChallengeBoard
            eventId={eventId}
            pruebas={summary.pruebas}
            onPruebaCreated={handlePruebaCreated}
          />

          {/* Instrucciones */}
          <section className="rounded-3xl border border-blue-200 bg-blue-50 p-6">
            <h3 className="text-sm font-semibold text-blue-900">💡 Cómo usar los retos</h3>
            <ol className="mt-3 space-y-2 text-sm text-blue-800">
              <li>1. Crea retos usando el panel de &quot;Pruebas y retos&quot;</li>
              <li>2. Asigna un QR específico a cada reto como destino</li>
              <li>3. Los participantes escanean el QR y ven el reto</li>
              <li>4. Suben foto/video como prueba (si está activado)</li>
              <li>5. Tú apruebas la prueba y se asignan puntos</li>
              <li>6. Todos pueden ver el ranking en tiempo real</li>
            </ol>
          </section>
          </div>
        </div>
      </div>
      <Footer />
    </main>
  )
}


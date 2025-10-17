'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useUser } from '@/app/providers'
import { toast } from 'react-hot-toast'
import {
  Plus,
  Trash2,
  ArrowLeft,
  ArrowRight,
  Loader2,
  QrCode,
} from 'lucide-react'
import { Header } from '@/components/Header'
import { Footer } from '@/components/Footer'

interface Participant {
  id: string
  name: string
  email: string
  size: string
}

const SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL']
const STEPS = ['Despedida', 'Integrantes', 'Crear Grupo']
const FALLBACK_QR_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://elquelo.eu'

const createParticipant = (): Participant => ({
  id: crypto.randomUUID(),
  name: '',
  email: '',
  size: 'M',
})

export default function ConfiguratorPage() {
  const { user, loading } = useUser()
  const router = useRouter()

  const [step, setStep] = useState(1)
  const [groupName, setGroupName] = useState('')
  const [eventDate, setEventDate] = useState('')
  const [participants, setParticipants] = useState<Participant[]>([])
  const [generating, setGenerating] = useState(false)

  useEffect(() => {
    if (!loading && !user) {
      router.replace('/auth/login?redirect=/configurador')
    }
  }, [user, loading, router])

  const addParticipant = () => {
    setParticipants(prev => [...prev, createParticipant()])
  }

  const removeParticipant = (id: string) => {
    setParticipants(prev => prev.filter(p => p.id !== id))
  }

  const updateParticipant = (id: string, updates: Partial<Participant>) => {
    setParticipants(prev => prev.map(p => p.id === id ? { ...p, ...updates } : p))
  }

  const nextStep = () => {
    // Validate current step before proceeding
    if (step === 1) {
      if (!groupName.trim()) {
        toast.error('El nombre del grupo es obligatorio')
        return
      }
      if (!eventDate) {
        toast.error('La fecha del evento es obligatoria')
        return
      }
    }
    setStep(prev => Math.min(prev + 1, 3))
  }
  const previousStep = () => setStep(prev => Math.max(prev - 1, 1))

  const handleSaveGroup = async () => {
    if (!user) {
      router.replace('/auth/login?redirect=/configurador')
      return
    }

    if (participants.length === 0) {
      toast.error('Anade al menos una camiseta')
      return
    }

    if (!eventDate) {
      toast.error('La fecha del evento es obligatoria')
      return
    }

    setGenerating(true)

    try {
      const normalizedGroupName = groupName.trim()

      const payload = {
        destination_url: FALLBACK_QR_URL,
        description: normalizedGroupName ? `Kit ${normalizedGroupName}` : 'Kit personalizado',
        group: normalizedGroupName || undefined,
        eventDate: eventDate, // Fecha del evento (obligatoria)
        members: participants.map((participant) => ({
          name: participant.name,
          title: normalizedGroupName ? `${normalizedGroupName} - ${participant.name}` : participant.name,
          destination_url: FALLBACK_QR_URL,
          email: participant.email,
          size: participant.size,
          is_novio_novia: false, // configurador-simple no tiene esta opción
        })),
      }

      const response = await fetch('/api/qr/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      const data = await response.json()

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'No pudimos generar los QRs')
      }

      toast.success('¡Grupo creado exitosamente! Ahora puedes diseñar las camisetas.')
      
      // Redirect to dashboard
      setTimeout(() => {
        router.push('/dashboard')
      }, 2000)
    } catch (error) {
      console.error(error)
      toast.error('No pudimos crear el grupo. Intentalo de nuevo.')
    } finally {
      setGenerating(false)
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
      </div>
    )
  }

  if (!user) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="mx-auto max-w-5xl px-4 py-12 sm:py-16">
        <div className="mb-10 max-w-3xl">
          <h1 className="text-3xl font-bold sm:text-4xl">Configura tu kit</h1>
          <p className="mt-2 text-gray-600">
            Crea tu grupo y diseña las camisetas. Solo pagarás cuando confirmes el pedido.
          </p>
        </div>

        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            {STEPS.map((stepName, index) => (
              <div key={stepName} className="flex items-center">
                <div className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium ${
                  step > index + 1 
                    ? 'bg-green-600 text-white' 
                    : step === index + 1 
                    ? 'bg-primary-600 text-white' 
                    : 'bg-gray-200 text-gray-600'
                }`}>
                  {step > index + 1 ? '✓' : index + 1}
                </div>
                <span className={`ml-2 text-sm font-medium ${
                  step >= index + 1 ? 'text-gray-900' : 'text-gray-500'
                }`}>
                  {stepName}
                </span>
                {index < STEPS.length - 1 && (
                  <div className={`mx-4 h-0.5 w-16 ${
                    step > index + 1 ? 'bg-green-600' : 'bg-gray-200'
                  }`} />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Step 1: Despedida */}
        {step === 1 && (
          <section className="space-y-6 rounded-3xl border border-gray-100 bg-white p-8 shadow-sm">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Información del evento</h2>
              <p className="text-sm text-gray-600">Cuéntanos sobre tu despedida o evento.</p>
            </div>

            <div className="grid gap-6 sm:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Nombre del grupo</label>
                <input
                  type="text"
                  value={groupName}
                  onChange={(e) => setGroupName(e.target.value)}
                  className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm text-gray-900 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-100"
                  placeholder="Ej: Despedida de Laura"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Fecha del evento *</label>
                <input
                  type="date"
                  value={eventDate}
                  onChange={(e) => setEventDate(e.target.value)}
                  className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm text-gray-900 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-100"
                />
              </div>
            </div>

            <div className="flex justify-end">
              <button
                onClick={nextStep}
                disabled={!groupName.trim() || !eventDate}
                className="inline-flex items-center gap-2 rounded-full bg-primary-600 px-6 py-2 text-sm font-semibold text-white transition hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Siguiente <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </section>
        )}

        {/* Step 2: Integrantes */}
        {step === 2 && (
          <section className="space-y-6 rounded-3xl border border-gray-100 bg-white p-8 shadow-sm">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">Integrantes del grupo</h2>
                <p className="text-sm text-gray-600">Añade los nombres y emails de cada participante.</p>
              </div>
              <button
                onClick={addParticipant}
                className="inline-flex items-center gap-2 rounded-full border border-primary-200 px-4 py-2 text-sm font-semibold text-primary-600 transition hover:border-primary-400"
              >
                <Plus className="h-4 w-4" /> Añadir integrante
              </button>
            </div>

            {participants.length === 0 ? (
              <div className="rounded-3xl border border-dashed border-gray-200 bg-gray-50 p-10 text-center text-sm text-gray-500">
                Añade al menos un integrante para continuar.
              </div>
            ) : (
              <div className="space-y-4">
                {participants.map((participant) => (
                  <div key={participant.id} className="rounded-3xl border border-gray-100 bg-gray-50/60 p-6">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                      <div className="grid flex-1 gap-4 sm:grid-cols-3">
                        <div className="space-y-2">
                          <label className="text-sm font-medium text-gray-700">Nombre</label>
                          <input
                            type="text"
                            value={participant.name}
                            onChange={(event) => updateParticipant(participant.id, { name: event.target.value })}
                            className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm text-gray-900 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-100"
                            placeholder="Nombre completo"
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-sm font-medium text-gray-700">Email</label>
                          <input
                            type="email"
                            value={participant.email}
                            onChange={(event) => updateParticipant(participant.id, { email: event.target.value })}
                            className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm text-gray-900 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-100"
                            placeholder="email@ejemplo.com"
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-sm font-medium text-gray-700">Talla</label>
                          <select
                            value={participant.size}
                            onChange={(event) => updateParticipant(participant.id, { size: event.target.value })}
                            className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm text-gray-900 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-100"
                          >
                            {SIZES.map((size) => (
                              <option key={size} value={size}>
                                {size}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>

                      <button
                        onClick={() => removeParticipant(participant.id)}
                        className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-gray-200 text-gray-500 transition hover:border-red-200 hover:text-red-500"
                        aria-label="Eliminar integrante"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="flex items-center justify-between">
              <button
                onClick={previousStep}
                className="inline-flex items-center gap-2 rounded-full border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 transition hover:border-gray-300"
              >
                <ArrowLeft className="h-4 w-4" /> Anterior
              </button>
              <button
                onClick={nextStep}
                disabled={participants.length === 0}
                className="inline-flex items-center gap-2 rounded-full bg-primary-600 px-6 py-2 text-sm font-semibold text-white transition hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Siguiente <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </section>
        )}

        {/* Step 3: Crear Grupo */}
        {step === 3 && (
          <section className="space-y-6 rounded-3xl border border-gray-100 bg-white p-8 shadow-sm">
            <div className="text-center">
              <h2 className="text-xl font-semibold text-gray-900">Crear Grupo</h2>
              <p className="text-sm text-gray-600">Revisa los integrantes y crea el grupo para empezar a diseñar.</p>
            </div>

            {/* Resumen de participantes */}
            <div className="bg-gray-50 rounded-2xl p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                {participants.length} participante{participants.length > 1 ? 's' : ''} en el grupo
              </h3>
              <div className="space-y-3">
                {participants.map((participant, index) => (
                  <div key={participant.id} className="flex items-center justify-between bg-white rounded-lg p-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center text-sm font-medium text-primary-600">
                        {index + 1}
                      </div>
                      <div>
                        <div className="font-medium text-gray-900">{participant.name}</div>
                        <div className="text-sm text-gray-500">{participant.email}</div>
                      </div>
                    </div>
                    <div className="text-sm text-gray-500">
                      Talla: {participant.size}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {participants.length === 0 ? (
              <div className="rounded-3xl border border-dashed border-gray-200 bg-gray-50 p-10 text-center text-sm text-gray-500">
                Primero añade la lista de integrantes en el paso anterior.
                <div className="mt-4">
                  <button
                    type="button"
                    onClick={() => setStep(2)}
                    className="inline-flex items-center gap-2 rounded-full border border-primary-200 px-4 py-2 text-sm font-semibold text-primary-600 transition hover:border-primary-400"
                  >
                    <ArrowLeft className="h-4 w-4" /> Volver a integrantes
                  </button>
                </div>
              </div>
            ) : (
              <div className="text-center space-y-6">
                <div className="bg-green-50 border border-green-200 rounded-2xl p-6">
                  <h3 className="text-lg font-semibold text-green-900 mb-2">¡Listo para crear el grupo!</h3>
                  <p className="text-green-700">
                    Después de crear el grupo, podrás diseñar las camisetas en el dashboard.
                  </p>
                </div>

                <div className="flex items-center justify-between">
                  <button
                    onClick={previousStep}
                    className="inline-flex items-center gap-2 rounded-full border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 transition hover:border-gray-300"
                  >
                    <ArrowLeft className="h-4 w-4" /> Anterior
                  </button>
                  <button
                    onClick={handleSaveGroup}
                    disabled={generating || participants.length === 0}
                    className="inline-flex items-center gap-2 rounded-full bg-green-600 px-6 py-2 text-sm font-semibold text-white transition hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {generating ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Creando grupo...
                      </>
                    ) : (
                      <>
                        <QrCode className="h-4 w-4" />
                        Crear Grupo (GRATIS)
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </section>
        )}
      </div>
      <Footer />
    </div>
  )
}


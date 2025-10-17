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
import { CamisetaPackageButton } from '@/components/CamisetaPackageButton'
import { getAllPackages } from '@/lib/packages'

interface Participant {
  id: string
  name: string
  email: string
  size: string
  isNovioNovia: boolean
}

const SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL']
const STEPS = ['Despedida', 'Integrantes', 'Paquetes', 'Crear Grupo']
const FALLBACK_QR_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://elquelo.eu'

const createParticipant = (): Participant => ({
  id: crypto.randomUUID(),
  name: '',
  email: '',
  size: 'M',
  isNovioNovia: false,
})

export default function ConfiguratorPage() {
  const { user, loading } = useUser()
  const router = useRouter()

  const [step, setStep] = useState(1)
  const [groupName, setGroupName] = useState('')
  const [eventDate, setEventDate] = useState('')
  const [participants, setParticipants] = useState<Participant[]>([])
  const [selectedPackages, setSelectedPackages] = useState<string[]>([]) // Sin paquetes por defecto
  const [generating, setGenerating] = useState(false)
  const [camisetaPrice, setCamisetaPrice] = useState<number>(0) // Se carga de la API
  const [packagePrices, setPackagePrices] = useState<Record<string, number>>({}) // Precios de todos los paquetes

  useEffect(() => {
    if (!loading && !user) {
        router.replace('/auth/login?redirect=/configurador')
      }
  }, [user, loading, router])

  // Cargar precios de todos los paquetes
  useEffect(() => {
    async function loadPackagePrices() {
      const packages = getAllPackages()
      const allVariantIds: number[] = []
      
      // Recopilar todos los variantIds únicos de todos los paquetes
      packages.forEach(pkg => {
        pkg.products.forEach(product => {
          if (product.defaultVariantId && product.defaultVariantId !== 0) {
            allVariantIds.push(product.defaultVariantId)
          }
        })
      })

      // Añadir el variantId de camisetas que ya sabemos
      if (!allVariantIds.includes(4013)) {
        allVariantIds.push(4013)
      }

      if (allVariantIds.length === 0) return

      try {
        const response = await fetch('/api/printful/variants/price', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ variantIds: allVariantIds })
        })

        if (response.ok) {
          const { prices } = await response.json()
          
          // Calcular precios de cada paquete
          const newPackagePrices: Record<string, number> = {}
          
          packages.forEach(pkg => {
            let totalPrice = 0
            pkg.products.forEach(product => {
              if (product.defaultVariantId && product.defaultVariantId !== 0 && prices[product.defaultVariantId]) {
                totalPrice += prices[product.defaultVariantId].finalPrice
              } else {
                // Usar precio estimado si no hay precio real
                totalPrice += product.estimatedPrice || 0
              }
            })
            newPackagePrices[pkg.id] = totalPrice
          })

          setPackagePrices(newPackagePrices)
          
          // También establecer el precio de camisetas para compatibilidad
          if (prices[4013]) {
            setCamisetaPrice(prices[4013].finalPrice)
          }
        }
      } catch (error) {
        console.error('Error cargando precios de paquetes:', error)
      }
    }

    loadPackagePrices()
  }, [])

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
    setStep(prev => Math.min(prev + 1, 4))
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
        selectedPackages: selectedPackages, // Enviar paquetes seleccionados
        members: participants.map((participant) => ({
          name: participant.name,
          title: normalizedGroupName ? `${normalizedGroupName} - ${participant.name}` : participant.name,
          destination_url: FALLBACK_QR_URL,
          email: participant.email,
          size: participant.size,
          is_novio_novia: participant.isNovioNovia,
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
      
      // Guardar QRs pendientes para seguimiento de mockups en Dashboard
      try {
        const pending = Array.isArray(data.pendingMockupCodes) ? data.pendingMockupCodes : []
        if (pending.length) {
          sessionStorage.setItem('elquelo_pending_mockups', JSON.stringify(pending))
          sessionStorage.setItem('elquelo_pending_mockups_startedAt', String(Date.now()))
        }
      } catch {}
      // Mockups se disparan en background desde el servidor
      toast('Generando mockups en segundo plano para todos los productos (20–60s)')
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
           <section className="space-y-6 rounded-2xl border border-gray-200/50 bg-white p-8 shadow-sm">
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
           <section className="space-y-6 rounded-2xl border border-gray-200/50 bg-white p-8 shadow-sm">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Integrantes del grupo</h2>
              <p className="text-sm text-gray-600">Añade los nombres de cada participante. Email y talla son opcionales.</p>
            </div>

             {participants.length === 0 ? (
               <div className="rounded-2xl border border-dashed border-gray-300/60 bg-gray-50/80 p-10 text-center text-sm text-gray-500">
                 Añade al menos un integrante para continuar.
               </div>
            ) : (
              <div className="space-y-4">
                 {participants.map((participant) => (
                   <div key={participant.id} className="rounded-2xl border border-gray-200/40 bg-gray-50/50 p-6">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                      <div className="grid flex-1 gap-4 sm:grid-cols-4">
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
                           <label className="text-sm font-medium text-gray-700">Email <span className="text-gray-400">(opcional)</span></label>
                          <input
                            type="email"
                            value={participant.email}
                            onChange={(event) => updateParticipant(participant.id, { email: event.target.value })}
                            className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm text-gray-900 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-100"
                             placeholder="email@ejemplo.com (opcional)"
                          />
                        </div>
                        <div className="space-y-2">
                           <label className="text-sm font-medium text-gray-700">Talla <span className="text-gray-400">(opcional)</span></label>
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
                        <div className="space-y-2">
                          <label className="text-sm font-medium text-gray-700">Rol</label>
                          <div className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              id={`novio-novia-${participant.id}`}
                              checked={participant.isNovioNovia}
                              onChange={(event) => updateParticipant(participant.id, { isNovioNovia: event.target.checked })}
                              className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                            />
                            <label htmlFor={`novio-novia-${participant.id}`} className="text-sm text-gray-700">
                              💍 Novio/Novia
                            </label>
                          </div>
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
              
              <div className="flex items-center gap-3">
                <button
                  onClick={addParticipant}
                  className="inline-flex items-center gap-2 rounded-full border border-primary-200 px-4 py-2 text-sm font-semibold text-primary-600 transition hover:border-primary-400"
                >
                  <Plus className="h-4 w-4" /> Añadir integrante
                </button>
                
                <button
                  onClick={nextStep}
                  disabled={participants.length === 0}
                  className="inline-flex items-center gap-2 rounded-full bg-primary-600 px-6 py-2 text-sm font-semibold text-white transition hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Siguiente <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          </section>
        )}

         {/* Step 3: Paquetes */}
         {step === 3 && (
           <section className="space-y-6 rounded-2xl border border-gray-200/50 bg-white p-8 shadow-sm">
            <div className="text-center">
              <h2 className="text-xl font-semibold text-gray-900">Selecciona Paquetes</h2>
              <p className="text-sm text-gray-600">Elige los paquetes que quieres incluir en tu despedida.</p>
              <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-800">
                  💡 <strong>Todo es configurable:</strong> Los paquetes son solo una base. Después podrás personalizar tallas, colores, diseños y añadir/quitar productos individualmente.
                </p>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              {/* Renderizar todos los paquetes dinámicamente */}
              {getAllPackages().map((pkg) => {
                const isSelected = selectedPackages.includes(pkg.id)
                const packagePrice = packagePrices[pkg.id] || 0
                
                // Calcular precio total del paquete
                const totalPrice = packagePrice * participants.length
                
                return (
                  <div 
                    key={pkg.id}
                    className={`rounded-2xl border-2 p-6 cursor-pointer transition-all ${
                      isSelected 
                        ? 'border-orange-300 bg-orange-50' 
                        : 'border-gray-200 bg-white hover:border-orange-200'
                    }`} 
                    onClick={() => {
                      if (isSelected) {
                        setSelectedPackages(prev => prev.filter(p => p !== pkg.id))
                      } else {
                        setSelectedPackages(prev => [...prev, pkg.id])
                      }
                    }}
                  >
                    <div className="flex items-center gap-3 mb-3">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => {}}
                        className="h-5 w-5 rounded border-gray-300 text-orange-600 focus:ring-orange-500"
                      />
                      <h3 className="text-lg font-semibold text-gray-900">{pkg.emoji} {pkg.title}</h3>
                      {pkg.onlyForNoviNovia && (
                        <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded-full">
                          Solo Novio/Novia
                        </span>
                      )}
                      {pkg.isMultiProduct && (
                        <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">
                          Pack
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-600 mb-3">
                      {pkg.description}
                    </p>
                    <p className="text-xs text-gray-500 mb-2">
                      ✨ Personalizable: tallas, colores, diseños
                    </p>
                    <div className="text-lg font-bold text-orange-600">
                      {packagePrice > 0 ? `€${Math.round(totalPrice * 100) / 100}` : 'Cargando precio...'}
                      {packagePrice > 0 && participants.length > 1 && (
                        <span className="text-sm text-gray-500 ml-2">
                          (€{Math.round(packagePrice * 100) / 100} × {participants.length})
                        </span>
                      )}
                    </div>
                  </div>
                )
              })}

              {/* Ningún paquete */}
              <div className={`rounded-2xl border-2 p-6 cursor-pointer transition-all ${
                selectedPackages.length === 0
                  ? 'border-gray-400 bg-gray-100' 
                  : 'border-gray-200 bg-white hover:border-gray-300'
              }`} onClick={() => {
                setSelectedPackages([])
              }}>
                <div className="flex items-center gap-3 mb-3">
                  <input
                    type="checkbox"
                    checked={selectedPackages.length === 0}
                    onChange={() => {}}
                    className="h-5 w-5 rounded border-gray-300 text-gray-600 focus:ring-gray-500"
                  />
                  <h3 className="text-lg font-semibold text-gray-900">🚫 Ningún paquete</h3>
                </div>
                <p className="text-sm text-gray-600 mb-3">
                  Solo crear el grupo, sin paquetes adicionales
                </p>
                <div className="text-lg font-bold text-gray-600">
                  €0.00
                </div>
              </div>
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <div className="text-yellow-600 text-lg">⚠️</div>
                <div>
                  <h4 className="text-sm font-semibold text-yellow-800 mb-1">Importante</h4>
                  <p className="text-sm text-yellow-700">
                    Los paquetes son solo una <strong>base inicial</strong>. Una vez creado el grupo, podrás:
                  </p>
                  <ul className="text-sm text-yellow-700 mt-2 space-y-1">
                    <li>• Cambiar tallas y colores de cada producto</li>
                    <li>• Añadir o quitar productos individualmente</li>
                    <li>• Personalizar diseños y textos</li>
                    <li>• Modificar cantidades</li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <button
                onClick={previousStep}
                className="inline-flex items-center gap-2 rounded-full border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 transition hover:border-gray-300"
              >
                <ArrowLeft className="h-4 w-4" /> Anterior
              </button>
              <button
                onClick={nextStep}
                className="inline-flex items-center gap-2 rounded-full bg-primary-600 px-6 py-2 text-sm font-semibold text-white transition hover:bg-primary-700"
              >
                Siguiente <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </section>
        )}

         {/* Step 4: Crear Grupo */}
         {step === 4 && (
           <section className="space-y-6 rounded-2xl border border-gray-200/50 bg-white p-8 shadow-sm">
            <div className="text-center">
              <h2 className="text-xl font-semibold text-gray-900">Crear Grupo</h2>
              <p className="text-sm text-gray-600">Revisa los integrantes y crea el grupo para empezar a diseñar.</p>
            </div>

             {/* Resumen de participantes */}
             <div className="bg-gray-50/80 rounded-2xl p-6">
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
                         {participant.email && (
                           <div className="text-sm text-gray-500">{participant.email}</div>
                         )}
                       </div>
                     </div>
                     <div className="text-sm text-gray-500">
                       {participant.size && `Talla: ${participant.size}`}
                       {participant.isNovioNovia && (
                         <span className="ml-2 text-pink-600 font-medium">💍 Novio/Novia</span>
                       )}
                     </div>
              </div>
                ))}
              </div>
            </div>

             {participants.length === 0 ? (
               <div className="rounded-2xl border border-dashed border-gray-300/60 bg-gray-50/80 p-10 text-center text-sm text-gray-500">
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
                 <div className="bg-green-50/80 border border-green-200/60 rounded-2xl p-6">
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

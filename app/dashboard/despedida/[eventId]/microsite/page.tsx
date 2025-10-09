'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Header } from '@/components/Header'
import { Footer } from '@/components/Footer'
import { Loader2, ArrowLeft, ExternalLink, Plus, Trash2, GripVertical, Sparkles } from 'lucide-react'
import { toast } from 'react-hot-toast'
import { MicrositeTemplateLibrary } from '@/components/despedida/MicrositeTemplateLibrary'
import { MicrositeTemplate } from '@/lib/microsite-templates'

type Section = {
  id: string
  type: 'hero' | 'agenda' | 'ubicacion' | 'texto'
  title: string
  content: string
  order: number
}

export default function MicrositeConfigPage() {
  const params = useParams<{ eventId: string }>()
  const router = useRouter()
  const eventId = params.eventId
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [showTemplates, setShowTemplates] = useState(false)
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | undefined>()
  const [settings, setSettings] = useState({
    title: '',
    subtitle: '',
    heroImage: '',
    primaryColor: '#4f46e5',
  })
  const [sections, setSections] = useState<Section[]>([
    { id: '1', type: 'hero', title: 'Bienvenida', content: '', order: 0 },
    { id: '2', type: 'agenda', title: 'Agenda', content: '', order: 1 },
  ])

  useEffect(() => {
    const loadEvent = async () => {
      try {
        const response = await fetch(`/api/events/${eventId}/summary`)
        if (response.ok) {
          const data = await response.json()
          
          const micrositeModule = data.modules?.find((m: any) => m.type === 'microsite')
          if (micrositeModule?.settings) {
            setSettings({
              title: micrositeModule.settings.title || data.event.name || '',
              subtitle: micrositeModule.settings.subtitle || '',
              heroImage: micrositeModule.settings.heroImage || '',
              primaryColor: micrositeModule.settings.primaryColor || '#4f46e5',
            })
            
            if (micrositeModule.settings.sections) {
              setSections(micrositeModule.settings.sections)
            }
          } else {
            setSettings(prev => ({
              ...prev,
              title: data.event.name || 'Mi Evento',
            }))
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
      const response = await fetch(`/api/events/${eventId}/modules/microsite`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'active',
          settings: {
            ...settings,
            sections,
          },
        }),
      })

      if (!response.ok) throw new Error('Error guardando configuración')

      toast.success('Microsite guardado')
    } catch (error) {
      console.error(error)
      toast.error('Error guardando microsite')
    } finally {
      setSaving(false)
    }
  }

  const addSection = (type: Section['type']) => {
    const newSection: Section = {
      id: Date.now().toString(),
      type,
      title: type === 'agenda' ? 'Agenda' : type === 'ubicacion' ? 'Ubicación' : 'Nueva sección',
      content: '',
      order: sections.length,
    }
    setSections([...sections, newSection])
  }

  const removeSection = (id: string) => {
    setSections(sections.filter(s => s.id !== id))
  }

  const updateSection = (id: string, updates: Partial<Section>) => {
    setSections(sections.map(s => s.id === id ? { ...s, ...updates } : s))
  }

  const handleSelectTemplate = (template: MicrositeTemplate) => {
    setSelectedTemplateId(template.id)
    
    // Aplicar configuración de la plantilla
    setSettings({
      title: template.sections.find(s => s.type === 'hero')?.title.replace('[NOMBRE]', settings.title || 'Invitado') || template.name,
      subtitle: template.sections.find(s => s.type === 'hero')?.content || '',
      heroImage: template.sections.find(s => s.settings?.imageUrl)?.settings?.imageUrl || '',
      primaryColor: template.colors.primary,
    })

    // Convertir secciones de plantilla a formato local
    const convertedSections: Section[] = template.sections
      .filter(s => ['hero', 'agenda', 'ubicacion', 'countdown', 'rules', 'dress_code', 'trivia', 'faq', 'gallery', 'team', 'poll', 'map', 'contact', 'custom'].includes(s.type))
      .map((s, idx) => ({
        id: s.id,
        type: s.type === 'countdown' || s.type === 'rules' || s.type === 'dress_code' || s.type === 'trivia' || s.type === 'faq' || s.type === 'gallery' || s.type === 'team' || s.type === 'poll' || s.type === 'map' || s.type === 'contact' || s.type === 'custom' ? 'texto' : s.type,
        title: s.title,
        content: s.content,
        order: idx,
      }))

    setSections(convertedSections)
    setShowTemplates(false)
    toast.success(`Plantilla "${template.name}" aplicada`)
  }

  const getMicrositeUrl = () => {
    return `${window.location.origin}/e/${eventId}/microsite`
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
      </div>
    )
  }

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

        <div className="mb-8 flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Configuración del Microsite</h1>
            <p className="mt-2 text-gray-600">
              Crea una landing page con toda la información del evento
            </p>
          </div>
          <button
            onClick={() => setShowTemplates(!showTemplates)}
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg hover:shadow-xl transition-all"
          >
            <Sparkles className="h-4 w-4" />
            {showTemplates ? 'Ocultar' : 'Ver'} Plantillas
          </button>
        </div>

        {/* Biblioteca de plantillas */}
        {showTemplates && (
          <div className="mb-8 rounded-2xl border-2 border-purple-200 bg-gradient-to-br from-purple-50 to-pink-50 p-6">
            <MicrositeTemplateLibrary
              onSelectTemplate={handleSelectTemplate}
              currentTemplateId={selectedTemplateId}
            />
          </div>
        )}

        <div className="space-y-6">
          {/* Configuración general */}
          <section className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-gray-900">Configuración general</h2>
            <div className="mt-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Título del evento
                </label>
                <input
                  type="text"
                  value={settings.title}
                  onChange={(e) => setSettings(prev => ({ ...prev, title: e.target.value }))}
                  className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm"
                  placeholder="Despedida de Juan"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Subtítulo
                </label>
                <input
                  type="text"
                  value={settings.subtitle}
                  onChange={(e) => setSettings(prev => ({ ...prev, subtitle: e.target.value }))}
                  className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm"
                  placeholder="20-22 de Junio | Barcelona"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  URL de imagen principal
                </label>
                <input
                  type="url"
                  value={settings.heroImage}
                  onChange={(e) => setSettings(prev => ({ ...prev, heroImage: e.target.value }))}
                  className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm"
                  placeholder="https://..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Color principal
                </label>
                <div className="mt-1 flex items-center gap-2">
                  <input
                    type="color"
                    value={settings.primaryColor}
                    onChange={(e) => setSettings(prev => ({ ...prev, primaryColor: e.target.value }))}
                    className="h-10 w-20 rounded-lg border border-gray-200"
                  />
                  <input
                    type="text"
                    value={settings.primaryColor}
                    onChange={(e) => setSettings(prev => ({ ...prev, primaryColor: e.target.value }))}
                    className="flex-1 rounded-xl border border-gray-200 px-3 py-2 text-sm font-mono"
                  />
                </div>
              </div>
            </div>
          </section>

          {/* Secciones */}
          <section className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">Secciones del microsite</h2>
              <div className="flex gap-2">
                <button
                  onClick={() => addSection('texto')}
                  className="inline-flex items-center gap-1 rounded-lg border border-primary-200 px-3 py-1.5 text-xs font-semibold text-primary-700 hover:bg-primary-50"
                >
                  <Plus className="h-3 w-3" /> Texto
                </button>
                <button
                  onClick={() => addSection('agenda')}
                  className="inline-flex items-center gap-1 rounded-lg border border-primary-200 px-3 py-1.5 text-xs font-semibold text-primary-700 hover:bg-primary-50"
                >
                  <Plus className="h-3 w-3" /> Agenda
                </button>
                <button
                  onClick={() => addSection('ubicacion')}
                  className="inline-flex items-center gap-1 rounded-lg border border-primary-200 px-3 py-1.5 text-xs font-semibold text-primary-700 hover:bg-primary-50"
                >
                  <Plus className="h-3 w-3" /> Ubicación
                </button>
              </div>
            </div>

            <div className="mt-4 space-y-3">
              {sections.map((section, index) => (
                <div key={section.id} className="rounded-xl border border-gray-200 bg-gray-50 p-4">
                  <div className="flex items-start gap-3">
                    <GripVertical className="h-5 w-5 text-gray-400 mt-1 cursor-move" />
                    <div className="flex-1 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                          {section.type}
                        </span>
                        <button
                          onClick={() => removeSection(section.id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                      <input
                        type="text"
                        value={section.title}
                        onChange={(e) => updateSection(section.id, { title: e.target.value })}
                        className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm font-medium"
                        placeholder="Título de la sección"
                      />
                      <textarea
                        value={section.content}
                        onChange={(e) => updateSection(section.id, { content: e.target.value })}
                        rows={3}
                        className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
                        placeholder={
                          section.type === 'agenda' ? 'Viernes 20:00 - Cena\nSábado 10:00 - Actividades...' :
                          section.type === 'ubicacion' ? 'Hotel Majestic, Barcelona...' :
                          'Contenido de la sección...'
                        }
                      />
                    </div>
                  </div>
                </div>
              ))}

              {sections.length === 0 && (
                <p className="text-center text-sm text-gray-500 py-8">
                  No hay secciones. Añade una usando los botones de arriba.
                </p>
              )}
            </div>
          </section>

          {/* URL pública */}
          <section className="rounded-3xl border border-green-200 bg-green-50 p-6">
            <h3 className="text-sm font-semibold text-green-900">URL del microsite</h3>
            <div className="mt-3 flex items-center gap-2">
              <input
                type="text"
                readOnly
                value={getMicrositeUrl()}
                className="flex-1 rounded-lg border border-green-300 bg-white px-3 py-2 text-sm font-mono"
              />
              <button
                onClick={() => {
                  navigator.clipboard.writeText(getMicrositeUrl())
                  toast.success('URL copiada')
                }}
                className="rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-700"
              >
                Copiar
              </button>
              <a
                href={getMicrositeUrl()}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-700"
              >
                <ExternalLink className="h-4 w-4" />
                Ver
              </a>
            </div>
          </section>

          {/* Guardar */}
          <div className="flex justify-end">
            <button
              onClick={handleSaveSettings}
              disabled={saving}
              className="inline-flex items-center gap-2 rounded-xl bg-primary-600 px-6 py-3 text-sm font-semibold text-white hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              Guardar microsite
            </button>
          </div>
        </div>
      </div>
      <Footer />
    </main>
  )
}


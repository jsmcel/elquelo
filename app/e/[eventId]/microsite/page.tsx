import { createServiceSupabaseClient } from '@/lib/supabaseServer'
import { notFound } from 'next/navigation'

const supabase = createServiceSupabaseClient()

export const dynamic = 'force-dynamic'
export const revalidate = 0

interface MicrositePageProps {
  params: { eventId: string }
}

export default async function PublicMicrositePage({ params }: MicrositePageProps) {
  const { eventId } = params

  const { data: event } = await supabase
    .from('events')
    .select('id, name, description, event_date')
    .eq('id', eventId)
    .single()

  if (!event) {
    notFound()
  }

  const { data: micrositeModule } = await supabase
    .from('event_modules')
    .select('settings')
    .eq('event_id', eventId)
    .eq('type', 'microsite')
    .eq('status', 'active')
    .single()

  const settings = micrositeModule?.settings || {
    title: event.name || 'Evento',
    subtitle: '',
    heroImage: '',
    primaryColor: '#6366f1',
    sections: []
  }

  const sections = settings.sections || []

  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100">
      {/* Hero Moderno */}
      <div
        className="relative min-h-[70vh] flex items-center justify-center overflow-hidden"
        style={{
          background: settings.heroImage 
            ? `linear-gradient(rgba(0,0,0,0.5), rgba(0,0,0,0.6)), url(${settings.heroImage})`
            : `linear-gradient(135deg, ${settings.primaryColor}dd 0%, ${settings.primaryColor} 100%)`,
          backgroundSize: 'cover',
          backgroundPosition: 'center'
        }}
      >
        {/* Decoración de fondo */}
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-10 left-10 w-72 h-72 bg-white rounded-full blur-3xl"></div>
          <div className="absolute bottom-10 right-10 w-96 h-96 bg-white rounded-full blur-3xl"></div>
        </div>

        <div className="relative z-10 text-center px-6 max-w-5xl">
          <h1 className="text-6xl md:text-8xl font-black text-white mb-6 drop-shadow-2xl">
            {settings.title}
          </h1>
          {settings.subtitle && (
            <p className="text-2xl md:text-3xl text-white/90 font-light drop-shadow-lg max-w-3xl mx-auto">
              {settings.subtitle}
            </p>
          )}
          <div className="mt-8 flex items-center justify-center gap-4">
            <div className="px-6 py-3 rounded-full bg-white/20 backdrop-blur-md border border-white/30 text-white font-semibold">
              {new Date(event.event_date).toLocaleDateString('es-ES', {
                day: 'numeric',
                month: 'long',
                year: 'numeric'
              })}
            </div>
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 animate-bounce">
          <svg className="w-6 h-6 text-white" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
            <path d="M19 14l-7 7m0 0l-7-7m7 7V3"></path>
          </svg>
        </div>
      </div>

      {/* Contenido de secciones */}
      <div className="max-w-6xl mx-auto px-6 py-16 space-y-20">
        {sections.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-8xl mb-6">🎉</div>
            <h2 className="text-3xl font-bold text-gray-900 mb-3">
              Microsite en construcción
            </h2>
            <p className="text-xl text-gray-600">
              ¡Pronto estará listo para la despedida!
            </p>
          </div>
        ) : (
          sections
            .sort((a: any, b: any) => a.order - b.order)
            .map((section: any) => (
              <SectionRenderer key={section.id} section={section} primaryColor={settings.primaryColor} />
            ))
        )}
      </div>

      {/* Footer bonito */}
      <footer className="bg-gray-900 text-white py-12 mt-20">
        <div className="max-w-6xl mx-auto px-6 text-center">
          <p className="text-lg opacity-75">
            Creado con ❤️ por el grupo para una despedida inolvidable
          </p>
          <div className="mt-4 flex items-center justify-center gap-2">
            <span className="text-sm opacity-50">Powered by</span>
            <span className="font-bold text-lg bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
              ELQUELO
            </span>
          </div>
        </div>
      </footer>
    </main>
  )
}

// ==================== RENDER DE SECCIONES ====================

function SectionRenderer({ section, primaryColor }: any) {
  switch (section.type) {
    case 'agenda':
      return <AgendaSection section={section} primaryColor={primaryColor} />
    case 'ubicacion':
      return <UbicacionSection section={section} primaryColor={primaryColor} />
    default:
      return <TextoSection section={section} primaryColor={primaryColor} />
  }
}

function AgendaSection({ section, primaryColor }: any) {
  const lines = section.content.split('\n').filter((l: string) => l.trim())

  return (
    <section className="relative">
      <div className="text-center mb-12">
        <h2 className="text-5xl font-black text-gray-900 mb-3">
          {section.title}
        </h2>
        <div className="w-24 h-1 mx-auto rounded-full" style={{ backgroundColor: primaryColor }}></div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {lines.map((line: string, idx: number) => (
          <div
            key={idx}
            className="group relative bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all p-6 border-l-4"
            style={{ borderLeftColor: primaryColor }}
          >
            <div className="flex items-start gap-4">
              <div
                className="flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-lg"
                style={{ backgroundColor: primaryColor }}
              >
                {idx + 1}
              </div>
              <div className="flex-1">
                <p className="text-lg text-gray-800 leading-relaxed">{line}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}

function UbicacionSection({ section, primaryColor }: any) {
  return (
    <section className="relative">
      <div className="text-center mb-12">
        <h2 className="text-5xl font-black text-gray-900 mb-3">
          {section.title}
        </h2>
        <div className="w-24 h-1 mx-auto rounded-full" style={{ backgroundColor: primaryColor }}></div>
      </div>

      <div className="bg-white rounded-3xl shadow-2xl p-10">
        <div className="prose prose-lg max-w-none text-gray-700">
          {section.content.split('\n').map((line: string, i: number) => (
            <p key={i} className="text-xl mb-3">{line}</p>
          ))}
        </div>
        {section.settings?.mapsUrl && (
          <a
            href={section.settings.mapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-8 inline-flex items-center gap-3 px-8 py-4 rounded-full text-white font-bold text-lg shadow-xl hover:shadow-2xl transition-all hover:scale-105"
            style={{ backgroundColor: primaryColor }}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            Abrir en Google Maps
          </a>
        )}
      </div>
    </section>
  )
}

function TextoSection({ section, primaryColor }: any) {
  return (
    <section className="relative">
      <div className="text-center mb-12">
        <h2 className="text-5xl font-black text-gray-900 mb-3">
          {section.title}
        </h2>
        <div className="w-24 h-1 mx-auto rounded-full" style={{ backgroundColor: primaryColor }}></div>
      </div>

      <div className="bg-white rounded-3xl shadow-2xl p-10">
        <div className="prose prose-xl max-none text-gray-700 leading-relaxed">
          {section.content.split('\n').map((line: string, i: number) => (
            <p key={i} className="mb-4">{line}</p>
          ))}
        </div>
      </div>
    </section>
  )
}




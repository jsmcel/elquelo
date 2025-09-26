import { Header } from '@/components/Header'
import { Footer } from '@/components/Footer'
import { EventCard } from '@/components/EventCard'
import { Users, Calendar, MapPin, Phone, Mail } from 'lucide-react'

const events = [
  {
    id: '1',
    name: 'Team Building Tech',
    description: 'Camisetas personalizadas para tu equipo de desarrollo. Diseño corporativo con QR que lleva a la página del equipo.',
    image: '/images/events/team-building.jpg',
    price: 25.99,
    minOrder: 10,
    features: ['Diseño personalizado', 'QR corporativo', 'Logotipo de empresa', 'Colores corporativos']
  },
  {
    id: '2',
    name: 'Despedida de Soltero',
    description: 'Camisetas únicas para la despedida más épica. QR con contenido especial y sorpresas para el novio.',
    image: '/images/events/despedida.jpg',
    price: 19.99,
    minOrder: 5,
    features: ['Diseño temático', 'QR con sorpresas', 'Personalización total', 'Entrega rápida']
  },
  {
    id: '3',
    name: 'Evento Corporativo',
    description: 'Camisetas profesionales para conferencias, lanzamientos de producto o eventos de empresa.',
    image: '/images/events/corporativo.jpg',
    price: 22.99,
    minOrder: 20,
    features: ['Diseño profesional', 'QR del evento', 'Materiales premium', 'Descuentos por volumen']
  }
]

export default function EventosPage() {
  return (
    <main className="min-h-screen bg-gray-50">
      <Header />
      
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-blue-50 to-cyan-50 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
              Eventos
              <span className="text-blue-600 block">Personalizados</span>
            </h1>
            <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
              Camisetas únicas para tus eventos especiales. Team building, despedidas, 
              conferencias y más. Diseño personalizado con QR interactivo.
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 max-w-4xl mx-auto">
              <div className="bg-white p-6 rounded-xl shadow-sm">
                <Users className="w-8 h-8 text-blue-600 mx-auto mb-3" />
                <h3 className="font-semibold text-gray-900 mb-2">Team Building</h3>
                <p className="text-sm text-gray-600">Fortalece tu equipo</p>
              </div>
              <div className="bg-white p-6 rounded-xl shadow-sm">
                <Calendar className="w-8 h-8 text-blue-600 mx-auto mb-3" />
                <h3 className="font-semibold text-gray-900 mb-2">Despedidas</h3>
                <p className="text-sm text-gray-600">Momentos únicos</p>
              </div>
              <div className="bg-white p-6 rounded-xl shadow-sm">
                <MapPin className="w-8 h-8 text-blue-600 mx-auto mb-3" />
                <h3 className="font-semibold text-gray-900 mb-2">Conferencias</h3>
                <p className="text-sm text-gray-600">Eventos profesionales</p>
              </div>
              <div className="bg-white p-6 rounded-xl shadow-sm">
                <Phone className="w-8 h-8 text-blue-600 mx-auto mb-3" />
                <h3 className="font-semibold text-gray-900 mb-2">Soporte</h3>
                <p className="text-sm text-gray-600">Asistencia personalizada</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Events Grid */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Tipos de Eventos
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Desde team building hasta despedidas, tenemos la solución perfecta para tu evento
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {events.map((event) => (
              <EventCard key={event.id} event={event} />
            ))}
          </div>
        </div>
      </section>

      {/* Process Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              ¿Cómo funciona?
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Proceso simple para personalizar tu evento
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-2xl font-bold text-blue-600">1</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">
                Contacta con Nosotros
              </h3>
              <p className="text-gray-600">
                Cuéntanos sobre tu evento y te ayudaremos a diseñar la solución perfecta.
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-2xl font-bold text-blue-600">2</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">
                Diseño Personalizado
              </h3>
              <p className="text-gray-600">
                Creamos el diseño perfecto para tu evento con tu logo y colores corporativos.
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-2xl font-bold text-blue-600">3</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">
                Producción
              </h3>
              <p className="text-gray-600">
                Imprimimos y preparamos todas las camisetas con la máxima calidad.
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-2xl font-bold text-blue-600">4</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">
                Entrega
              </h3>
              <p className="text-gray-600">
                Te entregamos todas las camisetas listas para tu evento especial.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section className="py-20 bg-blue-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
              ¿Tienes un Evento en Mente?
            </h2>
            <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
              Contacta con nosotros y te ayudaremos a crear la experiencia perfecta para tu evento
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a 
                href="mailto:eventos@elquelo.com"
                className="bg-white text-blue-600 px-8 py-4 rounded-lg font-semibold hover:bg-blue-50 transition-colors flex items-center justify-center space-x-2"
              >
                <Mail className="w-5 h-5" />
                <span>eventos@elquelo.com</span>
              </a>
              <a 
                href="tel:+34600000000"
                className="bg-blue-700 text-white px-8 py-4 rounded-lg font-semibold hover:bg-blue-800 transition-colors flex items-center justify-center space-x-2"
              >
                <Phone className="w-5 h-5" />
                <span>+34 600 000 000</span>
              </a>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  )
}
